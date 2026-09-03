import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/utils/supabase";
import {
  createPromptPayCharge,
  getPromptPayQrUrl,
  mapBeamPaymentStatus,
  BeamApiError,
  retrieveBeamCharge,
} from "@/utils/beam";
import { syncBeamChargeToOrder } from "@/utils/beam-order";

export async function POST(req: Request) {
  try {
    const { orderId } = (await req.json()) as { orderId?: string };
    if (!orderId) return NextResponse.json({ error: "กรุณาระบุหมายเลขคำสั่งซื้อ" }, { status: 400 });

    const supabaseAdmin = getSupabaseAdmin();
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("id, total_amount, status, payment_method, payment_status, beam_charge_id")
      .eq("id", orderId)
      .single();

    if (orderError || !order) return NextResponse.json({ error: "ไม่พบคำสั่งซื้อ" }, { status: 404 });
    if (order.payment_method !== "promptpay") {
      return NextResponse.json({ error: "ออเดอร์นี้ไม่ได้เลือกชำระผ่าน PromptPay" }, { status: 400 });
    }
    if (order.payment_status === "paid") {
      return NextResponse.json({ success: true, paymentStatus: "paid", paid: true });
    }

    // Reuse a still-pending charge when the customer reopens the QR modal.
    // Failed or expired charges are replaced with a fresh Beam charge.
    if (order.beam_charge_id) {
      const existingCharge = await retrieveBeamCharge(order.beam_charge_id);
      const existingStatus = mapBeamPaymentStatus(existingCharge);
      const existingQrUrl = getPromptPayQrUrl(existingCharge);
      if (existingStatus === "paid") {
        await syncBeamChargeToOrder(existingCharge);
        return NextResponse.json({ success: true, paymentStatus: "paid", paid: true });
      }
      if (existingStatus === "pending" && existingQrUrl) {
        return NextResponse.json({
          success: true,
          qrDataUrl: existingQrUrl,
          chargeId: existingCharge.id,
          paymentStatus: existingStatus,
        });
      }
    }

    const amountSatang = Math.round(Number(order.total_amount) * 100);
    if (!Number.isSafeInteger(amountSatang) || amountSatang <= 0) {
      return NextResponse.json({ error: "ยอดเงินของออเดอร์ไม่ถูกต้อง" }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
    const charge = await createPromptPayCharge({
      amountSatang,
      orderId: order.id,
      description: `CrystalDream order ${order.id}`,
      redirectUrl: appUrl ? `${appUrl}/payment/shipping?orderId=${order.id}` : undefined,
    });
    const qrDataUrl = getPromptPayQrUrl(charge);
    if (!qrDataUrl) throw new Error("Beam ไม่ได้ส่ง QR PromptPay กลับมา");

    const { error: updateError } = await supabaseAdmin
      .from("orders")
      .update({
        beam_charge_id: charge.id,
        beam_charge_status: charge.status,
        payment_status: mapBeamPaymentStatus(charge),
        beam_failure_code: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id)
      .neq("payment_status", "paid");
    if (updateError) throw new Error(`บันทึก Beam Charge ไม่สำเร็จ: ${updateError.message}`);

    return NextResponse.json({
      success: true,
      qrDataUrl,
      chargeId: charge.id,
      paymentStatus: mapBeamPaymentStatus(charge),
    });
  } catch (error: unknown) {
    console.error("Beam PromptPay charge error:", error);
    const status = error instanceof BeamApiError ? error.status : 500;
    const message = error instanceof Error ? error.message : "ไม่สามารถสร้าง PromptPay QR ได้";
    return NextResponse.json({ error: message }, { status });
  }
}
