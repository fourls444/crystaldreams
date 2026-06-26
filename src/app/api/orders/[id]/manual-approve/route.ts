import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/utils/supabase";
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
      return NextResponse.json({ error: "กรุณาระบุหมายเลขคำสั่งซื้อ" }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 1. Fetch Order details
    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .select("*, products(stock)")
      .eq("id", orderId)
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ error: "ไม่พบคำสั่งซื้อ" }, { status: 404 });
    }

    if (order.status === "verified") {
      return NextResponse.json({
        success: true,
        message: "คำสั่งซื้อนี้ได้รับการยืนยันชำระเงินเรียบร้อยแล้ว",
      });
    }

    const previousStatus = order.status;

    // 2. Validate and Deduct Stock if transitioning from rejected or pending
    if (previousStatus === "rejected" || previousStatus === "pending") {
      if (order.items && Array.isArray(order.items)) {
        const cartItems = order.items as Array<{ product_id: string; name: string; price: number; quantity: number }>;
        
        // Validate stock availability first
        for (const item of cartItems) {
          const { data: prod, error: prodErr } = await supabaseAdmin
            .from("products")
            .select("name, stock")
            .eq("id", item.product_id)
            .single();
            
          if (prodErr || !prod) {
            return NextResponse.json({ error: `ไม่พบสินค้าบางรายการในระบบหรือไม่พร้อมจำหน่ายในขณะนี้` }, { status: 404 });
          }
          
          if (prod.stock < item.quantity) {
            return NextResponse.json({
              error: `ขออภัย สต็อกสินค้า "${prod.name}" ไม่เพียงพอ (คงเหลือ ${prod.stock} ชิ้น)`
            }, { status: 400 });
          }
        }

        // Deduct stock for all items
        for (const item of cartItems) {
          const { data: prod } = await supabaseAdmin
            .from("products")
            .select("stock")
            .eq("id", item.product_id)
            .single();
          if (prod) {
            const { error: stockErr } = await supabaseAdmin
              .from("products")
              .update({
                stock: prod.stock - item.quantity,
                updated_at: new Date().toISOString(),
              })
              .eq("id", item.product_id);
            if (stockErr) {
              console.error(`Failed to update stock for product ${item.product_id} on manual approve:`, stockErr);
            }
          }
        }
      } else if (order.product_id) {
        // Fallback for single item order
        const currentStock = order.products?.stock ?? 0;
        if (currentStock < order.quantity) {
          return NextResponse.json({
            error: `ขออภัย สต็อกสินค้าไม่เพียงพอ (คงเหลือ ${currentStock} ชิ้น)`
          }, { status: 400 });
        }

        const { error: stockErr } = await supabaseAdmin
          .from("products")
          .update({
            stock: currentStock - order.quantity,
            updated_at: new Date().toISOString(),
          })
          .eq("id", order.product_id);

        if (stockErr) {
          console.error("Failed to update stock on manual approve:", stockErr);
        }
      }
    }

    // 3. Update order to verified
    const { error: updateErr } = await supabaseAdmin
      .from("orders")
      .update({
        status: "verified",
        slip_verified: true,
        verified_by: "manual_admin",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (updateErr) {
      throw new Error(updateErr.message);
    }

    // Trigger Line OA Notification in background if needed
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      fetch(`${appUrl}/api/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          status: "verified",
          senderName: "แอดมินยืนยันสลิปแมนนวล",
          amountPaid: Number(order.total_amount),
          customerName: order.customer_name || "ไม่ระบุชื่อ",
          customerTel: order.customer_tel || "ไม่ระบุเบอร์",
          customerAddress: order.customer_address || "ไม่ระบุที่อยู่",
          mode: "manual",
        }),
      }).catch((e) => console.error("Notification async err:", e));
    } catch (e) {
      console.error(e);
    }

    return NextResponse.json({
      success: true,
      message: "ยืนยันการชำระเงินคำสั่งซื้อด้วยตนเองสำเร็จ",
    });
  } catch (error: unknown) {
    console.error("Manual approve error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดทางเทคนิคในการยืนยันสลิป" },
      { status: 500 }
    );
  }
}
