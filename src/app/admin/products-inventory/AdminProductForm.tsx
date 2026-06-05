"use client";

import { useState, useEffect } from "react";
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
  is_visible?: boolean;
}

interface Props {
  initialProduct?: Product | null;
  onSaveSuccess?: () => void;
  onCancel?: () => void;
}

export default function AdminProductForm({ initialProduct, onSaveSuccess, onCancel }: Props) {
  const [name, setName] = useState(initialProduct?.name || "");
  const [price, setPrice] = useState<number | "">(initialProduct?.price !== undefined ? initialProduct.price : "");
  const [stock, setStock] = useState<number | "">(initialProduct?.stock !== undefined ? initialProduct.stock : "");
  const [description, setDescription] = useState(initialProduct?.description || "");
  const [detail, setDetail] = useState(initialProduct?.detail || "");
  const [imageUrls, setImageUrls] = useState<string[]>(initialProduct?.image_urls || []);
  const [deletedImageUrls, setDeletedImageUrls] = useState<string[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(initialProduct ? (initialProduct.is_visible !== false) : true);

  // Lightbox for reviewing uploaded images in form
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxImageIndex, setLightboxImageIndex] = useState(0);

  // Disable scroll when lightbox is active
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

  // Handle keyboard arrow events and Escape keys in Form Lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isLightboxOpen) return;

      if (e.key === "Escape") {
        setIsLightboxOpen(false);
      } else if (e.key === "ArrowLeft") {
        setLightboxImageIndex((prev) => (prev > 0 ? prev - 1 : imageUrls.length - 1));
      } else if (e.key === "ArrowRight") {
        setLightboxImageIndex((prev) => (prev < imageUrls.length - 1 ? prev + 1 : 0));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isLightboxOpen, imageUrls]);

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

    const uploadedUrls: string[] = [];
    const filesArray = Array.from(files);

    try {
      // อัปโหลดทีละไฟล์แบบ Sequential เพื่อป้องกันปัญหา Browser Connection Limit และ Database/Rate Limit จากการยิงขนานพร้อมกัน
      for (let i = 0; i < filesArray.length; i++) {
        const file = filesArray[i];
        
        // อัปเดตสถานะในกล่องข้อความเพื่อแจ้งเตือนแอดมินระหว่างการทำงาน
        setMessage({
          text: `กำลังอัปโหลดรูปที่ ${i + 1} จากทั้งหมด ${filesArray.length} รูป (${file.name})...`,
          type: "success"
        });

        const formData = new FormData();
        formData.append("images", file);

        const res = await fetch("/api/admin/upload-images", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || `ไม่สามารถอัปโหลดไฟล์ ${file.name} ได้`);
        }

        if (data.urls && data.urls.length > 0) {
          uploadedUrls.push(data.urls[0]);
        } else {
          throw new Error(`ไม่พบลิงก์ผลลัพธ์ของไฟล์ ${file.name}`);
        }
      }

      setImageUrls((prev) => [...prev, ...uploadedUrls]);
      setMessage({ text: `อัปโหลดรูปภาพสำเร็จทั้งหมด ${uploadedUrls.length} รูป`, type: "success" });
    } catch (err: unknown) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ";
      
      // อัปโหลดไฟล์ส่วนที่สำเร็จเข้าไปก่อนเพื่อให้ข้อมูลไม่หายทั้งหมด
      if (uploadedUrls.length > 0) {
        setImageUrls((prev) => [...prev, ...uploadedUrls]);
        setMessage({
          text: `อัปโหลดสำเร็จบางส่วน ${uploadedUrls.length} รูป แต่เกิดข้อผิดพลาด: ${errMsg}`,
          type: "error"
        });
      } else {
        setMessage({ text: errMsg, type: "error" });
      }
    } finally {
      setUploading(false);
      // รีเซ็ตค่า input เพื่อให้สามารถเลือกไฟล์เดิมซ้ำได้หลังจากลบออก
      e.target.value = "";
    }
  };

  const removeImage = (indexToRemove: number) => {
    const urlToRemove = imageUrls[indexToRemove];
    setImageUrls((prev) => prev.filter((_, index) => index !== indexToRemove));
    setDeletedImageUrls((prev) => [...prev, urlToRemove]);
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
          is_visible: isVisible,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        // Clean up removed images from Supabase Storage
        if (deletedImageUrls.length > 0) {
          fetch("/api/admin/delete-images", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ urls: deletedImageUrls }),
          }).catch((err) => console.error("Failed to clean up storage images:", err));
        }

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
    <>
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
            onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))}
            className={styles.input}
            placeholder="ใส่ราคาขาย เช่น 100"
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
            onChange={(e) => setStock(e.target.value === "" ? "" : Number(e.target.value))}
            className={styles.input}
            placeholder="ใส่จำนวนสินค้าคงเหลือในสต็อก เช่น 10"
          />
        </div>
      </div>

      <div className={styles.inputGroup}>
        <label>การแสดงผลบนหน้าร้าน</label>
        <div className={styles.toggleContainer}>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={isVisible}
              onChange={(e) => setIsVisible(e.target.checked)}
            />
            <span className={styles.slider}></span>
          </label>
          <span className={styles.toggleLabel} onClick={() => setIsVisible(!isVisible)}>
            {isVisible ? "แสดงสินค้าบนเว็บไซต์ (Visible)" : "ซ่อนสินค้าจากหน้าเว็บ (Hidden)"}
          </span>
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
                  style={{ cursor: "zoom-in" }}
                  onClick={() => {
                    setLightboxImageIndex(index);
                    setIsLightboxOpen(true);
                  }}
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
          
          <label
            htmlFor="image-upload"
            className={`${styles.imageAddButton} ${uploading ? styles.disabled : ""}`}
            onClick={(e) => {
              if (uploading) {
                e.preventDefault();
              }
            }}
          >
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

    {/* Lightbox Modal for Product Images in Backoffice Form */}
    {isLightboxOpen && imageUrls.length > 0 && (
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

          {imageUrls.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => setLightboxImageIndex((prev) => (prev > 0 ? prev - 1 : imageUrls.length - 1))}
                className={styles.lightboxPrevBtn}
                aria-label="รูปก่อนหน้า"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => setLightboxImageIndex((prev) => (prev < imageUrls.length - 1 ? prev + 1 : 0))}
                className={styles.lightboxNextBtn}
                aria-label="รูปถัดไป"
              >
                ›
              </button>
            </>
          )}

          <div className={styles.lightboxImageWrapper}>
            <img
              src={imageUrls[lightboxImageIndex]}
              alt={`Product image view ${lightboxImageIndex + 1}`}
              className={styles.lightboxImage}
            />
          </div>
        </div>
      </div>
    )}
    </>
  );
}
