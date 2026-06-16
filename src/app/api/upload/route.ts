import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/utils/supabase";
import { verifyOrderSlip } from "@/utils/verify";
import { sendAdminNotification } from "@/utils/notify";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const order_id = formData.get("order_id") as string;
    const customer_name = formData.get("customer_name") as string;
    const customer_tel = formData.get("customer_tel") as string;
    const customer_address = formData.get("customer_address") as string;
    const customer_line = formData.get("customer_line") as string | null;
    const slipFile = formData.get("slip") as File | null;

    if (!order_id || !customer_name || !customer_tel || !customer_address) {
      return NextResponse.json(
        { error: "กรุณากรอกข้อมูลจัดส่งให้ครบถ้วน" },
        { status: 400 }
      );
    }

    // Server-side character limits and format validation
    if (customer_name.trim().length > 80) {
      return NextResponse.json(
        { error: "ชื่อ-นามสกุล ต้องมีความยาวไม่เกิน 80 ตัวอักษร" },
        { status: 400 }
      );
    }

    const cleanTel = customer_tel.replace(/[^0-9]/g, "");
    if (!/^[0-9]{9,10}$/.test(cleanTel)) {
      return NextResponse.json(
        { error: "เบอร์โทรศัพท์ไม่ถูกต้อง (ต้องเป็นตัวเลข 9-10 หลัก)" },
        { status: 400 }
      );
    }

    if (customer_address.trim().length > 300) {
      return NextResponse.json(
        { error: "ที่อยู่สำหรับการจัดส่งต้องมีความยาวไม่เกิน 300 ตัวอักษร" },
        { status: 400 }
      );
    }

    if (customer_line && customer_line.trim().length > 80) {
      return NextResponse.json(
        { error: "Line ID ต้องมีความยาวไม่เกิน 80 ตัวอักษร" },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 1. Check if order exists and fetch items, quantity & product details
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("id, product_id, quantity, items, payment_method, total_amount, status")
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: "ไม่พบคำสั่งซื้อที่อ้างถึงในระบบ" },
        { status: 404 }
      );
    }

    const isCod = order.payment_method === "cod";

    // Guard: prevent double-submission / race condition
    // Stock should only be deducted from status "pending" orders
    if (order.status !== "pending") {
      return NextResponse.json(
        { error: "คำสั่งซื้อนี้ได้รับการดำเนินการแล้ว กรุณาไม่อัปโหลดซ้ำ" },
        { status: 409 }
      );
    }

    if (!isCod && !slipFile) {
      return NextResponse.json(
        { error: "กรุณาแนบสลิปโอนเงินเพื่อยืนยันคำสั่งซื้อ" },
        { status: 400 }
      );
    }

    let publicUrl: string | null = null;

    if (!isCod && slipFile) {
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
      const { data: { publicUrl: url } } = supabaseAdmin
        .storage
        .from("slips")
        .getPublicUrl(filename);

      publicUrl = url;
    }

    // 3.5 Validate Stock and Deduct Stock
    if (order.items && Array.isArray(order.items)) {
      const cartItems = order.items as Array<{ product_id: string; name: string; quantity: number }>;

      // First pass: Validate stock for all items
      for (const item of cartItems) {
        const { data: product, error: productError } = await supabaseAdmin
          .from("products")
          .select("name, stock")
          .eq("id", item.product_id)
          .single();

        if (productError || !product) {
          return NextResponse.json(
            { error: `ไม่พบข้อมูลสินค้า "${item.name}" ในระบบ` },
            { status: 404 }
          );
        }

        if (product.stock < item.quantity) {
          return NextResponse.json(
            { error: `ขออภัย สต็อกสินค้า "${item.name}" ไม่เพียงพอ (คงเหลือ ${product.stock} ชิ้น)` },
            { status: 400 }
          );
        }
      }

      // Second pass: Deduct stock for all items
      for (const item of cartItems) {
        const { data: product } = await supabaseAdmin
          .from("products")
          .select("stock")
          .eq("id", item.product_id)
          .single();

        if (product) {
          const { error: updateStockError } = await supabaseAdmin
            .from("products")
            .update({
              stock: product.stock - item.quantity,
              updated_at: new Date().toISOString(),
            })
            .eq("id", item.product_id);

          if (updateStockError) {
            console.error(`Failed to update stock for product ${item.product_id}:`, updateStockError);
            return NextResponse.json(
              { error: "ไม่สามารถอัปเดตสต็อกสินค้าบางรายการได้" },
              { status: 500 }
            );
          }
        }
      }
    } else {
      // Fallback: Validate Stock and Deduct Stock for old single product order
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
    }

    // 4. Update Order details and status
    const status = isCod ? "cod_pending" : "slip_uploaded";

    const { error: updateError } = await supabaseAdmin
      .from("orders")
      .update({
        customer_name,
        customer_tel,
        customer_address,
        customer_line: customer_line || null,
        slip_url: publicUrl,
        status,
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

    // 5. Trigger auto slip verification or send COD notification
    if (!isCod) {
      console.log(`[Upload API] Initiating auto-verification on server for Order ID: ${order_id}`);
      const verifyResult = await verifyOrderSlip(order_id);
      
      return NextResponse.json({
        success: true,
        message: verifyResult.verified 
          ? "ยืนยันการชำระเงินและบันทึกที่อยู่จัดส่งเรียบร้อยแล้ว" 
          : `บันทึกที่อยู่สำเร็จ: ${verifyResult.message}`,
        verified: verifyResult.verified,
      });
    } else {
      console.log(`[Upload API] Sending COD notification for Order ID: ${order_id}`);
      await sendAdminNotification({
        orderId: order_id,
        customerName: customer_name,
        customerTel: customer_tel,
        customerAddress: customer_address,
        customerLine: customer_line || undefined,
        amount: Number(order.total_amount),
        status: "cod_pending",
      });

      return NextResponse.json({
        success: true,
        message: "บันทึกออเดอร์เก็บเงินปลายทางเรียบร้อยแล้ว",
        verified: false,
      });
    }
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
