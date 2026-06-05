"use client";

import { useState } from "react";
import Image from "next/image";
import Swal from "sweetalert2";
import styles from "../admin.module.css";

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  image_url: string | null;
  description?: string | null;
  detail?: string | null;
  image_urls?: string[] | null;
}

interface Props {
  initialProduct?: Product | null;
  onSaveSuccess?: () => void;
  onCancel?: () => void;
}

export default function AdminProductForm({ initialProduct, onSaveSuccess, onCancel }: Props) {
  const [name, setName] = useState(initialProduct?.name || "");
  const [price, setPrice] = useState(initialProduct?.price || 0);
  const [stock, setStock] = useState(initialProduct?.stock || 0);
  const [description, setDescription] = useState(initialProduct?.description || "");
  const [detail, setDetail] = useState(initialProduct?.detail || "");
  const [imageUrls, setImageUrls] = useState<string[]>(initialProduct?.image_urls || []);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (index: number) => {
    if (draggedIndex === null || draggedIndex === index) return;

    const newImageUrls = [...imageUrls];
    const [draggedItem] = newImageUrls.splice(draggedIndex, 1);
    newImageUrls.splice(index, 0, draggedItem);

    setImageUrls(newImageUrls);
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };
  
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setMessage(null);

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("images", files[i]);
    }

    try {
      const res = await fetch("/api/admin/upload-images", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.urls) {
        setImageUrls((prev) => [...prev, ...data.urls]);
        setMessage({ text: `อัปโหลดรูปภาพสำเร็จ ${data.urls.length} รูป`, type: "success" });
      } else {
        setMessage({ text: data.error || "เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ", type: "error" });
      }
    } catch (err) {
      console.error(err);
      setMessage({ text: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ในการอัปโหลดได้", type: "error" });
    } finally {
      setUploading(false);
      // Reset input value so same files can be re-uploaded if deleted
      e.target.value = "";
    }
  };

  const removeImage = (indexToRemove: number) => {
    setImageUrls((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    // First image in the array becomes the main image_url
    const mainImageUrl = imageUrls.length > 0 ? imageUrls[0] : null;

    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: initialProduct?.id || null,
          name,
          price: Number(price),
          stock: Number(stock),
          image_url: mainImageUrl,
          description,
          detail,
          image_urls: imageUrls,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        Swal.fire({
          icon: "success",
          title: "บันทึกสำเร็จ!",
          text: "บันทึกข้อมูลสินค้าเรียบร้อยแล้ว",
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
        });
        if (onSaveSuccess) onSaveSuccess();
      } else {
        Swal.fire({
          icon: "error",
          title: "เกิดข้อผิดพลาด!",
          text: data.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูล",
          confirmButtonText: "ตกลง",
          confirmButtonColor: "#1e3a8a",
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด!",
        text: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#1e3a8a",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {message && (
        <div className={message.type === "success" ? styles.successAlert : styles.errorAlert}>
          {message.text}
        </div>
      )}

      <div className={styles.inputGroup}>
        <label htmlFor="name">ชื่อสินค้า</label>
        <input
          id="name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={styles.input}
          placeholder="ใส่ชื่อสินค้า (เช่น หมอนเพื่อสุขภาพ)"
        />
      </div>

      <div className={styles.inputRow}>
        <div className={styles.inputGroup}>
          <label htmlFor="price">ราคาขาย (บาท)</label>
          <input
            id="price"
            type="number"
            required
            min="0"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className={styles.input}
          />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="stock">จำนวนสินค้าคงเหลือในสต็อก (ชิ้น)</label>
          <input
            id="stock"
            type="number"
            required
            min="0"
            value={stock}
            onChange={(e) => setStock(Number(e.target.value))}
            className={styles.input}
          />
        </div>
      </div>

      <div className={styles.inputGroup}>
        <label htmlFor="description">คุณสมบัติ</label>
        <textarea
          id="description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={styles.textarea}
          placeholder={"ใส่คุณสมบัติหรือข้อมูลหลักของสินค้าแบบสั้น (เช่น ขนาด, สี, ข้อมูลการจัดส่ง)"}
        />
      </div>

      <div className={styles.inputGroup}>
        <label htmlFor="detail">รายละเอียด</label>
        <textarea
          id="detail"
          rows={6}
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          className={styles.textarea}
          placeholder={"ใส่รายละเอียดสินค้าเพิ่มเติมเชิงลึก (เช่น จุดเด่น, เทคโนโลยี, สรรพคุณประโยชน์ต่อสุขภาพ)"}
        />
      </div>

      {/* Multiple Image Upload Section */}
      <div className={styles.inputGroup}>
        <label>รูปภาพสินค้า</label>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleImageUpload}
          disabled={uploading}
          id="image-upload"
          className={styles.fileInput}
        />
        <div className={styles.horizontalScrollWrapper}>
          {imageUrls.map((url, index) => (
            <div
              key={index}
              className={`${styles.imageThumbnailWrapper} ${draggedIndex === index ? styles.dragged : ""}`}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(index)}
              onDragEnd={handleDragEnd}
              title="ลากเพื่อจัดเรียงลำดับรูปภาพ"
            >
              <div className={styles.thumbnailContainer}>
                <Image
                  src={url}
                  alt={`Product thumbnail ${index + 1}`}
                  fill
                  sizes="100px"
                  className={styles.thumbnailImage}
                />
                {index === 0 && (
                  <span className={styles.mainBadge}>รูปหลัก</span>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className={styles.thumbnailRemoveBtn}
                  title="ลบรูปภาพนี้"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
          
          <label htmlFor="image-upload" className={`${styles.imageAddButton} ${uploading ? styles.disabled : ""}`}>
            {uploading ? (
              <span className={styles.uploadSpinner}></span>
            ) : (
              <span className={styles.plusSign}>+</span>
            )}
          </label>
        </div>
      </div>

      <div className={styles.formActions}>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className={styles.cancelFormBtn}
            style={{ marginTop: 0 }}
          >
            ยกเลิก
          </button>
        )}
        <button type="submit" disabled={submitting || uploading} className={styles.saveBtn} style={{ marginTop: 0 }}>
          {submitting ? "กำลังบันทึก..." : "บันทึกรายละเอียดสินค้า"}
        </button>
      </div>
    </form>
  );
}
