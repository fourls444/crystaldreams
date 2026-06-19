import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/utils/supabase";
import AdminDashboardClient from "@/app/admin/AdminDashboardClient";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");

  if (!session || session.value !== "authenticated") {
    redirect("/admin/login");
  }

  const supabaseAdmin = getSupabaseAdmin();

  // 1. Fetch all products
  const { data: products } = await supabaseAdmin
    .from("products")
    .select("*")
    .order("sort_order", { ascending: true });

  // 2. Fetch all orders
  const { data: orders } = await supabaseAdmin
    .from("orders")
    .select("*, products(name)")
    .order("created_at", { ascending: false });

  // 3. Fetch all reviews
  const { data: reviews } = await supabaseAdmin
    .from("reviews")
    .select("*, products(name)")
    .order("created_at", { ascending: false });

  return (
    <AdminDashboardClient
      initialProducts={products || []}
      initialOrders={orders || []}
      initialReviews={reviews || []}
    />
  );
}
