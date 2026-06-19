import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/utils/supabase";
import { isAdminAuthenticated } from "@/utils/auth";

export async function POST(request: Request) {
  try {
    // Secure checking
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึงระบบ" }, { status: 401 });
    }

    const { product_id, customer_name, image_urls, rating, comment, is_visible, created_at } = await request.json();

    if (!product_id || !customer_name || rating === undefined || !comment) {
      return NextResponse.json({ error: "ข้อมูลไม่ครบถ้วน" }, { status: 400 });
    }

    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 0.5 || numRating > 5.0) {
      return NextResponse.json({ error: "คะแนนดาวต้องอยู่ระหว่าง 0.5 ถึง 5.0" }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    
    // Insert
    const insertData: any = {
      product_id,
      customer_name,
      image_urls: image_urls || [],
      rating: numRating,
      comment,
      is_visible: is_visible !== false,
    };

    if (created_at) {
      insertData.created_at = new Date(created_at).toISOString();
    }

    const { data, error } = await supabaseAdmin
      .from("reviews")
      .insert(insertData)
      .select();

    if (error) {
      console.error(error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
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

    const { id, product_id, customer_name, image_urls, rating, comment, is_visible, created_at } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "กรุณาระบุ ID รีวิวที่ต้องการแก้ไข" }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (product_id !== undefined) updateData.product_id = product_id;
    if (customer_name !== undefined) updateData.customer_name = customer_name;
    if (image_urls !== undefined) updateData.image_urls = image_urls;
    if (comment !== undefined) updateData.comment = comment;
    if (is_visible !== undefined) updateData.is_visible = is_visible;
    if (created_at !== undefined) {
      updateData.created_at = created_at ? new Date(created_at).toISOString() : new Date().toISOString();
    }
    
    if (rating !== undefined) {
      const numRating = Number(rating);
      if (isNaN(numRating) || numRating < 0.5 || numRating > 5.0) {
        return NextResponse.json({ error: "คะแนนดาวต้องอยู่ระหว่าง 0.5 ถึง 5.0" }, { status: 400 });
      }
      updateData.rating = numRating;
    }

    // Update
    const { data, error } = await supabaseAdmin
      .from("reviews")
      .update(updateData)
      .eq("id", id)
      .select();

    if (error) {
      console.error(error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
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
      return NextResponse.json({ error: "กรุณาระบุ ID รีวิวที่ต้องการลบ" }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 1. Fetch review first to get its image urls for storage cleanup
    const { data: review } = await supabaseAdmin
      .from("reviews")
      .select("image_urls")
      .eq("id", id)
      .single();

    // 2. Delete review from database
    const { error } = await supabaseAdmin
      .from("reviews")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 3. Clean up storage files if the review had images
    if (review && review.image_urls && review.image_urls.length > 0) {
      const filenames = review.image_urls
        .map((url: string) => {
          const parts = url.split("/review-images/");
          return parts.length > 1 ? parts[1] : url.split("/").pop();
        })
        .filter(Boolean) as string[];

      if (filenames.length > 0) {
        supabaseAdmin.storage
          .from("review-images")
          .remove(filenames)
          .catch((err) => console.error("Failed to clean up storage images on review delete:", err));
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
