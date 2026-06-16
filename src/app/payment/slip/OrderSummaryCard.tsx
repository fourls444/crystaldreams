"use client";

import styles from "./slip.module.css";

interface OrderSummaryCardProps {
  orderId: string | null;
  productName?: string;
  quantity?: number;
  totalAmount?: number;
  items?: Array<{
    product_id: string;
    name: string;
    price: number;
    quantity: number;
    image_url: string | null;
  }> | null;
}

export default function OrderSummaryCard({
  orderId,
  productName,
  quantity,
  totalAmount,
  items,
}: OrderSummaryCardProps) {
  const hasItems = items && Array.isArray(items) && items.length > 0;

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

        {hasItems ? (
          <div className={styles.cartItemsList} style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "0.5rem", borderTop: "1px solid #e2e8f0", paddingTop: "0.5rem" }}>
            <span className={styles.itemLabel} style={{ marginBottom: "0.25rem" }}>สินค้าในคำสั่งซื้อ</span>
            {items.map((item, idx) => (
              <div key={item.product_id || idx} style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                <div style={{ position: "relative", width: "48px", height: "48px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "0.25rem", overflow: "hidden", flexShrink: 0 }}>
                  <img
                    src={item.image_url || "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&q=80&w=800"}
                    alt={item.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
                <div style={{ flexGrow: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#0f172a", whiteSpace: "pre-line" }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.15rem" }}>
                    {item.price.toLocaleString()} ฿ × {item.quantity}
                  </div>
                </div>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0f172a", flexShrink: 0 }}>
                  {(item.price * item.quantity).toLocaleString()} ฿
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div>
            <span className={styles.itemLabel}>สินค้าที่สั่งซื้อ</span>
            <span className={styles.itemValue}>{productName}</span>
          </div>
        )}

        <div className={styles.totalRow}>
          {!hasItems && (
            <div>
              <span className={styles.itemLabel}>จำนวน</span>
              <span className={styles.itemValue}>{quantity} ใบ</span>
            </div>
          )}
          <div style={{ textAlign: "right", marginLeft: "auto" }}>
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
