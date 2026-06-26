"use client";

import { memo } from "react";
import { DollarSign, CheckCircle2, FileText } from "lucide-react";
import styles from "../admin.module.css";
import type { Order } from "@/types/order";

interface DashboardOverviewProps {
  totalSales: number;
  verifiedOrdersCount: number;
  pendingSlipsCount: number;
  initialOrders: Order[];
  formatThaiDate: (dateStr: string) => string;
  getStatusText: (status: string) => string;
  getStatusBadgeClass: (status: string) => string;
  getShippingStatusText: (shippingStatus: string) => string;
  getShippingStatusBadgeClass: (shippingStatus: string) => string;
  onViewAllOrders: () => void;
  onSelectAddressOrder: (order: Order) => void;
}

function DashboardOverview({
  totalSales,
  verifiedOrdersCount,
  pendingSlipsCount,
  initialOrders,
  formatThaiDate,
  getStatusText,
  getStatusBadgeClass,
  getShippingStatusText,
  getShippingStatusBadgeClass,
  onViewAllOrders,
  onSelectAddressOrder,
}: DashboardOverviewProps) {
  return (
    <div>
      <header className={styles.panelHeader}>
        <div>
          <h2 className={styles.panelTitle}>หน้าแรก ( Dashboard )</h2>
          <p className={styles.panelSubtitle}>ภาพรวมของยอดขาย ออเดอร์ล่าสุด และสถานะคลังสินค้า</p>
        </div>
      </header>

      {/* Statistics Row */}
      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.statCardBlue}`}>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>ยอดขายรวมสำเร็จ</span>
            <span className={styles.statValue}>{totalSales.toLocaleString()} ฿</span>
          </div>
          <div className={styles.statIcon}>
            <DollarSign size={24} />
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.statCardGreen}`}>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>ออเดอร์สำเร็จ (ใบ)</span>
            <span className={styles.statValue}>{verifiedOrdersCount}</span>
          </div>
          <div className={styles.statIcon}>
            <CheckCircle2 size={24} />
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.statCardAmber}`}>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>สลิปที่รอตรวจ</span>
            <span className={styles.statValue}>{pendingSlipsCount}</span>
          </div>
          <div className={styles.statIcon}>
            <FileText size={24} />
          </div>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className={styles.tableCard}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>รายการคำสั่งซื้อล่าสุด ( Recent Orders )</h3>
          <button onClick={onViewAllOrders} className={styles.viewSlipBtn}>
            ดูออเดอร์ทั้งหมด →
          </button>
        </div>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>ชื่อผู้รับ</th>
                <th style={{ textAlign: "center" }}>ยอดชำระ</th>
                <th style={{ textAlign: "center" }}>สถานะการชำระเงิน</th>
                <th style={{ textAlign: "center" }}>สถานะการจัดส่ง</th>
                <th style={{ textAlign: "center" }}>รายละเอียด</th>
              </tr>
            </thead>
            <tbody>
              {initialOrders.slice(0, 5).map((order) => (
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
                  <td style={{ textAlign: "center" }}>
                    <button
                      onClick={() => onSelectAddressOrder(order)}
                      className={styles.viewSlipBtn}
                    >
                      ดูรายละเอียด
                    </button>
                  </td>
                </tr>
              ))}
              {initialOrders.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", color: "#64748b" }}>
                    ไม่มีออเดอร์อยู่ในระบบ
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

export default memo(DashboardOverview);
