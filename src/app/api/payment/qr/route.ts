import { NextResponse } from "next/server";
import { anyId, billPayment } from "promptparse/generate";
import qrcode from "qrcode";

/**
 * POST /api/payment/qr
 *
 * สร้าง Thai QR Payment (EMV Merchant-Presented Mode)
 * รองรับการสร้าง QR Code 3 รูปแบบอัตโนมัติอ้างอิงตามความยาวของ ID:
 *   - 15 หลัก → PromptPay Bill Payment (Tag 30) สำหรับ Biller ID / K-SHOP ✅
 *   - 13 หลัก → PromptPay AnyID (Tag 29) สำหรับเลขประจำตัวผู้เสียภาษี / เลขบัตรประชาชน (NATID)
 *   - 10 หลัก → PromptPay AnyID (Tag 29) สำหรับเบอร์โทรศัพท์ (MSISDN)
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount, billerId, orderId, ref1: bodyRef1 } = body;

    // --- Validate amount ---
    if (!amount || isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "ยอดเงินไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    // --- Determine PromptPay / Biller ID to use ---
    // Priority: billerId from request > NEXT_PUBLIC_PROMPTPAY_NUMBER env (fallback)
    let targetId: string;

    if (billerId && String(billerId).trim()) {
      targetId = String(billerId).trim();
    } else {
      const envId = process.env.NEXT_PUBLIC_PROMPTPAY_NUMBER;
      if (!envId) {
        return NextResponse.json(
          { error: "ยังไม่ได้ตั้งค่าหมายเลขพร้อมเพย์/Biller ID กรุณาตั้งค่าใน .env.local" },
          { status: 500 }
        );
      }
      targetId = envId;
    }

    // --- Clean and validate ID ---
    const cleanId = targetId.replace(/[^0-9]/g, "");

    // --- Prepare Ref 1 and Ref 2 for Bill Payment (Tag 30) ---
    // Bill Payment (Tag 30) ต้องมี Reference 1 เสมอ (ความยาวสูงสุด 20 ตัวอักษร)
    let ref1 = process.env.NEXT_PUBLIC_PROMPTPAY_REF1 || bodyRef1 || orderId || "";
    let ref2 = process.env.NEXT_PUBLIC_PROMPTPAY_REF2 || body.ref2 || "";

    if (ref1) {
      // ลบสัญลักษณ์พิเศษ (เช่น เครื่องหมายย่อหน้าของ UUID) และจำกัดที่ 20 ตัวอักษรพิมพ์ใหญ่
      ref1 = String(ref1).replace(/[^a-zA-Z0-9]/g, "").substring(0, 20).toUpperCase();
    } else {
      // หากไม่มี ให้สร้างเป็นค่าสุ่มที่ไม่ซ้ำกัน
      ref1 = `REF${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 1000)}`;
    }

    if (ref2) {
      ref2 = String(ref2).replace(/[^a-zA-Z0-9]/g, "").substring(0, 20).toUpperCase();
    }

    // --- Generate Thai QR Payment Payload ---
    let payload: string;

    if (cleanId.length === 15) {
      // 1. กรณีเป็น Biller ID 15 หลัก (K-SHOP/Bill Payment) -> ใช้ Tag 30
      payload = billPayment({
        billerId: cleanId,
        amount,
        ref1,
        ref2: ref2 || undefined,
      });
    } else if (cleanId.length === 13) {
      // 2. กรณีเป็นเลขบัตรประชาชน/เลขประจำตัวผู้เสียภาษี 13 หลัก (Standard Transfer) -> ใช้ Tag 29 NATID
      payload = anyId({
        type: "NATID",
        target: cleanId,
        amount,
      });
    } else if (cleanId.length === 10 && cleanId.startsWith("0")) {
      // 3. กรณีเป็นเบอร์โทรศัพท์มือถือ 10 หลัก (Standard Transfer) -> ใช้ Tag 29 MSISDN
      payload = anyId({
        type: "MSISDN",
        target: cleanId,
        amount,
      });
    } else {
      return NextResponse.json(
        {
          error: `รูปแบบหมายเลขพร้อมเพย์/Biller ID ไม่ถูกต้อง (มีความยาว ${cleanId.length} หลัก) — ต้องเป็น Biller ID 15 หลัก, เลขผู้เสียภาษี 13 หลัก, หรือเบอร์โทรศัพท์ 10 หลัก`,
        },
        { status: 400 }
      );
    }

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
      ref1: cleanId.length === 15 ? ref1 : undefined,
    });
  } catch (error: unknown) {
    console.error("Thai QR Payment generation error:", error);
    return NextResponse.json(
      { error: "ไม่สามารถสร้าง QR Code ได้ กรุณาตรวจสอบการตั้งค่าบัญชีปลายทาง" },
      { status: 500 }
    );
  }
}
