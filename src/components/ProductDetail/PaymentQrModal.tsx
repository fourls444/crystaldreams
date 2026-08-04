"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Download } from "lucide-react";
import styles from "./ProductDetail.module.css";

interface PaymentQrModalProps {
  showQrModal: boolean;
  loadingQr: boolean;
  qrCodeDataUrl: string;
  totalAmount: number;
  createdOrderId: string;
  onProceed: () => void;
  onCancel: () => void;
}

export default function PaymentQrModal({
  showQrModal,
  loadingQr,
  qrCodeDataUrl,
  totalAmount,
  createdOrderId,
  onProceed,
  onCancel,
}: PaymentQrModalProps) {
  const [paymentMessage, setPaymentMessage] = useState("กำลังรอการชำระเงินจาก Omise...");
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (!showQrModal || loadingQr || !qrCodeDataUrl || !createdOrderId) return;
    redirectedRef.current = false;

    const checkPayment = async () => {
      try {
        const response = await fetch(`/api/orders/${createdOrderId}/payment-status`, {
          cache: "no-store",
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "ตรวจสอบสถานะไม่ได้");

        if (data.paid && !redirectedRef.current) {
          redirectedRef.current = true;
          setPaymentMessage("ชำระเงินสำเร็จ กำลังไปหน้ากรอกข้อมูลจัดส่ง...");
          onProceed();
        } else if (data.paymentStatus === "failed" || data.paymentStatus === "expired") {
          setPaymentMessage("รายการนี้ไม่สำเร็จหรือหมดอายุ กรุณายกเลิกแล้วสร้าง QR ใหม่");
        } else {
          setPaymentMessage("กำลังรอการชำระเงินจาก Omise...");
        }
      } catch {
        setPaymentMessage("กำลังรอการยืนยัน ระบบจะตรวจสอบให้อัตโนมัติอีกครั้ง");
      }
    };

    void checkPayment();
    const timer = window.setInterval(checkPayment, 3000);
    return () => window.clearInterval(timer);
  }, [createdOrderId, loadingQr, onProceed, qrCodeDataUrl, showQrModal]);

  if (!showQrModal) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalCard}>
        {/* QR Code display */}
        <div className={styles.qrWrapper}>
          {loadingQr ? (
            <div className={styles.qrLoading}>
              <div className={styles.qrSpinner}></div>
              <p className={styles.qrLoadingText}>กำลังเจเนอเรต QR Code...</p>
            </div>
          ) : qrCodeDataUrl ? (
            <>
              {/* Thai QR Logo Banner */}
              <div className={styles.qrHeader}>
                <div className={styles.thaiQrText}>
                  <span className={styles.textBlue}>Thai</span>
                  <span className={styles.textAmber}>QR</span>
                  <span className={styles.textDark}>Payment</span>
                </div>
                <span className={styles.promptpayBadge}>PROMPTPAY</span>
              </div>

              {/* Total Amount Box */}
              <div className={styles.modalAmountBox} style={{ marginBottom: "0.75rem" }}>
                <span className={styles.amountLabel}>ยอดชำระเงินรวมทั้งสิ้น</span>
                <span className={styles.amountValue}>
                  {totalAmount.toLocaleString()} บาท
                </span>
              </div>

              <div className={styles.qrImageContainer}>
                <Image
                  src={qrCodeDataUrl}
                  alt="PromptPay QR Code"
                  width={224}
                  height={224}
                  unoptimized
                  className={styles.qrImage}
                />
              </div>

              <p style={{ margin: "0.75rem 0 0", textAlign: "center", color: "#334155", fontSize: "0.9rem", lineHeight: 1.5 }}>
                หลังจากชำระเงินสำเร็จ กรุณากรอกข้อมูลจัดส่งในขั้นตอนถัดไป
              </p>
              <p style={{ margin: "0.35rem 0 0", textAlign: "center", color: "#1e3a8a", fontSize: "0.82rem", fontWeight: 600 }}>
                {paymentMessage}
              </p>

              <a
                href={qrCodeDataUrl}
                download={`crystaldreams-qr-${createdOrderId.slice(0, 8)}.png`}
                className={styles.qrDownloadIconBtn}
                title="ดาวน์โหลด QR Code"
              >
                <Download size={18} />
              </a>
            </>
          ) : (
            <div className={styles.qrError}>
              <p>ไม่สามารถโหลดคิวอาร์โค้ดได้</p>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className={styles.modalActions}>
          <button onClick={onCancel} className={styles.cancelBtn}>
            ยกเลิกชำระเงิน
          </button>
        </div>
      </div>
    </div>
  );
}
