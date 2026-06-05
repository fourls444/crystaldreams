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
