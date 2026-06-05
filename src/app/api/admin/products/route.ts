import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/utils/supabase";
import { isAdminAuthenticated } from "@/utils/auth";

export async function POST(request: Request) {
  try {
    // Secure checking
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึงระบบ" }, { status: 401 });
    }

    const { id, name, price, stock, image_url, description, detail, image_urls, is_visible } = await request.json();

    if (!name || price === undefined || stock === undefined) {
      return NextResponse.json({ error: "ข้อมูลไม่ครบถ้วน" }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    
    if (id) {
      // Update
      const { data, error } = await supabaseAdmin
        .from("products")
        .update({
          name,
          price,
          stock,
          image_url: image_url || (image_urls && image_urls.length > 0 ? image_urls[0] : null),
          description,
          detail,
          image_urls,
          is_visible: is_visible !== false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select();

      if (error) {
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, data });
    } else {
      // Insert
      const { data, error } = await supabaseAdmin
        .from("products")
        .insert({
          name,
          price,
          stock,
          image_url: image_url || (image_urls && image_urls.length > 0 ? image_urls[0] : null),
          description,
          detail,
          image_urls,
          is_visible: is_visible !== false,
        })
        .select();

      if (error) {
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, data });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    // Secure checking
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึงระบบ" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "กรุณาระบุ ID สินค้าที่ต้องการลบ" }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 1. Fetch product first to get its image urls for storage cleanup
    const { data: product } = await supabaseAdmin
      .from("products")
      .select("image_urls")
      .eq("id", id)
      .single();

    // 2. Delete product from database
    const { error } = await supabaseAdmin
      .from("products")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 3. Clean up storage files if the product had images
    if (product && product.image_urls && product.image_urls.length > 0) {
      const filenames = product.image_urls
        .map((url: string) => {
          const parts = url.split("/product-images/");
          return parts.length > 1 ? parts[1] : url.split("/").pop();
        })
        .filter(Boolean) as string[];

      if (filenames.length > 0) {
        supabaseAdmin.storage
          .from("product-images")
          .remove(filenames)
          .catch((err) => console.error("Failed to clean up storage images on product delete:", err));
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    // Secure checking
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึงระบบ" }, { status: 401 });
    }

    const { orderedIds } = await request.json();

    if (!orderedIds || !Array.isArray(orderedIds)) {
      return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Update sort_order for each product
    for (let i = 0; i < orderedIds.length; i++) {
      const { error } = await supabaseAdmin
        .from("products")
        .update({ sort_order: i })
        .eq("id", orderedIds[i]);

      if (error) {
        console.error(`Error updating sort_order for ${orderedIds[i]}:`, error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 });
  }
}

