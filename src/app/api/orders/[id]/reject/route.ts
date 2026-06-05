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

    // 1. Fetch Order details
    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .select("*, products(stock)")
      .eq("id", orderId)
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ error: "ไม่พบคำสั่งซื้อ" }, { status: 404 });
    }

    if (order.status === "rejected") {
      return NextResponse.json({
        success: true,
        message: "คำสั่งซื้อนี้ได้รับการปฏิเสธสลิปแล้ว",
      });
    }

    const previousStatus = order.status;

    // 2. Update order to rejected
    const { error: updateErr } = await supabaseAdmin
      .from("orders")
      .update({
        status: "rejected",
        slip_verified: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (updateErr) {
      throw new Error(updateErr.message);
    }

    // 3. Restore Stock (only if previous status was 'slip_uploaded' or 'verified' where stock was deducted)
    if (previousStatus === "slip_uploaded" || previousStatus === "verified") {
      const currentStock = order.products?.stock ?? 0;
      const { error: stockErr } = await supabaseAdmin
        .from("products")
        .update({
          stock: currentStock + order.quantity,
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.product_id);

      if (stockErr) {
        console.error("Failed to restore stock on reject:", stockErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: "ปฏิเสธสลิปและปรับปรุงสต็อกสำเร็จ",
    });
  } catch (error: unknown) {
    console.error("Reject order error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดทางเทคนิคในการปฏิเสธคำสั่งซื้อ" },
      { status: 500 }
    );
  }
}
