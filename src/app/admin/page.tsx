import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/utils/supabase";
import AdminProductForm from "@/app/admin/AdminProductForm";
import styles from "./admin.module.css";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");

  if (!session || session.value !== "authenticated") {
    redirect("/admin/login");
  }

  // Fetch the first product to edit
  const supabaseAdmin = getSupabaseAdmin();
  const { data: product, error } = await supabaseAdmin
    .from("products")
    .select("*")
    .limit(1)
    .single();

  if (error || !product) {
    return (
      <div className={styles.container}>
        <div className={styles.errorCard}>
          <h2>ไม่สามารถโหลดข้อมูลสินค้าได้</h2>
          <p>กรุณาตรวจสอบว่ามีข้อมูลสินค้าอยู่ในฐานข้อมูลแล้ว</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>ระบบหลังบ้าน</h1>
        <form action={async () => {
          "use server";
          const cookieStore = await cookies();
          cookieStore.delete("admin_session");
          redirect("/admin/login");
        }}>
          <button type="submit" className={styles.logoutBtn}>
            ออกจากระบบ
          </button>
        </form>
      </header>

      <main className={styles.main}>
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>แก้ไขข้อมูลสินค้า</h2>
          <p className={styles.sectionSubtitle}>
            แก้ไขรายละเอียด ชื่อสินค้า ราคา และจำนวนสต็อกสินค้าในร้าน
          </p>

          <AdminProductForm initialProduct={product} />
        </div>
      </main>
    </div>
  );
}
