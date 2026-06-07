import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/utils/supabase";
import { isAdminAuthenticated } from "@/utils/auth";

export async function GET() {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึงระบบ" }, { status: 401 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from("settings")
      .select("key, value");

    if (error) {
      console.error("Error fetching settings:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Convert array of settings to key-value map
    const settingsMap: Record<string, string> = {};
    if (data) {
      data.forEach((item) => {
        settingsMap[item.key] = item.value;
      });
    }

    return NextResponse.json({ success: true, settings: settingsMap });
  } catch (error) {
    console.error("GET settings error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึงระบบ" }, { status: 401 });
    }

    const body = await request.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json({ error: "ข้อมูลไม่ครบถ้วน" }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from("settings")
      .upsert({
        key,
        value: String(value).trim(),
        updated_at: new Date().toISOString(),
      })
      .select();

    if (error) {
      console.error(`Error updating setting ${key}:`, error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("POST settings error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 });
  }
}
