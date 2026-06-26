"use client";

import { memo } from "react";
import { Trash2 } from "lucide-react";
import styles from "../admin.module.css";
import type { Order } from "@/types/order";

interface OrdersAndSlipsManagerProps {
  initialOrders: Order[];
  filteredOrders: Order[];
  orderFilter: "all" | "promptpay" | "cod";
  onSetOrderFilter: (filter: "all" | "promptpay" | "cod") => void;
  searchQuery: string;
  onSetSearchQuery: (query: string) => void;
  formatThaiDate: (dateStr: string) => string;
  getStatusText: (status: string) => string;
  getStatusBadgeClass: (status: string) => string;
  getShippingStatusText: (shippingStatus: string) => string;
  getShippingStatusBadgeClass: (shippingStatus: string) => string;
  onSelectAddressOrder: (order: Order) => void;
  onSelectOrder: (order: Order) => void;
  onDeleteOrder: (orderId: string) => void;
  actionLoading: string | null;
}

function OrdersAndSlipsManager({
  initialOrders,
  filteredOrders,
  orderFilter,
  onSetOrderFilter,
  searchQuery,
  onSetSearchQuery,
  formatThaiDate,
  getStatusText,
  getStatusBadgeClass,
  getShippingStatusText,
  getShippingStatusBadgeClass,
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
            onClick={() => onSetOrderFilter("promptpay")}
            className={`${styles.filterBtn} ${orderFilter === "promptpay" ? styles.filterBtnActive : ""}`}
          >
            โอนเงินผ่านพร้อมเพย์ ( {initialOrders.filter((o) => o.payment_method !== "cod").length} )
          </button>
          <button
            onClick={() => onSetOrderFilter("cod")}
            className={`${styles.filterBtn} ${orderFilter === "cod" ? styles.filterBtnActive : ""}`}
          >
            เก็บเงินปลายทาง ( {initialOrders.filter((o) => o.payment_method === "cod").length} )
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
                <th>ชื่อผู้รับ</th>
                <th style={{ textAlign: "center" }}>รายละเอียดออเดอร์</th>
                <th style={{ textAlign: "center" }}>ยอดชำระ</th>
                <th style={{ textAlign: "center" }}>สถานะการชำระเงิน</th>
                <th style={{ textAlign: "center" }}>สถานะการจัดส่ง</th>
                <th style={{ textAlign: "center" }}>การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} className={styles.tableRow}>
                  <td style={{ fontFamily: "monospace" }}>
                    <div style={{ fontWeight: "bold" }}>#{order.id.slice(0, 8)}</div>
                    <div style={{ fontSize: "0.75rem", color: "#64748b", fontFamily: "sans-serif", marginTop: "0.15rem" }}>
                      {formatThaiDate(order.created_at)}
                    </div>
                  </td>
                  <td>
                    {order.customer_name ? (
                      <span style={{ fontWeight: 500 }}>{order.customer_name}</span>
                    ) : (
                      <span style={{ color: "#94a3b8", fontStyle: "italic", fontSize: "0.85rem" }}>ยังไม่ระบุ</span>
                    )}
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
                  <td style={{ textAlign: "center" }}>
                    <span className={`${styles.statusBadge} ${getShippingStatusBadgeClass(order.shipping_status)}`}>
                      {getShippingStatusText(order.shipping_status)}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actionCell} style={{ justifyContent: "center", alignItems: "center", gap: "0.5rem" }}>
                      {order.payment_method !== "cod" && (
                        order.slip_url ? (
                          <button
                            onClick={() => onSelectOrder(order)}
                            className={styles.viewSlipBtn}
                          >
                            ดูสลิปหลักฐาน
                          </button>
                        ) : (
                          <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>ไม่มีสลิป</span>
                        )
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
                  <td colSpan={7} style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
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

export default memo(OrdersAndSlipsManager);
