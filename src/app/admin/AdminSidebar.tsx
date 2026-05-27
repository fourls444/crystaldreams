"use client";

import { useRouter } from "next/navigation";
import { BarChart3, FileText, Package } from "lucide-react";
import styles from "./admin.module.css";

interface AdminSidebarProps {
  activeTab: "dashboard" | "orders" | "products";
  onTabChange: (tab: "dashboard" | "orders" | "products") => void;
  pendingSlipsCount: number;
}

export default function AdminSidebar({
  activeTab,
  onTabChange,
  pendingSlipsCount,
}: AdminSidebarProps) {
  const router = useRouter();

  const handleLogout = async (e: React.FormEvent) => {
    e.preventDefault();
    // Clear admin_session cookie
    await fetch("/api/admin/products", { method: "DELETE" }).catch(() => {});
    // Call logout via server action/api route
    await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ logout: true }),
    }).catch(() => {});
    
    // Standard client logout: delete cookies client-side
    document.cookie = "admin_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <h1 className={styles.sidebarLogo}>CRYSTAL DREAMS</h1>
        <div className={styles.sidebarSubtitle}>ระบบหลังบ้าน Backoffice</div>
      </div>

      <nav className={styles.sidebarMenu}>
        <button
          onClick={() => onTabChange("dashboard")}
          className={`${styles.sidebarMenuItem} ${
            activeTab === "dashboard" ? styles.sidebarMenuItemActive : ""
          }`}
        >
          <span className={styles.menuItemLabel}>
            <BarChart3 size={18} />
            <span>หน้าแรก</span>
          </span>
        </button>

        <button
          onClick={() => onTabChange("orders")}
          className={`${styles.sidebarMenuItem} ${
            activeTab === "orders" ? styles.sidebarMenuItemActive : ""
          }`}
        >
          <span className={styles.menuItemLabel}>
            <FileText size={18} />
            <span>ออเดอร์ & สลิป</span>
          </span>
          {pendingSlipsCount > 0 && (
            <span className={styles.sidebarBadge}>{pendingSlipsCount}</span>
          )}
        </button>

        <button
          onClick={() => onTabChange("products")}
          className={`${styles.sidebarMenuItem} ${
            activeTab === "products" ? styles.sidebarMenuItemActive : ""
          }`}
        >
          <span className={styles.menuItemLabel}>
            <Package size={18} />
            <span>จัดการสินค้า</span>
          </span>
        </button>
      </nav>

      <div className={styles.sidebarFooter}>
        <form className={styles.sidebarLogoutForm} onSubmit={handleLogout}>
          <button type="submit" className={styles.sidebarLogoutBtn}>
            ออกจากระบบ
          </button>
        </form>
      </div>
    </aside>
  );
}
