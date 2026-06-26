import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/utils/supabase";

function maskName(name: string | null) {
  if (!name) return "";
  const trimmed = name.trim();
  if (trimmed.length <= 2) return trimmed[0] + "*";
  return trimmed[0] + "*".repeat(trimmed.length - 2) + trimmed[trimmed.length - 1];
}

function maskTel(tel: string | null) {
  if (!tel) return "";
  const cleaned = tel.replace(/[-\s]/g, "");
  if (cleaned.length <= 6) return cleaned;
  return cleaned.slice(0, 3) + "-***-" + cleaned.slice(-4);
}

function maskAddress(addr: string | null) {
  if (!addr) return "";
  const trimmed = addr.trim();
  if (trimmed.length <= 15) return trimmed.slice(0, 5) + "...";
  return trimmed.slice(0, 8) + "..." + trimmed.slice(-12);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId")?.trim();
    const phone = searchParams.get("phone")?.trim();

    if (!orderId && !phone) {
      return NextResponse.json(
        { error: "กรุณาระบุหมายเลขคำสั่งซื้อหรือเบอร์โทรศัพท์เพื่อค้นหา" },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    if (orderId) {
      // 1. Track by Order ID (UUID)
      const { data: order, error: fetchError } = await supabaseAdmin
        .from("orders")
        .select("*, products(name)")
        .eq("id", orderId)
        .single();

      if (fetchError || !order) {
        return NextResponse.json(
          { error: "ไม่พบข้อมูลคำสั่งซื้อในระบบ กรุณาตรวจสอบหมายเลขคำสั่งซื้ออีกครั้ง" },
          { status: 404 }
        );
      }

      // Secure order representation for public view
      const safeOrder = {
        id: order.id,
        created_at: order.created_at,
        total_amount: Number(order.total_amount),
        quantity: order.quantity,
        status: order.status,
        shipping_status: order.shipping_status,
        shipping_carrier: order.shipping_carrier || null,
        tracking_number: order.tracking_number || null,
        payment_method: order.payment_method,
        products: order.products,
        items: order.items,
        customer_name: maskName(order.customer_name),
        customer_tel: maskTel(order.customer_tel),
        customer_address: maskAddress(order.customer_address),
        customer_line: order.customer_line ? order.customer_line.slice(0, 2) + "***" : null,
      };

      return NextResponse.json({ success: true, order: safeOrder });
    } else if (phone) {
      // 2. Track by Phone Number
      // Clean phone number input to match different formats
      const cleanPhone = phone.replace(/[-\s]/g, "");
      
      // We will select all orders but need to filter by matching cleaned phone numbers
      // Since phone numbers might be saved with dashes or spaces, we'll fetch all orders created in the last 60 days
      // and do the clean matching in memory to ensure accuracy.
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      const { data: orders, error: fetchError } = await supabaseAdmin
        .from("orders")
        .select("*, products(name)")
        .gte("created_at", sixtyDaysAgo.toISOString())
        .order("created_at", { ascending: false });

      if (fetchError || !orders) {
        console.error("Fetch orders by phone error:", fetchError);
        return NextResponse.json(
          { error: "เกิดข้อผิดพลาดในการดึงข้อมูลระบบ" },
          { status: 500 }
        );
      }

      // Filter in memory for cleaned matching
      const matchedOrders = orders.filter((o) => {
        if (!o.customer_tel) return false;
        const cleanedDbPhone = o.customer_tel.replace(/[-\s]/g, "");
        return cleanedDbPhone === cleanPhone || cleanedDbPhone.endsWith(cleanPhone) || cleanPhone.endsWith(cleanedDbPhone);
      });

      if (matchedOrders.length === 0) {
        return NextResponse.json(
          { error: "ไม่พบรายการสั่งซื้อที่เชื่อมโยงกับเบอร์โทรศัพท์นี้ในช่วง 60 วันที่ผ่านมา" },
          { status: 404 }
        );
      }

      // Mask details for list view
      const safeOrdersList = matchedOrders.map((order) => ({
        id: order.id,
        created_at: order.created_at,
        total_amount: Number(order.total_amount),
        quantity: order.quantity,
        status: order.status,
        shipping_status: order.shipping_status,
        shipping_carrier: order.shipping_carrier || null,
        tracking_number: order.tracking_number || null,
        payment_method: order.payment_method,
        products: order.products,
        items: order.items,
        customer_name: maskName(order.customer_name),
        customer_tel: maskTel(order.customer_tel),
        customer_address: maskAddress(order.customer_address),
      }));

      return NextResponse.json({ success: true, orders: safeOrdersList });
    }
  } catch (error) {
    console.error("Order tracking API error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" },
      { status: 500 }
    );
  }
}
