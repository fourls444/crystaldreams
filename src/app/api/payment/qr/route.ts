import { NextResponse } from "next/server";
import generatePayload from "promptpay-qr";
import qrcode from "qrcode";

/**
 * POST /api/payment/qr
 *
 * สร้าง Thai QR Payment (EMV Merchant-Presented Mode) สำหรับ K-SHOP
 *
 * Thai QR Payment มาตรฐาน BOT/EMVCo รองรับ ID 3 รูปแบบผ่าน promptpay-qr:
 *   ≤ 12 digits → BOT_ID_MERCHANT_PHONE_NUMBER  (เบอร์โทร - ไม่ใช้)
 *   13 digits   → BOT_ID_MERCHANT_TAX_ID        (เลขบัตร - ไม่ใช้)
 *   ≥ 15 digits → BOT_ID_MERCHANT_EWALLET_ID    (Biller ID 15 หลัก → K-SHOP) ✅
 *
 * Biller ID 15 หลักจาก K-SHOP จะถูก embed ใน QR และเมื่อลูกค้าสแกน
 * ด้วยแอปธนาคารใดก็ได้ เงินจะวิ่งเข้าบัญชี K-SHOP ของร้านโดยตรง
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount, billerId } = body;

    // --- Validate amount ---
    if (!amount || isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "ยอดเงินไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    // --- Determine Biller ID to use ---
    // Priority: billerId from request > NEXT_PUBLIC_PROMPTPAY_NUMBER env (fallback)
    let targetId: string;

    if (billerId && String(billerId).trim()) {
      targetId = String(billerId).trim();
    } else {
      const envId = process.env.NEXT_PUBLIC_PROMPTPAY_NUMBER;
      if (!envId) {
        return NextResponse.json(
          { error: "ยังไม่ได้ตั้งค่า Biller ID กรุณาตั้งค่าในหน้าชำระเงิน" },
          { status: 500 }
        );
      }
      targetId = envId;
    }

    // --- Validate Biller ID: ต้องเป็นตัวเลข 15 หลักเท่านั้น ---
    const cleanId = targetId.replace(/[^0-9]/g, "");
    if (cleanId.length !== 15) {
      return NextResponse.json(
        {
          error: `Biller ID ต้องเป็นตัวเลข 15 หลัก (ได้รับ ${cleanId.length} หลัก) — ใช้ Biller ID จาก K-SHOP ไม่ใช่ Merchant ID ที่ขึ้นต้นด้วย EXT`,
        },
        { status: 400 }
      );
    }

    // --- Generate Thai QR Payment Payload ---
    // promptpay-qr จะเลือก BOT_ID_MERCHANT_EWALLET_ID โดยอัตโนมัติเมื่อ ID ≥ 15 หลัก
    // ซึ่งตรงกับ Biller ID มาตรฐาน EMVCo/BOT สำหรับ K-SHOP
    const payload = generatePayload(cleanId, { amount });

    // --- Render QR Code as Base64 PNG ---
    const qrDataUrl = await qrcode.toDataURL(payload, {
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
      width: 512,
      margin: 2,
    });

    return NextResponse.json({
      success: true,
      qrDataUrl,
      billerId: cleanId,
    });
  } catch (error: unknown) {
    console.error("Thai QR Payment generation error:", error);
    return NextResponse.json(
      { error: "ไม่สามารถสร้าง QR Code ได้ กรุณาตรวจสอบ Biller ID" },
      { status: 500 }
    );
  }
}
