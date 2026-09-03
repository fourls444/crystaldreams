import { getSupabaseAdmin } from "@/utils/supabase";
import {
  mapBeamPaymentStatus,
  type BeamCharge,
  validateSuccessfulPromptPayCharge,
} from "@/utils/beam";

export async function syncBeamChargeToOrder(charge: BeamCharge) {
  const supabaseAdmin = getSupabaseAdmin();
  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .select("id, total_amount, beam_charge_id, payment_status, status")
    .eq("beam_charge_id", charge.id)
    .single();

  if (orderError || !order) throw new Error("ไม่พบออเดอร์ที่ผูกกับ Beam Charge นี้");

  const paymentStatus = mapBeamPaymentStatus(charge);
  const now = new Date().toISOString();

  if (paymentStatus === "paid") {
    const valid = validateSuccessfulPromptPayCharge(charge, {
      id: order.id,
      amountSatang: Math.round(Number(order.total_amount) * 100),
      chargeId: order.beam_charge_id,
    });
    if (!valid) throw new Error("ข้อมูล Charge ไม่ตรงกับออเดอร์");

    // Critical flow: this RPC locks the order, deducts stock, and marks it paid
    // in one database transaction, so repeated webhooks cannot deduct stock twice.
    const { data: status, error: finalizeError } = await supabaseAdmin.rpc(
      "finalize_beam_payment",
      {
        p_order_id: order.id,
        p_charge_id: charge.id,
        p_paid_at: charge.paidAt || now,
      },
    );
    if (finalizeError) throw new Error(`บันทึกผลชำระเงินไม่สำเร็จ: ${finalizeError.message}`);
    return { orderId: order.id, paymentStatus, orderStatus: status as string };
  }

  const { error: updateError } = await supabaseAdmin
    .from("orders")
    .update({
      payment_status: paymentStatus,
      beam_charge_status: charge.status,
      beam_failure_code: charge.failureCode || null,
      updated_at: now,
    })
    .eq("id", order.id)
    .neq("payment_status", "paid");

  if (updateError) throw new Error(`อัปเดตสถานะ Beam ไม่สำเร็จ: ${updateError.message}`);
  return { orderId: order.id, paymentStatus, orderStatus: order.status };
}
