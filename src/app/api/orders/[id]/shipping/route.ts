import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/utils/supabase";
import { sendAdminNotification } from "@/utils/notify";

interface ShippingBody {
  customer_name?: string;
  customer_tel?: string;
  customer_address?: string;
  customer_line?: string;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = (await req.json()) as ShippingBody;
    const name = body.customer_name?.trim() || "";
    const tel = (body.customer_tel || "").replace(/[^0-9]/g, "");
    const address = body.customer_address?.trim() || "";
    const line = body.customer_line?.trim() || "";

    if (!name || !tel || !address) {
      return NextResponse.json({ error: "กรุณากรอกข้อมูลจัดส่งให้ครบถ้วน" }, { status: 400 });
    }
    if (name.length > 80 || !/^[0-9]{9,10}$/.test(tel) || address.length > 300 || line.length > 80) {
      return NextResponse.json({ error: "รูปแบบหรือความยาวของข้อมูลจัดส่งไม่ถูกต้อง" }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    // The RPC enforces paid-before-address for PromptPay and handles COD stock
    // deduction atomically. Client-side navigation cannot bypass these guards.
    const { data: status, error: saveError } = await supabaseAdmin.rpc("save_order_shipping", {
      p_order_id: id,
      p_customer_name: name,
      p_customer_tel: tel,
      p_customer_address: address,
      p_customer_line: line,
    });

    if (saveError) {
      const detail = saveError.message || "";
      if (detail.includes("payment_not_completed")) {
        return NextResponse.json({ error: "ยังไม่ได้รับการยืนยันชำระเงินจาก Omise" }, { status: 409 });
      }
      if (detail.includes("shipping_already_completed")) {
        return NextResponse.json({ error: "ออเดอร์นี้บันทึกข้อมูลจัดส่งแล้ว" }, { status: 409 });
      }
      if (detail.includes("insufficient_stock")) {
        return NextResponse.json({ error: "สินค้าในออเดอร์มีสต็อกไม่เพียงพอ" }, { status: 409 });
      }
      throw new Error(`บันทึกข้อมูลจัดส่งไม่สำเร็จ: ${detail}`);
    }

    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("total_amount, payment_method")
      .eq("id", id)
      .single();

    if (order) {
      await sendAdminNotification({
        orderId: id,
        customerName: name,
        customerTel: tel,
        customerAddress: address,
        customerLine: line || undefined,
        amount: Number(order.total_amount),
        status: order.payment_method === "cod" ? "cod_pending" : "verified",
        senderName: order.payment_method === "cod" ? undefined : "Omise",
      });
    }

    return NextResponse.json({ success: true, status });
  } catch (error: unknown) {
    console.error("Shipping API error:", error);
    const message = error instanceof Error ? error.message : "ไม่สามารถบันทึกข้อมูลจัดส่งได้";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
