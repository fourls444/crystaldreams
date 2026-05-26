import { NextResponse } from "next/server";
import generatePayload from "promptpay-qr";
import qrcode from "qrcode";

export async function POST(req: Request) {
  try {
    const { amount } = await req.json();
    const promptpayNumber = process.env.NEXT_PUBLIC_PROMPTPAY_NUMBER;

    if (!promptpayNumber) {
      return NextResponse.json(
        { error: "ระบบยังไม่ได้ตั้งค่าหมายเลขพร้อมเพย์ผู้รับเงิน" },
        { status: 500 }
      );
    }

    if (!amount || isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "ยอดเงินไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    // 1. Generate PromptPay Payload
    const payload = generatePayload(promptpayNumber, { amount });

    // 2. Generate QR Code Data URL (Base64 PNG Image)
    const options = {
      color: {
        dark: "#0f172a", // Very dark slate color for high contrast & elegance
        light: "#ffffff",
      },
      width: 512,
      margin: 2,
    };

    const qrDataUrl = await qrcode.toDataURL(payload, options);

    return NextResponse.json({
      success: true,
      qrDataUrl,
    });
  } catch (error: any) {
    console.error("PromptPay QR API error:", error);
    return NextResponse.json(
      { error: "ไม่สามารถเจนเนอเรท PromptPay QR ได้" },
      { status: 500 }
    );
  }
}
