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
        const currentStock = order.products?.stock ?? 0;
        await supabaseAdmin
          .from("products")
          .update({
            stock: currentStock + order.quantity,
            updated_at: new Date().toISOString(),
          })
          .eq("id", order.product_id);

        // Notify admin about the fraud alert
        await sendAdminNotification({
          orderId,
          customerName: order.customer_name || "ไม่ระบุชื่อ",
          customerTel: order.customer_tel || "ไม่ระบุเบอร์โทร",
          customerAddress: order.customer_address || "ไม่ระบุที่อยู่",
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

      // 2. Validate Amount: verify that amount paid matches order total_amount
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
