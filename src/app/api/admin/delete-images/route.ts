import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/utils/supabase";
import { isAdminAuthenticated } from "@/utils/auth";

export async function POST(req: Request) {
  try {
    // 1. Secure checking
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึงระบบ" }, { status: 401 });
    }

    const { urls } = await req.json();
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ error: "ไม่พบรูปภาพที่ต้องการลบ" }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const filenames: string[] = [];

    for (const url of urls) {
      // Extract filename from public URL (product-images bucket)
      const parts = url.split("/product-images/");
      const filename = parts.length > 1 ? parts[1] : url.split("/").pop();
      if (filename) {
        filenames.push(filename);
      }
    }

    if (filenames.length === 0) {
      return NextResponse.json({ success: true, message: "ไม่มีรูปภาพที่ต้องลบ" });
    }

    // Delete files from Supabase Storage bucket 'product-images'
    const { data, error } = await supabaseAdmin.storage
      .from("product-images")
      .remove(filenames);

    if (error) {
      console.error("Storage delete error:", error);
      return NextResponse.json({ error: "ไม่สามารถลบรูปภาพจากพื้นที่จัดเก็บได้" }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการลบรูปภาพ";
    console.error("Delete images API error:", error);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
