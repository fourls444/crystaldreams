import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/utils/supabase";
import { sendAdminNotification } from "@/utils/notify";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId, status, senderName, amountPaid, mode } = body;

    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Fetch order details with product details for notification content
    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .select("*, products(name)")
      .eq("id", orderId)
      .single();

    if (orderErr || !order) {
      console.error(`[Notify Endpoint] Order not found for ID: ${orderId}`, orderErr);
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Prepare notification arguments
    const customerName = order.customer_name || "ไม่ระบุชื่อ";
    const customerTel = order.customer_tel || "ไม่ระบุเบอร์โทร";
    const customerAddress = order.customer_address || "ไม่ระบุที่อยู่";
    const amount = amountPaid !== undefined && amountPaid !== null && amountPaid !== 0 
      ? Number(amountPaid) 
      : Number(order.total_amount);
    const slipUrl = order.slip_url || undefined;
    const finalStatus = status || order.status;

    // Trigger admin notification helper
    const result = await sendAdminNotification({
      orderId,
      customerName,
      customerTel,
      customerAddress,
      amount,
      slipUrl,
      status: finalStatus,
      senderName: senderName || order.verified_by || undefined,
      mode: mode || undefined,
    });

    return NextResponse.json({ 
      success: result.success, 
      method: result.method,
      error: result.error 
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
    console.error("[Notify Endpoint] Error occurred:", error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
