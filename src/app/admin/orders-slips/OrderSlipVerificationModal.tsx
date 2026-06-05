"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { X, Search, Check, ChevronLeft, ChevronRight } from "lucide-react";
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
  ordersList?: Order[];
  onSelectOrder?: (order: Order) => void;
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
  ordersList = [],
  onSelectOrder,
}: OrderSlipVerificationModalProps) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Disable body scroll when lightbox is open
  useEffect(() => {
    if (isLightboxOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isLightboxOpen]);

  const handlePrevOrder = () => {
    if (ordersList.length <= 1 || !onSelectOrder || !selectedOrder) return;
    const currentIndex = ordersList.findIndex((o) => o.id === selectedOrder.id);
    if (currentIndex > 0) {
      onSelectOrder(ordersList[currentIndex - 1]);
    } else {
      onSelectOrder(ordersList[ordersList.length - 1]);
    }
  };

  const handleNextOrder = () => {
    if (ordersList.length <= 1 || !onSelectOrder || !selectedOrder) return;
    const currentIndex = ordersList.findIndex((o) => o.id === selectedOrder.id);
    if (currentIndex < ordersList.length - 1) {
      onSelectOrder(ordersList[currentIndex + 1]);
    } else {
      onSelectOrder(ordersList[0]);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showSlipModal) return;

      if (e.key === "Escape") {
        if (isLightboxOpen) {
          setIsLightboxOpen(false);
        } else {
          onSetShowSlipModal(false);
        }
      } else if (e.key === "ArrowLeft") {
        handlePrevOrder();
      } else if (e.key === "ArrowRight") {
        handleNextOrder();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showSlipModal, isLightboxOpen, selectedOrder, ordersList]);

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
              <div 
                className={styles.slipImagePreviewWrapper}
                onClick={() => setIsLightboxOpen(true)}
                style={{ cursor: "zoom-in", position: "relative" }}
                title="คลิกเพื่อดูรูปภาพขนาดเต็ม"
              >
                <Image
                  src={selectedOrder.slip_url || "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&q=80&w=800"}
                  alt="Payment slip uploaded by customer"
                  fill
                  unoptimized
                  className={styles.slipImagePreview}
                />
                
                {/* Visual navigation arrows on preview */}
                {ordersList.length > 1 && (
                  <div style={{ position: "absolute", bottom: "12px", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "0.5rem", zIndex: 5 }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation(); // stop opening lightbox
                        handlePrevOrder();
                      }}
                      style={{ border: "none", backgroundColor: "rgba(15, 23, 42, 0.75)", color: "#ffffff", borderRadius: "50%", width: "2.25rem", height: "2.25rem", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s ease" }}
                      title="สลิปก่อนหน้า (ลูกศรซ้าย)"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation(); // stop opening lightbox
                        handleNextOrder();
                      }}
                      style={{ border: "none", backgroundColor: "rgba(15, 23, 42, 0.75)", color: "#ffffff", borderRadius: "50%", width: "2.25rem", height: "2.25rem", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s ease" }}
                      title="สลิปถัดไป (ลูกศรขวา)"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
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

      {/* Lightbox Modal for Full Slip View */}
      {isLightboxOpen && selectedOrder.slip_url && (
        <div 
          className={styles.lightboxOverlay}
          onClick={() => setIsLightboxOpen(false)}
        >
          <div 
            className={styles.lightboxContent}
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              type="button" 
              className={styles.lightboxCloseBtn}
              onClick={() => setIsLightboxOpen(false)}
              aria-label="ปิดรูปภาพเต็ม"
            >
              ✕
            </button>

            {ordersList.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevOrder}
                  className={styles.lightboxPrevBtn}
                  aria-label="สลิปก่อนหน้า"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={handleNextOrder}
                  className={styles.lightboxNextBtn}
                  aria-label="สลิปถัดไป"
                >
                  ›
                </button>
              </>
            )}

            <div className={styles.lightboxImageWrapper}>
              <img
                src={selectedOrder.slip_url}
                alt={`Slip view`}
                className={styles.lightboxImage}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
