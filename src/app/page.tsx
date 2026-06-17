import { Suspense } from "react";
import Header from "@/components/Header/Header";
import ProductDetail, { ProductDetailSkeleton } from "@/components/ProductDetail/ProductDetail";
import Footer from "@/components/Footer/Footer";
import { getSupabaseAdmin } from "@/utils/supabase";

export const dynamic = "force-dynamic";

export default async function Home() {
  let settingsMap: Record<string, string> = {};
  
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from("settings")
      .select("key, value");

    if (!error && data) {
      data.forEach((item) => {
        settingsMap[item.key] = item.value;
      });
    }
  } catch (err) {
    console.error("Failed to load settings on server-side homepage:", err);
  }

  return (
    <div className="min-h-screen bg-white text-slate-800 flex flex-col justify-between font-sans">
      <Header />
      <Suspense fallback={<ProductDetailSkeleton />}>
        <ProductDetail />
      </Suspense>
      <Footer initialSettings={settingsMap} />
    </div>
  );
}

