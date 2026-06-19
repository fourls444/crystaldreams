import { getSupabaseAdmin } from "@/utils/supabase";
import HomeClient from "./HomeClient";

export const dynamic = "force-dynamic";

export default async function Home() {
  let settingsMap: Record<string, string> = {};
  let products: any[] = [];
  let reviews: any[] = [];

  try {
    const supabaseAdmin = getSupabaseAdmin();

    // 1. Fetch Settings
    const { data: settingsData } = await supabaseAdmin
      .from("settings")
      .select("key, value");

    if (settingsData) {
      settingsData.forEach((item) => {
        settingsMap[item.key] = item.value;
      });
    }

    // 2. Fetch all visible products
    const { data: productsData } = await supabaseAdmin
      .from("products")
      .select("*")
      .eq("is_visible", true)
      .order("sort_order", { ascending: true });

    if (productsData) {
      products = productsData;
    }

    // 3. Fetch all visible reviews
    const { data: reviewsData } = await supabaseAdmin
      .from("reviews")
      .select("*, products(name)")
      .eq("is_visible", true)
      .order("created_at", { ascending: false });

    if (reviewsData) {
      reviews = reviewsData;
    }
  } catch (err) {
    console.error("Failed to load homepage data:", err);
  }

  return (
    <HomeClient
      initialProducts={products}
      initialReviews={reviews}
      initialSettings={settingsMap}
    />
  );
}
