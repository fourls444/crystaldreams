import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/utils/supabase";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const order_id = formData.get("order_id") as string;
    const customer_name = formData.get("customer_name") as string;
    const customer_tel = formData.get("customer_tel") as string;
    const customer_address = formData.get("customer_address") as string;
    const slipFile = formData.get("slip") as File;

    if (!order_id || !customer_name || !customer_tel || !customer_address || !slipFile) {
      return NextResponse.json(
        { error: "กรุณากรอกข้อมูลจัดส่งและแนบสลิปโอนเงินให้ครบถ้วน" },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 1. Check if order exists
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("id")
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: "ไม่พบคำสั่งซื้อที่อ้างถึงในระบบ" },
        { status: 404 }
      );
    }

    // 2. Upload file to Supabase Storage Bucket 'slips'
    // Generate a unique filename using order_id and timestamp
    const fileExtension = slipFile.name.split(".").pop() || "png";
    const filename = `${order_id}_${Date.now()}.${fileExtension}`;
    const fileBuffer = Buffer.from(await slipFile.arrayBuffer());

    const { data: uploadData, error: uploadError } = await supabaseAdmin
      .storage
      .from("slips")
      .upload(filename, fileBuffer, {
        contentType: slipFile.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json(
        { error: "ไม่สามารถอัปโหลดไฟล์สลิปได้ กรุณาลองใหม่อีกครั้ง" },
        { status: 500 }
      );
    }

    // 3. Get Public URL of the uploaded slip
    const { data: { publicUrl } } = supabaseAdmin
      .storage
      .from("slips")
      .getPublicUrl(filename);

    // 4. Update Order details and status
    const { error: updateError } = await supabaseAdmin
      .from("orders")
      .update({
        customer_name,
        customer_tel,
        customer_address,
        slip_url: publicUrl,
        status: "slip_uploaded",
        updated_at: new Date().toISOString(),
      })
      .eq("id", order_id);

    if (updateError) {
      console.error("Database update error:", updateError);
      return NextResponse.json(
        { error: "ไม่สามารถอัปเดตข้อมูลคำสั่งซื้อได้" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "อัปโหลดข้อมูลจัดส่งและสลิปเงินเรียบร้อยแล้ว",
    });
  } catch (error: any) {
    console.error("Upload API main error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์" },
      { status: 500 }
    );
  }
}
export const dynamic = "force-dynamic";
export const maxDuration = 60; // Max execution time for Vercel functions (if needed)
