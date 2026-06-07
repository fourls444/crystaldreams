import styles from "./admin.module.css";

export default function AdminLoading() {
  return (
    <div className={styles.dashboardLayout}>
      {/* Sidebar Loading Skeleton */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div>
            <h1 className={styles.sidebarLogo}>CRYSTAL DREAMS</h1>
            <div className={styles.sidebarSubtitle}>ระบบหลังบ้าน Backoffice</div>
          </div>
        </div>
        <nav className={styles.sidebarMenu}>
          <div className={`${styles.sidebarMenuItem} ${styles.skeleton}`} style={{ height: "2.75rem", marginBottom: "0.5rem", width: "90%", opacity: 0.15 }}></div>
          <div className={`${styles.sidebarMenuItem} ${styles.skeleton}`} style={{ height: "2.75rem", marginBottom: "0.5rem", width: "90%", opacity: 0.15 }}></div>
          <div className={`${styles.sidebarMenuItem} ${styles.skeleton}`} style={{ height: "2.75rem", marginBottom: "0.5rem", width: "90%", opacity: 0.15 }}></div>
          <div className={`${styles.sidebarMenuItem} ${styles.skeleton}`} style={{ height: "2.75rem", marginBottom: "0.5rem", width: "90%", opacity: 0.15 }}></div>
        </nav>
      </aside>

      {/* Main Content Loading Skeleton */}
      <main className={styles.contentPanel}>
        <header className={styles.panelHeader}>
          <div>
            <div className={`${styles.skeleton} ${styles.skeletonText}`} style={{ width: "200px", height: "1.75rem", marginBottom: "0.5rem" }}></div>
            <div className={`${styles.skeleton} ${styles.skeletonText}`} style={{ width: "300px", height: "0.85rem" }}></div>
          </div>
        </header>

        {/* Stats Row Skeleton */}
        <div className={styles.statsGrid} style={{ marginBottom: "2rem" }}>
          <div className={styles.skeleton} style={{ height: "7rem", borderRadius: "1rem" }}></div>
          <div className={styles.skeleton} style={{ height: "7rem", borderRadius: "1rem" }}></div>
          <div className={styles.skeleton} style={{ height: "7rem", borderRadius: "1rem" }}></div>
        </div>

        {/* Table Skeleton */}
        <div className={styles.tableCard}>
          <div className={styles.cardHeader} style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "1rem", marginBottom: "1rem" }}>
            <div className={`${styles.skeleton} ${styles.skeletonText}`} style={{ width: "250px", height: "1.25rem" }}></div>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", padding: "0.5rem" }}>
            <div className={styles.skeleton} style={{ height: "2.5rem", borderRadius: "0.5rem" }}></div>
            <div className={styles.skeleton} style={{ height: "3.5rem", borderRadius: "0.5rem" }}></div>
            <div className={styles.skeleton} style={{ height: "3.5rem", borderRadius: "0.5rem" }}></div>
            <div className={styles.skeleton} style={{ height: "3.5rem", borderRadius: "0.5rem" }}></div>
            <div className={styles.skeleton} style={{ height: "3.5rem", borderRadius: "0.5rem" }}></div>
          </div>
        </div>
      </main>
    </div>
  );
}
