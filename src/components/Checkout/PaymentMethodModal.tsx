"use client";

import React from "react";
import { X, CreditCard, Truck, Ban } from "lucide-react";
import styles from "./PaymentMethodModal.module.css";

interface PaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (method: "promptpay" | "cod") => void;
  totalAmount: number;
  codEnabled: boolean;
}

export default function PaymentMethodModal({
  isOpen,
  onClose,
  onSelect,
  totalAmount,
  codEnabled,
}: PaymentMethodModalProps) {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>เลือกช่องทางการชำระเงิน</h3>
          <button onClick={onClose} className={styles.closeBtn} title="ปิด">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className={styles.modalBody}>
          <p className={styles.modalSubtitle}>
            กรุณาเลือกช่องทางการชำระเงินที่คุณสะดวกที่สุดสำหรับคำสั่งซื้อนี้
          </p>

          {/* Amount Box */}
          <div className={styles.amountBox}>
            <span className={styles.amountLabel}>ยอดชำระเงินรวม</span>
            <span className={styles.amountValue}>
              {totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })} THB
            </span>
          </div>

          {/* Options Grid */}
          <div className={styles.optionsGrid}>
            {/* PromptPay Option */}
            <button
              onClick={() => onSelect("promptpay")}
              className={`${styles.optionCard} ${styles.promptpayCard}`}
            >
              <div className={styles.iconWrapper}>
                <CreditCard size={28} className={styles.promptpayIcon} />
              </div>
              <div className={styles.optionContent}>
                <h4 className={styles.optionTitle}>โอนผ่านพร้อมเพย์ (PromptPay)</h4>
                <p className={styles.optionDesc}>
                  สแกนคิวอาร์โค้ดชำระเงินด้วยแอปธนาคาร และอัปโหลดสลิป
                </p>
              </div>
            </button>

            {/* COD Option */}
            <button
              onClick={() => codEnabled && onSelect("cod")}
              disabled={!codEnabled}
              className={`${styles.optionCard} ${styles.codCard}`}
              style={
                !codEnabled
                  ? {
                      opacity: 0.5,
                      cursor: "not-allowed",
                      filter: "grayscale(0.6)",
                      position: "relative",
                    }
                  : undefined
              }
            >
              <div className={styles.iconWrapper}>
                {codEnabled ? (
                  <Truck size={28} className={styles.codIcon} />
                ) : (
                  <Ban size={28} style={{ color: "#94a3b8" }} />
                )}
              </div>
              <div className={styles.optionContent}>
                <h4 className={styles.optionTitle}>เก็บเงินปลายทาง (COD)</h4>
                <p className={styles.optionDesc}>
                  {codEnabled
                    ? "ชำระเงินสดหรือแสกนจ่ายกับเจ้าหน้าที่ขนส่งเมื่อได้รับสินค้า"
                    : "ขณะนี้ไม่รับบริการเก็บเงินปลายทาง"}
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <button onClick={onClose} className={styles.cancelBtn}>
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
}
