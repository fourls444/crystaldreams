import { getSupabaseAdmin } from "@/utils/supabase";
import { sendAdminNotification } from "@/utils/notify";

export interface VerifySlipResult {
  success: boolean;
  verified: boolean;
  message: string;
  error?: string;
  fallback?: boolean;
  mode?: "sandbox" | "live" | "manual";
}

/**
 * Core business logic to verify an order's payment slip using EasySlip API.
 * Performs anti-fraud checks, amount validation, stock deduction/restoration, and sends notifications.
 */
export async function verifyOrderSlip(orderId: string): Promise<VerifySlipResult> {
  const supabaseAdmin = getSupabaseAdmin();

  try {
    // 1. Fetch Order and product details
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("*, products(name, stock, price)")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      console.error(`[Verify Service] Fetch order error for ID ${orderId}:`, orderError);
      return {
        success: false,
        verified: false,
        message: "ไม่พบคำสั่งซื้อนี้ในระบบ",
        error: "Order not found",
      };
    }

    // If order is already verified, return success directly
    if (order.status === "verified") {
      return {
        success: true,
        verified: true,
        mode: "live",
        message: "คำสั่งซื้อนี้ได้รับการยืนยันชำระเงินเรียบร้อยแล้ว",
      };
    }

    // Sandbox Check: Mock Mode triggers if EASYSLIP_SANDBOX is 'true', EASYSLIP_API_KEY is 'mock', or API Key is blank
    const isSandbox =
      process.env.EASYSLIP_SANDBOX === "true" ||
      process.env.EASYSLIP_API_KEY === "mock" ||
      !process.env.EASYSLIP_API_KEY;

    let slipVerified = false;
    let verifiedBy = "auto";
    let transRef = "";
    let amountPaid = 0;
    let senderName = "";

    if (isSandbox) {
      console.log(`[Verify Service] [EasySlip Sandbox Mode] Mock verifying order: ${orderId}`);
      slipVerified = true;
      transRef = `MOCK_REF_${Date.now()}`;
      verifiedBy = `sandbox:${transRef}`;
      amountPaid = Number(order.total_amount);
      senderName = "MOCK TESTER";
    } else {
      // --- Real EasySlip API Verification ---
      if (!order.slip_url) {
        return {
          success: false,
          verified: false,
          message: "ไม่พบหลักฐานการโอนเงิน (รูปภาพสลิป)",
          error: "Missing slip URL",
        };
      }

      // Download slip file from Supabase Storage public url
      const imageResponse = await fetch(order.slip_url);
      if (!imageResponse.ok) {
        return {
          success: false,
          verified: false,
          message: "ไม่สามารถเข้าถึงรูปภาพสลิปที่เก็บไว้ได้",
          error: "Failed to fetch slip image",
        };
      }
      
      const imageBlob = await imageResponse.blob();
      const formData = new FormData();
      formData.append("image", imageBlob, "slip.png");

      const verifyRes = await fetch("https://developer.easyslip.com/api/v1/verify", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.EASYSLIP_API_KEY}`,
        },
        body: formData,
      });

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok || verifyData.status !== 200) {
        console.error("[Verify Service] EasySlip API failure:", verifyData);

        // Fallback: update status to slip_uploaded but queue for manual confirmation
        await supabaseAdmin
          .from("orders")
          .update({
            status: "slip_uploaded",
            verified_by: "pending_manual_api_failed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", orderId);

        // Notify admin about the API failure and manual queue
        await sendAdminNotification({
          orderId,
          customerName: order.customer_name || "ไม่ระบุชื่อ",
          customerTel: order.customer_tel || "ไม่ระบุเบอร์โทร",
          customerAddress: order.customer_address || "ไม่ระบุที่อยู่",
          customerLine: order.customer_line || undefined,
          amount: Number(order.total_amount),
          slipUrl: order.slip_url,
          status: "slip_uploaded",
          senderName: "ระบบตรวจสลิปขัดข้อง",
        }).catch((err) => console.error("[Verify Service] Fallback notification failed:", err));

        return {
          success: false,
          verified: false,
          fallback: true,
          message: verifyData.message || "ระบบไม่สามารถตรวจสอบสลิปโอนเงินนี้ได้โดยอัตโนมัติ",
          error: "EasySlip API error, queued for manual approval",
        };
      }

      const slipDetails = verifyData.data;
      transRef = slipDetails.transRef;
      amountPaid = slipDetails.amount;
      senderName = slipDetails.sender?.name || "ไม่ทราบชื่อ";

      // 1. Anti-Fraud: check if this transaction reference (transRef) has been used in another order
      const { data: duplicateRef } = await supabaseAdmin
        .from("orders")
        .select("id")
        .eq("slip_verified", true)
        .like("verified_by", `%:${transRef}`)
        .neq("id", orderId)
        .maybeSingle();

      if (duplicateRef) {
        console.warn(`[Verify Service] Fraud Alert: Duplicate slip reuse detected! transRef: ${transRef}, duplicate order ID: ${duplicateRef.id}`);
        
        // Double spending / Slip reuse detected -> reject order
        await supabaseAdmin
          .from("orders")
          .update({
            status: "rejected",
            verified_by: `rejected_duplicate_ref:${transRef}`,
            updated_at: new Date().toISOString(),
          })
          .eq("id", orderId);

        // Return stock back
        if (order.items && Array.isArray(order.items)) {
          const cartItems = order.items as Array<{ product_id: string; quantity: number }>;
          for (const item of cartItems) {
            const { data: prod } = await supabaseAdmin
              .from("products")
              .select("stock")
              .eq("id", item.product_id)
              .single();
            if (prod) {
              await supabaseAdmin
                .from("products")
                .update({
                  stock: prod.stock + item.quantity,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", item.product_id);
            }
          }
        } else {
          const currentStock = order.products?.stock ?? 0;
          await supabaseAdmin
            .from("products")
            .update({
              stock: currentStock + order.quantity,
              updated_at: new Date().toISOString(),
            })
            .eq("id", order.product_id);
        }

        // Notify admin about the fraud alert
        await sendAdminNotification({
          orderId,
          customerName: order.customer_name || "ไม่ระบุชื่อ",
          customerTel: order.customer_tel || "ไม่ระบุเบอร์โทร",
          customerAddress: order.customer_address || "ไม่ระบุที่อยู่",
          customerLine: order.customer_line || undefined,
          amount: amountPaid,
          slipUrl: order.slip_url,
          status: "rejected",
          senderName: `ตรวจพบสลิปซ้ำ (Fraud: ${transRef})`,
        }).catch((err) => console.error("[Verify Service] Fraud notification failed:", err));

        return {
          success: false,
          verified: false,
          message: "สลิปนี้เคยถูกใช้ชำระเงินในรายการคำสั่งซื้ออื่นสำเร็จไปแล้ว",
          error: "Slip reused fraud detected",
        };
      }

      // 2. Validate Recipient Name: check if the receiver's name matches our shop name (if configured)
      const expectedReceiver = process.env.SHOP_RECEIVER_NAME;
      if (expectedReceiver) {
        const receiverObj = slipDetails.receiver || {};
        const receiverName = receiverObj.name || receiverObj.displayName || "";
        const cleanExpected = expectedReceiver.replace(/\s+/g, "").toLowerCase();
        const cleanActual = receiverName.replace(/\s+/g, "").toLowerCase();
        
        if (cleanActual && !cleanActual.includes(cleanExpected) && !cleanExpected.includes(cleanActual)) {
          console.warn(`[Verify Service] Recipient mismatch: Expected: ${expectedReceiver}, Actual: ${receiverName}`);
          
          await supabaseAdmin
            .from("orders")
            .update({
              status: "slip_uploaded",
              verified_by: `pending_manual_recipient_mismatch_receiver_${receiverName}`,
              updated_at: new Date().toISOString(),
            })
            .eq("id", orderId);

          // Notify admin about the recipient mismatch
          await sendAdminNotification({
            orderId,
            customerName: order.customer_name || "ไม่ระบุชื่อ",
            customerTel: order.customer_tel || "ไม่ระบุเบอร์โทร",
            customerAddress: order.customer_address || "ไม่ระบุที่อยู่",
            customerLine: order.customer_line || undefined,
            amount: amountPaid,
            slipUrl: order.slip_url,
            status: "slip_uploaded",
            senderName: `บัญชีผู้รับไม่ตรง (ผู้รับ: ${receiverName})`,
          }).catch((err) => console.error("[Verify Service] Recipient mismatch notification failed:", err));

          return {
            success: false,
            verified: false,
            fallback: true,
            message: `บัญชีผู้รับโอนไม่ถูกต้อง (ผู้รับโอนคือ ${receiverName} แต่ต้องโอนให้ ${expectedReceiver})`,
            error: "Recipient name mismatch, queued for manual approval",
          };
        }
      }

      // 3. Validate Transfer Date: check if the payment is within 24 hours of order creation
      if (slipDetails.transDate) {
        try {
          const year = parseInt(slipDetails.transDate.substring(0, 4));
          const month = parseInt(slipDetails.transDate.substring(4, 6)) - 1; // 0-indexed month
          const day = parseInt(slipDetails.transDate.substring(6, 8));
          
          let hour = 0;
          let minute = 0;
          let second = 0;
          if (slipDetails.transTime) {
            const timeParts = slipDetails.transTime.split(":");
            if (timeParts.length >= 3) {
              hour = parseInt(timeParts[0]);
              minute = parseInt(timeParts[1]);
              second = parseInt(timeParts[2]);
            }
          }
          
          const transferDate = new Date(year, month, day, hour, minute, second);
          const orderDate = new Date(order.created_at);
          const diffInMs = Math.abs(orderDate.getTime() - transferDate.getTime());
          const diffInHours = diffInMs / (1000 * 60 * 60);
          
          if (diffInHours > 24) {
            console.warn(`[Verify Service] Transfer date too old: Order created: ${orderDate.toISOString()}, Slip transfer date: ${transferDate.toISOString()}`);
            
            await supabaseAdmin
              .from("orders")
              .update({
                status: "slip_uploaded",
                verified_by: `pending_manual_slip_expired_transfer_date_${slipDetails.transDate}`,
                updated_at: new Date().toISOString(),
              })
              .eq("id", orderId);

            // Notify admin about the expired slip date
            await sendAdminNotification({
              orderId,
              customerName: order.customer_name || "ไม่ระบุชื่อ",
              customerTel: order.customer_tel || "ไม่ระบุเบอร์โทร",
              customerAddress: order.customer_address || "ไม่ระบุที่อยู่",
              customerLine: order.customer_line || undefined,
              amount: amountPaid,
              slipUrl: order.slip_url,
              status: "slip_uploaded",
              senderName: `สลิปเก่าเกิน 24 ชม. (โอนวันที่: ${day}/${month + 1}/${year})`,
            }).catch((err) => console.error("[Verify Service] Expired slip date notification failed:", err));

            return {
              success: false,
              verified: false,
              fallback: true,
              message: "สลิปโอนเงินนี้เก่าเกินไป (ทำรายการห่างจากเวลาสั่งซื้อเกิน 24 ชั่วโมง)",
              error: "Slip date expired, queued for manual approval",
            };
          }
        } catch (dateErr) {
          console.error("[Verify Service] Failed to validate slip transfer date:", dateErr);
        }
      }

      // 4. Validate Amount: verify that amount paid matches order total_amount
      if (amountPaid !== Number(order.total_amount)) {
        console.warn(`[Verify Service] Amount mismatch: Expected ${order.total_amount}, Paid: ${amountPaid}`);
        
        await supabaseAdmin
          .from("orders")
          .update({
            status: "slip_uploaded",
            verified_by: `pending_manual_amount_mismatch_paid_${amountPaid}`,
            updated_at: new Date().toISOString(),
          })
          .eq("id", orderId);

        // Notify admin about the amount mismatch
        await sendAdminNotification({
          orderId,
          customerName: order.customer_name || "ไม่ระบุชื่อ",
          customerTel: order.customer_tel || "ไม่ระบุเบอร์โทร",
          customerAddress: order.customer_address || "ไม่ระบุที่อยู่",
          customerLine: order.customer_line || undefined,
          amount: amountPaid,
          slipUrl: order.slip_url,
          status: "slip_uploaded",
          senderName: `ยอดเงินไม่ตรง (โอน ${amountPaid} / ยอด ${order.total_amount})`,
        }).catch((err) => console.error("[Verify Service] Mismatch notification failed:", err));

        return {
          success: false,
          verified: false,
          fallback: true,
          message: `ยอดเงินในสลิปไม่ตรงกับยอดที่ต้องชำระ (โอนมา ${amountPaid} บาท แต่ยอดชำระคือ ${order.total_amount} บาท)`,
          error: "Amount mismatch, queued for manual approval",
        };
      }

      slipVerified = true;
      verifiedBy = `auto:${transRef}`;
    }

    // 3. Write verified state to DB
    const { error: updateOrderError } = await supabaseAdmin
      .from("orders")
      .update({
        status: "verified",
        slip_verified: slipVerified,
        verified_by: verifiedBy,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (updateOrderError) {
      throw new Error(`Failed to update order status in DB: ${updateOrderError.message}`);
    }

    // 4. Trigger LINE OA / Email Notification directly from server
    await sendAdminNotification({
      orderId,
      customerName: order.customer_name || "ไม่ระบุชื่อ",
      customerTel: order.customer_tel || "ไม่ระบุเบอร์โทร",
      customerAddress: order.customer_address || "ไม่ระบุที่อยู่",
      customerLine: order.customer_line || undefined,
      amount: amountPaid,
      slipUrl: order.slip_url || undefined,
      status: "verified",
      senderName,
      mode: isSandbox ? "sandbox" : "live",
    }).catch((err) => console.error("[Verify Service] Notification failed:", err));

    return {
      success: true,
      verified: true,
      mode: isSandbox ? "sandbox" : "live",
      message: "ยืนยันการชำระเงินและหักสต็อกสินค้าสำเร็จ",
    };

  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Internal error";
    console.error(`[Verify Service] Tech failure during verify of order ${orderId}:`, error);
    return {
      success: false,
      verified: false,
      message: "เกิดข้อผิดพลาดทางเทคนิคในการตรวจสอบสลิป",
      error: errMsg,
    };
  }
}
