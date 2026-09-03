import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/utils/supabase";
import { retrieveBeamCharge } from "@/utils/beam";
import { syncBeamChargeToOrder } from "@/utils/beam-order";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabaseAdmin = getSupabaseAdmin();
    const selectFields = "id, product_id, quantity, total_amount, customer_name, customer_tel, customer_address, customer_line, status, payment_method, payment_status, beam_charge_id, beam_charge_status, paid_at, shipping_completed, items, products(name)";

    const initialResult = await supabaseAdmin
      .from("orders")
      .select(selectFields)
      .eq("id", id)
      .single();
    let order = initialResult.data;
    if (initialResult.error || !order) return NextResponse.json({ error: "ไม่พบคำสั่งซื้อ" }, { status: 404 });

    // Polling also reconciles with Beam, so payment can recover if a webhook
    // was delayed while the customer is still looking at the QR screen.
    if (order.payment_method === "promptpay" && order.payment_status !== "paid" && order.beam_charge_id) {
      const charge = await retrieveBeamCharge(order.beam_charge_id);
      await syncBeamChargeToOrder(charge);
      const refreshed = await supabaseAdmin.from("orders").select(selectFields).eq("id", id).single();
      if (!refreshed.error && refreshed.data) order = refreshed.data;
    }

    return NextResponse.json({
      order,
      paymentStatus: order.payment_status,
      chargeStatus: order.beam_charge_status,
      paid: order.payment_status === "paid",
      canEnterShipping: order.payment_method === "cod" || order.payment_status === "paid",
      shippingCompleted: order.shipping_completed,
    });
  } catch (error: unknown) {
    console.error("Payment status API error:", error);
    const message = error instanceof Error ? error.message : "ไม่สามารถตรวจสอบสถานะชำระเงินได้";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
