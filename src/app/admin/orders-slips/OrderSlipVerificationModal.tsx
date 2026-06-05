"use client";

import Image from "next/image";
import { X, Search, Check } from "lucide-react";
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

interface OrderSlipVerificationModalProps {
  showSlipModal: boolean;
  onSetShowSlipModal: (show: boolean) => void;
  selectedOrder: Order | null;
  actionLoading: string | null;
  getStatusText: (status: string) => string;
  getStatusBadgeClass: (status: string) => string;
  onAutoVerify: (orderId: string) => void;
  onManualApprove: (orderId: string) => void;
  onRejectOrder: (orderId: string) => void;
}

export default function OrderSlipVerificationModal({
  showSlipModal,
  onSetShowSlipModal,
  selectedOrder,
  actionLoading,
  getStatusText,
  getStatusBadgeClass,
  onAutoVerify,
  onManualApprove,
  onRejectOrder,
}: OrderSlipVerificationModalProps) {
  if (!showSlipModal || !selectedOrder) return null;

  return (
    <div className={styles.modalOverlay} onClick={() => onSetShowSlipModal(false)}>
      <div className={styles.modalCard} style={{ maxWidth: "700px" }} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>รายละเอียดคำสั่งซื้อ & สลิปโอนเงิน</h3>
          <button onClick={() => onSetShowSlipModal(false)} className={styles.modalClose} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            <X size={18} />
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.slipDetailsGrid}>
            {/* Left Side: Slip image */}
            <div>
              <h4 className={styles.slipInfoTitle}>หลักฐานการโอนเงิน (Slip)</h4>
              <div className={styles.slipImagePreviewWrapper}>
                <Image
                  src={selectedOrder.slip_url || "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&q=80&w=800"}
                  alt="Payment slip uploaded by customer"
                  fill
                  unoptimized
                  className={styles.slipImagePreview}
                />
              </div>
            </div>

            {/* Right Side: Order Info */}
            <div className={styles.slipInfoList}>
              <div className={styles.slipInfoBlock}>
                <h5 className={styles.slipInfoTitle}>ข้อมูลการจัดส่ง</h5>
                <div className={styles.slipInfoRow}>
                  <label>ชื่อผู้รับ:</label>
                  <span>{selectedOrder.customer_name || "ไม่ระบุ"}</span>
                </div>
                <div className={styles.slipInfoRow}>
                  <label>เบอร์โทรศัพท์:</label>
                  <span>{selectedOrder.customer_tel || "ไม่ระบุ"}</span>
                </div>
                <div style={{ fontSize: "0.85rem", display: "flex", flexDirection: "column", gap: "0.25rem", borderTop: "1px solid #e2e8f0", paddingTop: "0.5rem", marginTop: "0.5rem" }}>
                  <label style={{ color: "#64748b" }}>ที่อยู่จัดส่ง:</label>
                  <span style={{ color: "#0f172a", fontWeight: 500, lineHeight: 1.4 }}>
                    {selectedOrder.customer_address || "ไม่ระบุที่อยู่จัดส่ง"}
                  </span>
                </div>
              </div>

              <div className={styles.slipInfoBlock}>
                <h5 className={styles.slipInfoTitle}>ข้อมูลยอดชำระเงิน</h5>
                <div className={styles.slipInfoRow}>
                  <label>สินค้าที่สั่งซื้อ:</label>
                  <span>{selectedOrder.products?.name || "ไม่พบสินค้า"}</span>
                </div>
                <div className={styles.slipInfoRow}>
                  <label>จำนวนยอดซื้อ:</label>
                  <span>{selectedOrder.quantity} ใบ</span>
                </div>
                <div className={styles.slipInfoRow} style={{ borderTop: "1px solid #e2e8f0", paddingTop: "0.5rem", marginTop: "0.5rem" }}>
                  <label>ยอดรวมที่ต้องโอน:</label>
                  <span className={styles.slipInfoRowValueBold}>{selectedOrder.total_amount.toLocaleString()} ฿</span>
                </div>
                <div className={styles.slipInfoRow}>
                  <label>สถานะคำสั่งซื้อ:</label>
                  <span className={`${styles.statusBadge} ${getStatusBadgeClass(selectedOrder.status)}`}>
                    {getStatusText(selectedOrder.status)}
                  </span>
                </div>
              </div>

              {selectedOrder.status === "verified" && (
                <div className={styles.slipInfoBlock} style={{ backgroundColor: "#ecfdf5", borderColor: "#a7f3d0" }}>
                  <h5 className={styles.slipInfoTitle} style={{ color: "#047857" }}>บันทึกการตรวจสอบ</h5>
                  <div className={styles.slipInfoRow}>
                    <label>ผลลัพธ์:</label>
                    <span style={{ color: "#047857" }}>ตรวจสอบสลิปผ่านแล้ว</span>
                  </div>
                  <div className={styles.slipInfoRow}>
                    <label>ช่องทางตรวจ:</label>
                    <span style={{ color: "#047857" }}>
                      {selectedOrder.verified_by?.startsWith("auto")
                        ? "EasySlip API (อัตโนมัติ)"
                        : "แอดมินอนุมัติแมนนวล"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button
            type="button"
            onClick={() => onSetShowSlipModal(false)}
            className={styles.cancelFormBtn}
            style={{ marginTop: 0 }}
          >
            ปิดหน้าต่าง
          </button>

          {selectedOrder.status === "slip_uploaded" && (
            <div className={styles.modalActionGroup}>
              <button
                type="button"
                onClick={() => onAutoVerify(selectedOrder.id)}
                disabled={actionLoading !== null}
                className={styles.verifyActionBtn}
                style={{ backgroundColor: "#2563eb", display: "inline-flex", alignItems: "center", gap: "0.35rem", marginTop: 0 }}
              >
                <Search size={14} />
                <span>ตรวจออโต้ (EasySlip)</span>
              </button>

              <button
                type="button"
                onClick={() => onManualApprove(selectedOrder.id)}
                disabled={actionLoading !== null}
                className={styles.verifyActionBtn}
                style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", marginTop: 0 }}
              >
                <Check size={14} />
                <span>อนุมัติสลิปแมนนวล</span>
              </button>

              <button
                type="button"
                onClick={() => onRejectOrder(selectedOrder.id)}
                disabled={actionLoading !== null}
                className={styles.rejectActionBtn}
                style={{ border: "none", marginTop: 0, display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
              >
                <X size={14} />
                <span>ปฏิเสธสลิปนี้</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
