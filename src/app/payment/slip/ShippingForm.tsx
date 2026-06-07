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
            onChange={(e) => onNameChange(e.target.value.slice(0, 80))}
            placeholder="เช่น สมชาย ใจดี"
            className={styles.inputField}
            maxLength={80}
            required
          />
          <div style={{ textAlign: "right", fontSize: "0.75rem", color: "#64748b", marginTop: "0.25rem" }}>
            {name.length}/80 ตัวอักษร
          </div>
        </div>
        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>
            เบอร์โทรศัพท์ผู้รับ <span className={styles.inputLabelSpan}>*</span>
          </label>
          <input
            type="tel"
            value={tel}
            onChange={(e) => onTelChange(e.target.value.replace(/[^0-9]/g, "").slice(0, 10))}
            placeholder="เช่น 0891234567"
            className={styles.inputField}
            maxLength={10}
            pattern="[0-9]{9,10}"
            title="กรุณากรอกเบอร์โทรศัพท์เป็นตัวเลข 9-10 หลัก"
            required
          />
          <div style={{ textAlign: "right", fontSize: "0.75rem", color: "#64748b", marginTop: "0.25rem" }}>
            {tel.length}/10 ตัวอักษร
          </div>
        </div>
      </div>

      {/* 2. ที่อยู่ */}
      <div className={styles.inputGroup}>
        <label className={styles.inputLabel}>
          ที่อยู่สำหรับการจัดส่งโดยละเอียด <span className={styles.inputLabelSpan}>*</span>
        </label>
        <textarea
          value={address}
          onChange={(e) => onAddressChange(e.target.value.slice(0, 300))}
          placeholder="บ้านเลขที่, หมู่บ้าน/อาคาร, ถนน, ซอย, ตำบล/แขวง, อำเภอ/เขต, จังหวัด, รหัสไปรษณีย์"
          rows={4}
          className={styles.textareaField}
          maxLength={300}
          required
        />
        <div style={{ textAlign: "right", fontSize: "0.75rem", color: "#64748b", marginTop: "0.25rem" }}>
          {address.length}/300 ตัวอักษร
        </div>
      </div>
    </>
  );
}
