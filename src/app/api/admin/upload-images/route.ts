import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/utils/supabase";
import { isAdminAuthenticated } from "@/utils/auth";

export async function POST(req: Request) {
  try {
    // Secure checking
    if (!(await isAdminAuthenticated())) {
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

    // 2. Upload files in parallel and get public URLs
    const uploadPromises = files.map(async (file) => {
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
        throw new Error(`ไม่สามารถอัปโหลดไฟล์ ${file.name} ได้`);
      }

      const { data: { publicUrl } } = supabaseAdmin.storage
        .from("product-images")
        .getPublicUrl(filename);

      return publicUrl;
    });

    const urls = await Promise.all(uploadPromises);

    return NextResponse.json({ success: true, urls });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ";
    console.error("Upload images API error:", error);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
export const maxDuration = 60;

