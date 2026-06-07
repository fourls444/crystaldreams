"use client";

import { memo } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, FileText, Package, Settings, X } from "lucide-react";
import styles from "../admin.module.css";

interface AdminSidebarProps {
  activeTab: "dashboard" | "orders" | "products" | "settings";
  onTabChange: (tab: "dashboard" | "orders" | "products" | "settings") => void;
  pendingSlipsCount: number;
  isOpen?: boolean;
  onClose?: () => void;
}

function AdminSidebar({
  activeTab,
  onTabChange,
  pendingSlipsCount,
  isOpen = false,
  onClose,
}: AdminSidebarProps) {
  const router = useRouter();

  const handleLogout = async (e: React.FormEvent) => {
    e.preventDefault();
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
    <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ""}`}>
      <div className={styles.sidebarHeader}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
          <div 
            onClick={() => router.push("/")} 
            style={{ cursor: "pointer" }}
            title="กลับไปหน้าหลัก"
          >
            <h1 className={styles.sidebarLogo}>CRYSTAL DREAMS</h1>
            <div className={styles.sidebarSubtitle}>ระบบหลังบ้าน Backoffice</div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className={styles.sidebarCloseBtn}
              aria-label="ปิดเมนู"
              title="ปิดเมนู"
              type="button"
            >
              <X size={20} />
            </button>
          )}
        </div>
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

        <button
          onClick={() => onTabChange("settings")}
          className={`${styles.sidebarMenuItem} ${
            activeTab === "settings" ? styles.sidebarMenuItemActive : ""
          }`}
        >
          <span className={styles.menuItemLabel}>
            <Settings size={18} />
            <span>ตั้งค่าระบบ</span>
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

export default memo(AdminSidebar);
