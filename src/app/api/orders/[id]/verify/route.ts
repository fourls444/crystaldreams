import { NextResponse } from "next/server";
import { verifyOrderSlip } from "@/utils/verify";
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
      return NextResponse.json(
        { error: "กรุณาระบุหมายเลขคำสั่งซื้อ" },
        { status: 400 }
      );
    }

    const verifyResult = await verifyOrderSlip(orderId);

    if (!verifyResult.success) {
      return NextResponse.json(
        { error: verifyResult.message, fallback: verifyResult.fallback ? "pending_manual" : undefined },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      verified: verifyResult.verified,
      mode: verifyResult.mode,
      message: verifyResult.message,
    });

  } catch (error: unknown) {
    console.error("Order Verify API endpoint error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดทางเทคนิคในการตรวจสอบสลิป" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";

