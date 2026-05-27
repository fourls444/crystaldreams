"use client";

import Image from "next/image";
import { X, UploadCloud } from "lucide-react";
import styles from "./slip.module.css";

interface SlipUploadZoneProps {
  slipFile: File | null;
  slipPreview: string;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearFile: () => void;
}

export default function SlipUploadZone({
  slipFile,
  slipPreview,
  onFileChange,
  onClearFile,
}: SlipUploadZoneProps) {
  return (
    <div className={styles.inputGroup}>
      <label className={styles.inputLabel}>
        อัปโหลดรูปภาพสลิปโอนเงิน <span className={styles.inputLabelSpan}>*</span>
      </label>
      <div className={styles.uploadWrapper}>
        {slipPreview ? (
          <div className={styles.previewContainer}>
            <Image
              src={slipPreview}
              alt="Receipt Preview"
              width={256}
              height={256}
              unoptimized
              className={styles.previewImage}
            />
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onClearFile();
              }}
              className={styles.removeBtn}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <>
            <div className={styles.uploadIconContainer}>
              <UploadCloud size={32} className={styles.uploadIconSvg} />
            </div>
            <p className={styles.uploadText}>
              คลิกเลือก หรือ ลากรูปภาพสลิปมาวางที่นี่
            </p>
            <p className={styles.uploadSubtext}>
              รองรับเฉพาะไฟล์รูปภาพ JPG, JPEG, PNG
            </p>
          </>
        )}
        <input
          type="file"
          accept="image/*"
          onChange={onFileChange}
          className={styles.fileInput}
          required={!slipFile}
        />
      </div>
    </div>
  );
}
