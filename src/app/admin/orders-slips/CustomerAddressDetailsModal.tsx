"use client";

import { X } from "lucide-react";
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
}

interface CustomerAddressDetailsModalProps {
  showAddressModal: boolean;
  onSetShowAddressModal: (show: boolean) => void;
  selectedAddressOrder: Order | null;
}

export default function CustomerAddressDetailsModal({
  showAddressModal,
  onSetShowAddressModal,
  selectedAddressOrder,
}: CustomerAddressDetailsModalProps) {
  if (!showAddressModal || !selectedAddressOrder) return null;

  return (
    <div className={styles.modalOverlay} onClick={() => onSetShowAddressModal(false)}>
      <div className={styles.modalCard} style={{ maxWidth: "500px" }} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>รายละเอียดออเดอร์</h3>
          <button onClick={() => onSetShowAddressModal(false)} className={styles.modalClose} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            <X size={18} />
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.slipInfoList} style={{ width: "100%" }}>
            <div className={styles.slipInfoBlock}>
              <h5 className={styles.slipInfoTitle}>ข้อมูลผู้รับของ</h5>
              <div className={styles.slipInfoRow}>
                <label>ชื่อ-นามสกุล:</label>
                <span>{selectedAddressOrder.customer_name || "ยังไม่ได้กรอกข้อมูล"}</span>
              </div>
              <div className={styles.slipInfoRow}>
                <label>เบอร์โทรศัพท์:</label>
                <span>{selectedAddressOrder.customer_tel || "ยังไม่ได้กรอกข้อมูล"}</span>
              </div>
              <div style={{ fontSize: "0.85rem", display: "flex", flexDirection: "column", gap: "0.25rem", borderTop: "1px solid #e2e8f0", paddingTop: "0.5rem", marginTop: "0.5rem" }}>
                <label style={{ color: "#64748b" }}>ที่อยู่จัดส่ง:</label>
                <span style={{ color: "#0f172a", fontWeight: 500, lineHeight: 1.4, whiteSpace: "pre-wrap" }}>
                  {selectedAddressOrder.customer_address || "ยังไม่ได้กรอกที่อยู่"}
                </span>
              </div>
            </div>

            <div className={styles.slipInfoBlock}>
              <h5 className={styles.slipInfoTitle}>รายละเอียดสินค้าที่ต้องแพ็ค</h5>
              <div className={styles.slipInfoRow}>
                <label>สินค้า:</label>
                <span style={{ fontWeight: 600 }}>{selectedAddressOrder.products?.name || "ไม่พบข้อมูลสินค้า"}</span>
              </div>
              <div className={styles.slipInfoRow}>
                <label>จำนวน:</label>
                <span style={{ fontWeight: 600 }}>{selectedAddressOrder.quantity} ใบ</span>
              </div>
              <div className={styles.slipInfoRow} style={{ borderTop: "1px solid #e2e8f0", paddingTop: "0.5rem", marginTop: "0.5rem" }}>
                <label>ยอดรวมชำระเงิน:</label>
                <span className={styles.slipInfoRowValueBold}>{selectedAddressOrder.total_amount.toLocaleString()} ฿</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button
            type="button"
            onClick={() => onSetShowAddressModal(false)}
            className={styles.cancelFormBtn}
            style={{ marginTop: 0, width: "100%" }}
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}
