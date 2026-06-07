import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/utils/supabase";
import { isAdminAuthenticated } from "@/utils/auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Secure checking
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึงระบบ" }, { status: 401 });
    }

    const { id: orderId } = await params;
    if (!orderId) {
      return NextResponse.json({ error: "กรุณาระบุหมายเลขคำสั่งซื้อ" }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 1. Fetch Order (with amount for notification)
    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .select("status, total_amount, customer_name, customer_tel, customer_address")
      .eq("id", orderId)
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ error: "ไม่พบคำสั่งซื้อ" }, { status: 404 });
    }

    if (order.status === "verified") {
      return NextResponse.json({
        success: true,
        message: "คำสั่งซื้อนี้ได้รับการยืนยันชำระเงินเรียบร้อยแล้ว",
      });
    }

    // 2. Update order to verified
    const { error: updateErr } = await supabaseAdmin
      .from("orders")
      .update({
        status: "verified",
        slip_verified: true,
        verified_by: "manual_admin",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (updateErr) {
      throw new Error(updateErr.message);
    }

    // Trigger Line OA Notification in background if needed
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      fetch(`${appUrl}/api/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          status: "verified",
          senderName: "แอดมินยืนยันสลิปแมนนวล",
          amountPaid: Number(order.total_amount),
          customerName: order.customer_name || "ไม่ระบุชื่อ",
          customerTel: order.customer_tel || "ไม่ระบุเบอร์",
          customerAddress: order.customer_address || "ไม่ระบุที่อยู่",
          mode: "manual",
        }),
      }).catch((e) => console.error("Notification async err:", e));
    } catch (e) {
      console.error(e);
    }

    return NextResponse.json({
      success: true,
      message: "ยืนยันการชำระเงินคำสั่งซื้อด้วยตนเองสำเร็จ",
    });
  } catch (error: unknown) {
    console.error("Manual approve error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดทางเทคนิคในการยืนยันสลิป" },
      { status: 500 }
    );
  }
}
