"use client";

import styles from "./slip.module.css";

interface ShippingFormProps {
  name: string;
  onNameChange: (val: string) => void;
  tel: string;
  onTelChange: (val: string) => void;
  address: string;
  onAddressChange: (val: string) => void;
}

export default function ShippingForm({
  name,
  onNameChange,
  tel,
  onTelChange,
  address,
  onAddressChange,
}: ShippingFormProps) {
  return (
    <>
      {/* 1. ชื่อ + เบอร์โทร */}
      <div className={styles.recipientRow}>
        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>
            ชื่อ-นามสกุล ผู้รับของ <span className={styles.inputLabelSpan}>*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="เช่น สมชาย ใจดี"
            className={styles.inputField}
            required
          />
        </div>
        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>
            เบอร์โทรศัพท์ผู้รับ <span className={styles.inputLabelSpan}>*</span>
          </label>
          <input
            type="tel"
            value={tel}
            onChange={(e) => onTelChange(e.target.value)}
            placeholder="เช่น 0891234567"
            className={styles.inputField}
            required
          />
        </div>
      </div>

      {/* 2. ที่อยู่ */}
      <div className={styles.inputGroup}>
        <label className={styles.inputLabel}>
          ที่อยู่สำหรับการจัดส่งโดยละเอียด <span className={styles.inputLabelSpan}>*</span>
        </label>
        <textarea
          value={address}
          onChange={(e) => onAddressChange(e.target.value)}
          placeholder="บ้านเลขที่, หมู่บ้าน/อาคาร, ถนน, ซอย, ตำบล/แขวง, อำเภอ/เขต, จังหวัด, รหัสไปรษณีย์"
          rows={4}
          className={styles.textareaField}
          required
        />
      </div>
    </>
  );
}
