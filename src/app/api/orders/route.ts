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

    if (cartItems.some((item) => (
      !item ||
      typeof item.product_id !== "string" ||
      !item.product_id ||
      !Number.isSafeInteger(item.quantity) ||
      item.quantity <= 0
    ))) {
      return NextResponse.json(
        { error: "จำนวนสินค้าต้องเป็นจำนวนเต็มที่มากกว่า 0" },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    const paymentMethod = body.payment_method === "cod" ? "cod" : "promptpay";
    if (body.payment_method && body.payment_method !== "cod" && body.payment_method !== "promptpay") {
      return NextResponse.json({ error: "รูปแบบการชำระเงินไม่ถูกต้อง" }, { status: 400 });
    }

    // Server-side guard: ตรวจสอบว่า COD เปิดอยู่หรือไม่ ก่อนสร้างออเดอร์
    if (paymentMethod === "cod") {
      const { data: codSetting } = await supabaseAdmin
        .from("settings")
        .select("value")
        .eq("key", "cod_enabled")
        .single();

      if (codSetting?.value === "false") {
        return NextResponse.json(
          { error: "ขณะนี้ไม่รับบริการเก็บเงินปลายทาง (COD) กรุณาชำระเงินผ่านพร้อมเพย์" },
          { status: 400 }
        );
      }
    }


    // 1. Fetch details and validate all products in the cart
    let total_amount = 0;
    const itemsWithDetails = [];

    for (const item of cartItems) {
      const { data: product, error: productError } = await supabaseAdmin
        .from("products")
        .select("id, name, price, stock, is_visible, image_url, discount_amount")
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
      const discountAmount = Number(product.discount_amount) || 0;
      if (discountAmount > 0 && discountAmount <= activePrice) {
        activePrice = Math.round(activePrice - discountAmount);
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
        payment_method: paymentMethod,
        payment_status: paymentMethod === "cod" ? "cod_pending" : "pending",
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
      .select("status, beam_charge_id")
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

    // A Beam charge can complete after the modal closes. Keep the order so a
    // late webhook still has a valid target and the payment is never orphaned.
    if (order.beam_charge_id) {
      return NextResponse.json(
        { error: "ปิดหน้าชำระเงินได้ แต่ออเดอร์ที่ผูกกับ Beam จะถูกเก็บไว้จนกว่ารายการจะหมดอายุ" },
        { status: 409 },
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
