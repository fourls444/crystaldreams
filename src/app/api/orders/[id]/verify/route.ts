import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/utils/supabase";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;

    if (!orderId) {
      return NextResponse.json(
        { error: "กรุณาระบุหมายเลขคำสั่งซื้อ" },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 1. Fetch Order and product details
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("*, products(name, stock, price)")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      console.error("Fetch order error:", orderError);
      return NextResponse.json(
        { error: "ไม่พบคำสั่งซื้อนี้ในระบบ" },
        { status: 404 }
      );
    }

    // If order is already verified, return success directly
    if (order.status === "verified") {
      return NextResponse.json({
        success: true,
        verified: true,
        message: "คำสั่งซื้อนี้ได้รับการยืนยันชำระเงินเรียบร้อยแล้ว",
      });
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
      console.log(`[EasySlip Sandbox Mode] Mock verifying order: ${orderId}`);
      // Simulating a perfect verification response
      slipVerified = true;
      verifiedBy = `sandbox:MOCK_REF_${Date.now()}`;
      transRef = `MOCK_REF_${Date.now()}`;
      amountPaid = Number(order.total_amount);
      senderName = "MOCK TESTER";
    } else {
      // --- Real EasySlip API Verification ---
      if (!order.slip_url) {
        return NextResponse.json(
          { error: "ไม่พบหลักฐานการโอนเงิน (รูปภาพสลิป)" },
          { status: 400 }
        );
      }

      // Download slip file from Supabase Storage public url
      const imageResponse = await fetch(order.slip_url);
      if (!imageResponse.ok) {
        throw new Error("ไม่สามารถเข้าถึงรูปภาพสลิปที่เก็บไว้ได้");
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
        console.error("EasySlip API failure:", verifyData);

        // Fallback: change status back to slip_uploaded but set manual confirmation queue
        await supabaseAdmin
          .from("orders")
          .update({
            status: "slip_uploaded",
            verified_by: "pending_manual_api_failed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", orderId);

        return NextResponse.json(
          {
            error: verifyData.message || "ระบบไม่สามารถตรวจสอบสลิปโอนเงินนี้ได้โดยอัตโนมัติ",
            fallback: "pending_manual"
          },
          { status: 400 }
        );
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
        // Double spending / Slip reuse detected
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

        return NextResponse.json(
          { error: "สลิปนี้เคยถูกใช้ชำระเงินในรายการคำสั่งซื้ออื่นสำเร็จไปแล้ว" },
          { status: 400 }
        );
      }

      // 2. Validate Amount: verify that amount paid matches order total_amount
      if (amountPaid !== Number(order.total_amount)) {
        console.error(`Amount mismatch: Expected ${order.total_amount}, Paid: ${amountPaid}`);
        
        await supabaseAdmin
          .from("orders")
          .update({
            status: "slip_uploaded",
            verified_by: `pending_manual_amount_mismatch_paid_${amountPaid}`,
            updated_at: new Date().toISOString(),
          })
          .eq("id", orderId);

        return NextResponse.json(
          { error: `ยอดเงินในสลิปไม่ตรงกับยอดที่ต้องชำระ (โอนมา ${amountPaid} บาท แต่ยอดชำระคือ ${order.total_amount} บาท)` },
          { status: 400 }
        );
      }

      slipVerified = true;
      verifiedBy = `auto:${transRef}`;
    }

    // 3. Write verified state
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
      throw new Error(`Failed to update order state: ${updateOrderError.message}`);
    }

    // 5. Trigger Line OA Notification in the background
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      fetch(`${appUrl}/api/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          status: "verified",
          senderName,
          amountPaid,
          mode: isSandbox ? "sandbox" : "live"
        }),
      }).catch((e) => console.error("Notification trigger async err:", e));
    } catch (e) {
      console.error("Failed to fire notification:", e);
    }

    return NextResponse.json({
      success: true,
      verified: true,
      mode: isSandbox ? "sandbox" : "live",
      message: "ยืนยันการชำระเงินและหักสต็อกสินค้าสำเร็จ",
    });

  } catch (error: unknown) {
    console.error("Order Verify API endpoint error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดทางเทคนิคในการตรวจสอบสลิป" },
      { status: 500 }
    );
  }
}
