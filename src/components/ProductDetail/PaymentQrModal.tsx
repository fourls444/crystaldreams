"use client";

import Image from "next/image";
import { Download, ArrowRight } from "lucide-react";
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
          <button
            onClick={onProceed}
            className={styles.payBtn}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.35rem",
            }}
          >
            <span>ไปกรอกข้อมูลและแนบสลิป</span>
            <ArrowRight size={16} />
          </button>

          <button onClick={onCancel} className={styles.cancelBtn}>
            ยกเลิกชำระเงิน
          </button>
        </div>
      </div>
    </div>
  );
}
