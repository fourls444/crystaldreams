import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/utils/supabase";

export async function POST(req: Request) {
  try {
    const { product_id, quantity, customer_name, customer_tel } = await req.json();

    if (!product_id || !quantity || !customer_name || !customer_tel) {
      return NextResponse.json(
        { error: "กรุณากรอกข้อมูลให้ครบถ้วน" },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 1. Get Product Price and Stock
    const { data: product, error: productError } = await supabaseAdmin
      .from("products")
      .select("price, stock")
      .eq("id", product_id)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { error: "ไม่พบสินค้าในระบบ" },
        { status: 404 }
      );
    }

    // 2. Validate Stock Availability
    if (product.stock < quantity) {
      return NextResponse.json(
        { error: "ขออภัย สต็อกสินค้าไม่เพียงพอ" },
        { status: 400 }
      );
    }

    // 3. Compute total amount
    const total_amount = product.price * quantity;

    // 4. Create Order
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        product_id,
        quantity,
        total_amount,
        customer_name,
        customer_tel,
        status: "pending",
      })
      .select("id")
      .single();

    if (orderError || !order) {
      console.error("Order insertion error:", orderError);
      return NextResponse.json(
        { error: "ไม่สามารถบันทึกคำสั่งซื้อได้" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      totalAmount: total_amount,
    });
  } catch (error: any) {
    console.error("Order creation API error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500 }
    );
  }
}
