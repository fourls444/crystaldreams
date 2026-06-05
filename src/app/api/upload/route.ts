import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/utils/supabase";
import { verifyOrderSlip } from "@/utils/verify";

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

    // 1. Check if order exists and fetch quantity & product details
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("id, product_id, quantity")
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

    const { error: uploadError } = await supabaseAdmin
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

    // 3.5 Validate Stock and Deduct Stock
    const { data: product, error: productError } = await supabaseAdmin
      .from("products")
      .select("stock")
      .eq("id", order.product_id)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { error: "ไม่พบข้อมูลสินค้าสัมพันธ์ในระบบ" },
        { status: 404 }
      );
    }

    if (product.stock < order.quantity) {
      return NextResponse.json(
        { error: "ขออภัย สต็อกสินค้าไม่เพียงพอสำหรับการสั่งซื้อนี้" },
        { status: 400 }
      );
    }

    const { error: updateStockError } = await supabaseAdmin
      .from("products")
      .update({
        stock: product.stock - order.quantity,
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.product_id);

    if (updateStockError) {
      console.error("Failed to update stock:", updateStockError);
      return NextResponse.json(
        { error: "ไม่สามารถอัปเดตสต็อกสินค้าได้" },
        { status: 500 }
      );
    }

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

    // 5. Trigger auto slip verification synchronously on the server side
    console.log(`[Upload API] Initiating auto-verification on server for Order ID: ${order_id}`);
    const verifyResult = await verifyOrderSlip(order_id);
    
    return NextResponse.json({
      success: true,
      message: verifyResult.verified 
        ? "ยืนยันการชำระเงินและบันทึกที่อยู่จัดส่งเรียบร้อยแล้ว" 
        : `บันทึกที่อยู่สำเร็จ: ${verifyResult.message}`,
      verified: verifyResult.verified,
    });
  } catch (error: unknown) {
    console.error("Upload API main error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์" },
      { status: 500 }
    );
  }
}
export const dynamic = "force-dynamic";
export const maxDuration = 60; // Max execution time for Vercel functions (if needed)
