"use client";

import { Trash2 } from "lucide-react";
import styles from "../admin.module.css";

interface Order {
  id: string;
  product_id: string | null;
  quantity: number;
  total_amount: number;
  customer_name: string | null;
  customer_tel: string | null;
  customer_address: string | null;
  status: string;
  slip_url: string | null;
  slip_verified: boolean;
  verified_by: string | null;
  created_at: string;
  products?: {
    name: string;
  } | null;
  items?: any;
}

interface OrdersAndSlipsManagerProps {
  initialOrders: Order[];
  filteredOrders: Order[];
  orderFilter: "all" | "slip_uploaded" | "verified" | "rejected" | "pending";
  onSetOrderFilter: (filter: "all" | "slip_uploaded" | "verified" | "rejected" | "pending") => void;
  searchQuery: string;
  onSetSearchQuery: (query: string) => void;
  formatThaiDate: (dateStr: string) => string;
  getStatusText: (status: string) => string;
  getStatusBadgeClass: (status: string) => string;
  onSelectAddressOrder: (order: Order) => void;
  onSelectOrder: (order: Order) => void;
  onDeleteOrder: (orderId: string) => void;
  actionLoading: string | null;
}

export default function OrdersAndSlipsManager({
  initialOrders,
  filteredOrders,
  orderFilter,
  onSetOrderFilter,
  searchQuery,
  onSetSearchQuery,
  formatThaiDate,
  getStatusText,
  getStatusBadgeClass,
  onSelectAddressOrder,
  onSelectOrder,
  onDeleteOrder,
  actionLoading,
}: OrdersAndSlipsManagerProps) {
  return (
    <div>
      <header className={styles.panelHeader}>
        <div>
          <h2 className={styles.panelTitle}>จัดการรายการสั่งซื้อ & สลิปโอนเงิน</h2>
          <p className={styles.panelSubtitle}>ดูรายการสั่งซื้อ รูปสลิป ตรวจสอบอัตโนมัติ หรือกดยืนยัน/ปฏิเสธ</p>
        </div>
      </header>

      <div className={styles.tableCard}>
        {/* Tab Filters & Search Bar */}
        <div className={styles.tableFilters}>
          <button
            onClick={() => onSetOrderFilter("all")}
            className={`${styles.filterBtn} ${orderFilter === "all" ? styles.filterBtnActive : ""}`}
          >
            ทั้งหมด ( {initialOrders.length} )
          </button>
          <button
            onClick={() => onSetOrderFilter("slip_uploaded")}
            className={`${styles.filterBtn} ${orderFilter === "slip_uploaded" ? styles.filterBtnActive : ""}`}
          >
            รอตรวจสลิป ( {initialOrders.filter((o) => o.status === "slip_uploaded").length} )
          </button>
          <button
            onClick={() => onSetOrderFilter("verified")}
            className={`${styles.filterBtn} ${orderFilter === "verified" ? styles.filterBtnActive : ""}`}
          >
            ชำระเงินสำเร็จ ( {initialOrders.filter((o) => o.status === "verified").length} )
          </button>
          <button
            onClick={() => onSetOrderFilter("rejected")}
            className={`${styles.filterBtn} ${orderFilter === "rejected" ? styles.filterBtnActive : ""}`}
          >
            ปฏิเสธ/ยกเลิก ( {initialOrders.filter((o) => o.status === "rejected").length} )
          </button>
          <button
            onClick={() => onSetOrderFilter("pending")}
            className={`${styles.filterBtn} ${orderFilter === "pending" ? styles.filterBtnActive : ""}`}
          >
            รอชำระเงิน ( {initialOrders.filter((o) => o.status === "pending").length} )
          </button>
        </div>

        <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid #e2e8f0" }}>
          <input
            type="text"
            placeholder="🔍 ค้นหาด้วยรหัสออเดอร์, ชื่อลูกค้า, หรือเบอร์โทรศัพท์..."
            value={searchQuery}
            onChange={(e) => onSetSearchQuery(e.target.value)}
            className={styles.input}
            style={{ width: "100%", maxWidth: "450px" }}
          />
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Order ID</th>
                <th style={{ textAlign: "center" }}>รายละเอียดออเดอร์</th>
                <th style={{ textAlign: "center" }}>ยอดชำระ</th>
                <th style={{ textAlign: "center" }}>สถานะ</th>
                <th style={{ textAlign: "center" }}>การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} className={styles.tableRow}>
                  <td style={{ fontFamily: "monospace" }}>
                    <div>#{order.id.slice(0, 8)}</div>
                    <div style={{ fontSize: "0.75rem", color: "#64748b", fontFamily: "sans-serif", marginTop: "0.15rem" }}>
                      {formatThaiDate(order.created_at)}
                    </div>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <button
                      onClick={() => onSelectAddressOrder(order)}
                      className={styles.viewSlipBtn}
                    >
                      ดูรายละเอียด
                    </button>
                  </td>
                  <td className={styles.orderPrice} style={{ textAlign: "center" }}>{order.total_amount.toLocaleString()} ฿</td>
                  <td style={{ textAlign: "center" }}>
                    <span className={`${styles.statusBadge} ${getStatusBadgeClass(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actionCell} style={{ justifyContent: "center", alignItems: "center", gap: "0.5rem" }}>
                      {order.slip_url ? (
                        <button
                          onClick={() => onSelectOrder(order)}
                          className={styles.viewSlipBtn}
                        >
                          ดูสลิปหลักฐาน
                        </button>
                      ) : (
                        <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>ไม่มีสลิป</span>
                      )}
                      <button
                        onClick={() => onDeleteOrder(order.id)}
                        disabled={actionLoading === order.id}
                        className={styles.deleteProductBtn}
                        style={{ padding: "0.35rem 0.5rem", fontSize: "0.8rem", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 0 }}
                        title="ลบออเดอร์นี้"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
                    <div className={styles.emptyState}>
                      <div className={styles.emptyStateIcon}>🔍</div>
                      <div className={styles.emptyStateTitle}>ไม่พบออเดอร์</div>
                      <div className={styles.emptyStateDesc}>ไม่มีคำสั่งซื้อที่ตรงกับตัวกรองหรือการค้นหา</div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
