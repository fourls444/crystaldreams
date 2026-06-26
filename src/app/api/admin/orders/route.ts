import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/utils/supabase";
import { isAdminAuthenticated } from "@/utils/auth";

export async function DELETE(request: Request) {
  try {
    // Secure checking
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึงระบบ" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    const supabaseAdmin = getSupabaseAdmin();

    if (id) {
      // 1. Delete a single order by ID
      const { error } = await supabaseAdmin
        .from("orders")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Delete order error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, message: "ลบออเดอร์สำเร็จ" });
    } else {
      // 2. Delete ALL orders (clear everything)
      const { error } = await supabaseAdmin
        .from("orders")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000"); // Deletes all orders

      if (error) {
        console.error("Clear all orders error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, message: "ล้างข้อมูลออเดอร์ทั้งหมดเรียบร้อยแล้ว" });
    }
  } catch (error) {
    console.error("DELETE orders API error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึงระบบ" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "กรุณาระบุรหัสออเดอร์" }, { status: 400 });
    }

    const body = await request.json();
    const { shipping_status, shipping_carrier, tracking_number } = body;

    if (!shipping_status) {
      return NextResponse.json({ error: "กรุณาระบุสถานะการจัดส่ง" }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    const updateData: Record<string, any> = { 
      shipping_status,
      updated_at: new Date().toISOString()
    };
    
    if (shipping_carrier !== undefined) {
      updateData.shipping_carrier = shipping_carrier;
    }
    if (tracking_number !== undefined) {
      updateData.tracking_number = tracking_number;
    }

    const { error } = await supabaseAdmin
      .from("orders")
      .update(updateData)
      .eq("id", id);

    if (error) {
      console.error("Update shipping status error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "อัปเดตสถานะการจัดส่งสำเร็จ" });
  } catch (error) {
    console.error("PATCH orders API error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 });
  }
}
