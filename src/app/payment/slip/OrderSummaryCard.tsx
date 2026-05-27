"use client";

import styles from "./slip.module.css";

interface OrderSummaryCardProps {
  orderId: string | null;
  productName?: string;
  quantity?: number;
  totalAmount?: number;
}

export default function OrderSummaryCard({
  orderId,
  productName,
  quantity,
  totalAmount,
}: OrderSummaryCardProps) {
  return (
    <div className={styles.summaryCard}>
      <h2 className={styles.summaryTitle}>สรุปรายการคำสั่งซื้อ</h2>
      <div className={styles.summaryItems}>
        <div>
          <span className={styles.itemLabel}>Order ID</span>
          <span className={styles.itemValue} style={{ fontFamily: "monospace" }}>
            #{orderId}
          </span>
        </div>
        <div>
          <span className={styles.itemLabel}>สินค้าที่สั่งซื้อ</span>
          <span className={styles.itemValue}>{productName}</span>
        </div>
        <div className={styles.totalRow}>
          <div>
            <span className={styles.itemLabel}>จำนวน</span>
            <span className={styles.itemValue}>{quantity} ใบ</span>
          </div>
          <div style={{ textAlign: "right" }}>
            <span className={styles.itemLabel}>ยอดรวมทั้งสิ้น</span>
            <span className={styles.totalValue}>
              {totalAmount?.toLocaleString()} บาท
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
