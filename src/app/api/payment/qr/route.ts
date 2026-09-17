import { NextResponse } from "next/server";

/** @deprecated Use POST /api/payment/beam/promptpay. */
export async function POST() {
  return NextResponse.json(
    { error: "ระบบ QR เดิมถูกปิดแล้ว กรุณาสร้าง PromptPay QR ผ่าน Beam" },
    { status: 410 },
  );
}
