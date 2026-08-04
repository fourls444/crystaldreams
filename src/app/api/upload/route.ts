import { NextResponse } from "next/server";

/** @deprecated Slip uploads are disabled after the Omise migration. */
export async function POST() {
  return NextResponse.json(
    { error: "ปิดการอัปโหลดสลิปแล้ว ระบบจะยืนยัน PromptPay ผ่าน Omise อัตโนมัติ" },
    { status: 410 },
  );
}
