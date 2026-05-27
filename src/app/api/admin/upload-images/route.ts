import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/utils/supabase";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("admin_session");

    // Secure checking
    if (!session || session.value !== "authenticated") {
      return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึงระบบ" }, { status: 401 });
    }

    const formData = await req.formData();
    const files = formData.getAll("images") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "ไม่พบรูปภาพที่ต้องการอัปโหลด" }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 1. Ensure bucket 'product-images' exists and is public
    try {
      const { data: buckets } = await supabaseAdmin.storage.listBuckets();
      const bucketExists = buckets?.some((b) => b.name === "product-images");
      if (!bucketExists) {
        await supabaseAdmin.storage.createBucket("product-images", {
          public: true,
        });
      }
    } catch (e) {
      console.error("Failed to check/create bucket:", e);
    }

    // 2. Upload each file and get public URLs
    const urls: string[] = [];

    for (const file of files) {
      const fileExtension = file.name.split(".").pop() || "png";
      const filename = `product_${Date.now()}_${Math.random().toString(36).substring(2, 11)}.${fileExtension}`;
      const fileBuffer = Buffer.from(await file.arrayBuffer());

      const { error: uploadError } = await supabaseAdmin.storage
        .from("product-images")
        .upload(filename, fileBuffer, {
          contentType: file.type,
          upsert: true,
        });

      if (uploadError) {
        console.error("Storage upload error for file:", file.name, uploadError);
        return NextResponse.json({ error: `ไม่สามารถอัปโหลดไฟล์ ${file.name} ได้` }, { status: 500 });
      }

      const { data: { publicUrl } } = supabaseAdmin.storage
        .from("product-images")
        .getPublicUrl(filename);

      urls.push(publicUrl);
    }

    return NextResponse.json({ success: true, urls });
  } catch (error) {
    console.error("Upload images API error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
export const maxDuration = 60;
