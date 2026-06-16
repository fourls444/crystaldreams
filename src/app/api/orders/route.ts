import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/utils/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let cartItems: Array<{ product_id: string; quantity: number }> = [];

    if (body.items && Array.isArray(body.items)) {
      cartItems = body.items;
    } else if (body.product_id && body.quantity) {
      cartItems = [{ product_id: body.product_id, quantity: body.quantity }];
    }

    if (cartItems.length === 0) {
      return NextResponse.json(
        { error: "กรุณาระบุสินค้าและจำนวน" },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 1. Fetch details and validate all products in the cart
    let total_amount = 0;
    const itemsWithDetails = [];

    for (const item of cartItems) {
      const { data: product, error: productError } = await supabaseAdmin
        .from("products")
        .select("id, name, price, stock, is_visible, image_url, discount_percent")
        .eq("id", item.product_id)
        .single();

      if (productError || !product || !product.is_visible) {
        return NextResponse.json(
          { error: "ไม่พบสินค้าบางรายการในระบบหรือไม่พร้อมจำหน่ายในขณะนี้" },
          { status: 404 }
        );
      }

      // Validate stock availability
      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `สินค้า "${product.name}" มีสต็อกไม่เพียงพอ (คงเหลือ ${product.stock} ชิ้น)` },
          { status: 400 }
        );
      }

      let activePrice = Number(product.price);
      if (product.discount_percent && product.discount_percent > 0) {
        activePrice = Math.round(activePrice * (1 - product.discount_percent / 100));
      }

      const itemTotal = activePrice * item.quantity;
      total_amount += itemTotal;

      itemsWithDetails.push({
        product_id: product.id,
        name: product.name,
        price: activePrice,
        quantity: item.quantity,
        image_url: product.image_url,
      });
    }

    // 2. Create Order
    // For backward compatibility, reference the first item at the root of orders
    const firstItem = itemsWithDetails[0];

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        product_id: firstItem.product_id,
        quantity: firstItem.quantity,
        total_amount,
        status: "pending",
        payment_method: body.payment_method || "promptpay",
        items: itemsWithDetails,
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

