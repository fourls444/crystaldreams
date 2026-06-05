import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/utils/supabase";

export async function POST(req: Request) {
  try {
    const { product_id, quantity } = await req.json();

    if (!product_id || !quantity) {
      return NextResponse.json(
        { error: "กรุณาระบุสินค้าและจำนวน" },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 1. Get Product Price and Stock
    const { data: product, error: productError } = await supabaseAdmin
      .from("products")
      .select("price, stock, is_visible")
      .eq("id", product_id)
      .single();

    if (productError || !product || !product.is_visible) {
      return NextResponse.json(
        { error: "ไม่พบสินค้าในระบบหรือไม่พร้อมจำหน่ายในขณะนี้" },
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
  } catch (error: unknown) {
    console.error("Order creation API error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "กรุณาระบุหมายเลขคำสั่งซื้อ" }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Fetch the order status first to ensure it's "pending"
    const { data: order, error: fetchError } = await supabaseAdmin
      .from("orders")
      .select("status")
      .eq("id", id)
      .single();

    if (fetchError || !order) {
      return NextResponse.json({ error: "ไม่พบคำสั่งซื้อ" }, { status: 404 });
    }

    if (order.status !== "pending") {
      return NextResponse.json(
        { error: "ไม่สามารถยกเลิกคำสั่งซื้อนี้ได้เนื่องจากอยู่ระหว่างการดำเนินการ" },
        { status: 400 }
      );
    }

    // Delete the pending order
    const { error: deleteError } = await supabaseAdmin
      .from("orders")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Error deleting order:", deleteError);
      return NextResponse.json({ error: "ไม่สามารถยกเลิกคำสั่งซื้อได้" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "ยกเลิกคำสั่งซื้อสำเร็จ" });
  } catch (error) {
    console.error("DELETE order API error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในระบบ" }, { status: 500 });
  }
}

