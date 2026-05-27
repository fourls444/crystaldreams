"use client";

import Image from "next/image";
import { Download, ArrowRight } from "lucide-react";
import styles from "./ProductDetail.module.css";

interface PaymentQrModalProps {
  showQrModal: boolean;
  loadingQr: boolean;
  qrCodeDataUrl: string;
  totalAmount: number;
  quantity: number;
  createdOrderId: string;
  onProceed: () => void;
  onCancel: () => void;
}

export default function PaymentQrModal({
  showQrModal,
  loadingQr,
  qrCodeDataUrl,
  totalAmount,
  quantity,
  createdOrderId,
  onProceed,
  onCancel,
}: PaymentQrModalProps) {
  if (!showQrModal) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalCard}>
        {/* Header / Brand */}
        <div className={styles.modalHeader}>
          <div className={styles.modalBrand}>CRYSTAL DREAMS</div>
          <p className={styles.modalSub}>กรุณาสแกนคิวอาร์โค้ดเพื่อชำระเงิน</p>
        </div>

        {/* Total Amount Box */}
        <div className={styles.modalAmountBox}>
          <span className={styles.amountLabel}>ยอดชำระเงินรวมทั้งสิ้น</span>
          <span className={styles.amountValue}>
            {totalAmount.toLocaleString()} บาท
          </span>
          <span className={styles.amountQty}>จำนวน {quantity} ชิ้น</span>
        </div>

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

              <p className={styles.qrInstruction}>
                สแกน QR เพื่อโอนเงินเข้าพร้อมเพย์ของร้านค้า
              </p>
            </>
          ) : (
            <div className={styles.qrError}>
              <p>ไม่สามารถโหลดคิวอาร์โค้ดได้</p>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className={styles.modalActions}>
          {qrCodeDataUrl && (
            <a
              href={qrCodeDataUrl}
              download={`crystaldreams-qr-${createdOrderId.slice(0, 8)}.png`}
              className={styles.downloadBtn}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.35rem",
              }}
            >
              <Download size={16} />
              <span>ดาวน์โหลดรูปภาพ QR Code</span>
            </a>
          )}

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
            <span>ฉันโอนเงินเรียบร้อยแล้ว ไปแนบสลิป</span>
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
