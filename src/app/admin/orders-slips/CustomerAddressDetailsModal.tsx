"use client";

import { memo } from "react";
import { X, Check } from "lucide-react";
import styles from "../admin.module.css";
import type { Order } from "@/types/order";

interface CustomerAddressDetailsModalProps {
  showAddressModal: boolean;
  onSetShowAddressModal: (show: boolean) => void;
  selectedAddressOrder: Order | null;
  actionLoading?: string | null;
  onManualApprove?: (orderId: string) => void;
  onRejectOrder?: (orderId: string) => void;
}

function CustomerAddressDetailsModal({
  showAddressModal,
  onSetShowAddressModal,
  selectedAddressOrder,
  actionLoading,
  onManualApprove,
  onRejectOrder,
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
              <div className={styles.slipInfoRow}>
                <label>Line ID:</label>
                <span>{selectedAddressOrder.customer_line || "ไม่ได้ระบุ"}</span>
              </div>
              <div className={styles.slipInfoRow}>
                <label>วิธีการชำระเงิน:</label>
                <span style={{ color: selectedAddressOrder.payment_method === "cod" ? "#ea580c" : "#1e3a8a", fontWeight: "bold" }}>
                  {selectedAddressOrder.payment_method === "cod" ? "เก็บเงินปลายทาง (COD)" : "พร้อมเพย์ (PromptPay)"}
                </span>
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
              {selectedAddressOrder.items && Array.isArray(selectedAddressOrder.items) && selectedAddressOrder.items.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "0.75rem" }}>
                  {(selectedAddressOrder.items as Array<{ product_id: string; name: string; price: number; quantity: number }>)
                    .map((item, idx) => (
                      <div key={item.product_id || idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: "0.85rem", borderBottom: "1px dashed #f1f5f9", paddingBottom: "0.35rem" }}>
                        <div style={{ maxWidth: "70%", fontWeight: 550, color: "#0f172a", whiteSpace: "pre-line" }}>
                          {item.name}
                        </div>
                        <div style={{ color: "#475569", fontWeight: 600 }}>
                          {item.quantity} ชิ้น × {item.price.toLocaleString()} ฿
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <>
                  <div className={styles.slipInfoRow}>
                    <label>สินค้า:</label>
                    <span style={{ fontWeight: 600, whiteSpace: "pre-line" }}>{selectedAddressOrder.products?.name || "ไม่พบข้อมูลสินค้า"}</span>
                  </div>
                  <div className={styles.slipInfoRow}>
                    <label>จำนวน:</label>
                    <span style={{ fontWeight: 600 }}>{selectedAddressOrder.quantity} ใบ</span>
                  </div>
                </>
              )}
              <div className={styles.slipInfoRow} style={{ borderTop: "1px solid #e2e8f0", paddingTop: "0.5rem", marginTop: "0.5rem" }}>
                <label>ยอดรวมชำระเงิน:</label>
                <span className={styles.slipInfoRowValueBold}>{selectedAddressOrder.total_amount.toLocaleString()} ฿</span>
              </div>
            </div>
          </div>
        </div>

        {(selectedAddressOrder.status === "cod_pending" || selectedAddressOrder.status === "pending") && (
          <div className={styles.modalFooter} style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", flexWrap: "wrap" }}>
            {selectedAddressOrder.status === "cod_pending" && onManualApprove && onRejectOrder && (
              <div className={styles.modalActionGroup} style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => {
                    onManualApprove(selectedAddressOrder.id);
                    onSetShowAddressModal(false);
                  }}
                  disabled={actionLoading !== null}
                  className={styles.verifyActionBtn}
                  style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", marginTop: 0 }}
                >
                  <Check size={14} />
                  <span>ยืนยันว่าได้รับเงิน</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onRejectOrder(selectedAddressOrder.id);
                    onSetShowAddressModal(false);
                  }}
                  disabled={actionLoading !== null}
                  className={styles.rejectActionBtn}
                  style={{ border: "none", marginTop: 0, display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
                >
                  <X size={14} />
                  <span>ยกเลิกคำสั่งซื้อ</span>
                </button>
              </div>
            )}

            {selectedAddressOrder.status === "pending" && onManualApprove && onRejectOrder && (
              <div className={styles.modalActionGroup} style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => {
                    onManualApprove(selectedAddressOrder.id);
                    onSetShowAddressModal(false);
                  }}
                  disabled={actionLoading !== null}
                  className={styles.verifyActionBtn}
                  style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", marginTop: 0 }}
                >
                  <Check size={14} />
                  <span>อนุมัติการชำระเงินแมนนวล</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onRejectOrder(selectedAddressOrder.id);
                    onSetShowAddressModal(false);
                  }}
                  disabled={actionLoading !== null}
                  className={styles.rejectActionBtn}
                  style={{ border: "none", marginTop: 0, display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
                >
                  <X size={14} />
                  <span>ยกเลิกคำสั่งซื้อ</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(CustomerAddressDetailsModal);
