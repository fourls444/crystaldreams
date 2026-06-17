import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/utils/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from("settings")
      .select("key, value");

    if (error) {
      console.error("Error fetching public settings:", error);
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
  } catch (error: any) {
    console.error("GET public settings error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 });
  }
}
