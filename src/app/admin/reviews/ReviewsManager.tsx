"use client";

import { useState, useMemo, useDeferredValue, useCallback, useRef, useEffect } from "react";
import Image from "next/image";
import Swal from "sweetalert2";
import { Plus, Trash2, Edit2, Search, X, Eye, EyeOff, Upload, ZoomIn } from "lucide-react";
import styles from "./ReviewsManager.module.css";
import type { Review } from "@/types/review";
import RatingStars from "@/components/RatingStars";
import ImageCropperModal from "./ImageCropperModal";

interface Product {
  id: string;
  name: string;
}

interface ReviewsManagerProps {
  initialReviews: Review[];
  products: Product[];
}

// -------------------------------------------------------------
// Primary ReviewsManager Component
// -------------------------------------------------------------
export default function ReviewsManager({ initialReviews, products }: ReviewsManagerProps) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);

  // Form states
  const [customerName, setCustomerName] = useState("");
  const [productId, setProductId] = useState("");
  const [rating, setRating] = useState(5.0);
  const [comment, setComment] = useState("");
  const [isVisible, setIsVisible] = useState(true);
  const [reviewDate, setReviewDate] = useState("");

  // Image upload states
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);

  // Cropper queue states
  const [cropQueue, setCropQueue] = useState<{ src: string; name: string }[]>([]);
  const [currentCropItem, setCurrentCropItem] = useState<{ src: string; name: string } | null>(null);

  // Full Screen Preview (Lightbox) state
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Sync initial reviews on server update
  const [prevInitialReviews, setPrevInitialReviews] = useState<Review[]>(initialReviews);
  if (initialReviews !== prevInitialReviews) {
    setReviews(initialReviews);
    setPrevInitialReviews(initialReviews);
  }

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter & search implementation
  const deferredSearch = useDeferredValue(searchQuery);
  const filteredReviews = useMemo(() => {
    if (!deferredSearch) return reviews;
    const q = deferredSearch.toLowerCase();
    return reviews.filter((r) => {
      const matchCust = r.customer_name.toLowerCase().includes(q);
      const matchComment = r.comment.toLowerCase().includes(q);
      const productName = r.products?.name || "";
      const matchProd = productName.toLowerCase().includes(q);
      return matchCust || matchComment || matchProd;
    });
  }, [reviews, deferredSearch]);

  // Handle Visibility Toggle (Eye icon)
  const handleToggleVisibility = async (id: string, currentVal: boolean) => {
    try {
      const res = await fetch("/api/admin/reviews", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_visible: !currentVal }),
      });

      if (!res.ok) {
        throw new Error("Failed to toggle visibility");
      }

      setReviews((prev) =>
        prev.map((r) => (r.id === id ? { ...r, is_visible: !currentVal } : r))
      );

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: !currentVal ? "เปิดการแสดงผลรีวิวแล้ว" : "ซ่อนการแสดงผลรีวิวแล้ว",
        showConfirmButton: false,
        timer: 1500,
      });
    } catch (err) {
      console.error(err);
      Swal.fire("ผิดพลาด!", "ไม่สามารถเปลี่ยนสถานะการแสดงผลได้", "error");
    }
  };

  // Open Form modal for Add / Edit
  const openFormModal = (review: Review | null = null) => {
    if (review) {
      setEditingReview(review);
      setCustomerName(review.customer_name);
      setProductId(review.product_id);
      setRating(Number(review.rating));
      setComment(review.comment);
      setIsVisible(review.is_visible);
      setReviewDate(review.created_at ? new Date(review.created_at).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]);
      setExistingImages(review.image_urls || []);
      setNewImages([]);
      setNewImagePreviews([]);
    } else {
      setEditingReview(null);
      setCustomerName("");
      setProductId(products[0]?.id || "");
      setRating(5.0);
      setComment("");
      setIsVisible(true);
      setReviewDate(new Date().toISOString().split("T")[0]);
      setExistingImages([]);
      setNewImages([]);
      setNewImagePreviews([]);
    }
    setShowModal(true);
  };

  // Handle files selected via input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Convert selected files to object URLs and push to the crop queue
    const newItems = Array.from(files).map((file) => ({
      src: URL.createObjectURL(file),
      name: file.name,
    }));

    setCropQueue((prev) => [...prev, ...newItems]);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Reset
    }
  };

  // Process crop queue
  useEffect(() => {
    if (cropQueue.length > 0 && !currentCropItem) {
      setCurrentCropItem(cropQueue[0]);
    }
  }, [cropQueue, currentCropItem]);

  const handleImageCropped = (croppedFile: File) => {
    setNewImages((prev) => [...prev, croppedFile]);
    setNewImagePreviews((prev) => [...prev, URL.createObjectURL(croppedFile)]);

    // Clean up used Object URL
    if (currentCropItem) {
      URL.revokeObjectURL(currentCropItem.src);
    }

    // Pop item from queue and clear active
    setCropQueue((prev) => prev.slice(1));
    setCurrentCropItem(null);
  };

  const handleCropCancel = () => {
    if (currentCropItem) {
      URL.revokeObjectURL(currentCropItem.src);
    }
    setCropQueue((prev) => prev.slice(1));
    setCurrentCropItem(null);
  };

  // Remove selected new image from preview
  const handleRemoveNewImage = (index: number) => {
    URL.revokeObjectURL(newImagePreviews[index]);
    setNewImages((prev) => prev.filter((_, i) => i !== index));
    setNewImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Remove existing image from review
  const handleRemoveExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Form Submit (Save Review)
  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName || !productId || !comment) {
      Swal.fire("กรอกข้อมูลไม่ครบ!", "กรุณากรอกชื่อลูกค้า สินค้า และข้อความรีวิว", "warning");
      return;
    }

    Swal.fire({
      title: "กำลังบันทึกข้อมูล...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      let finalImageUrls = [...existingImages];

      // 1. Upload new files if any
      if (newImages.length > 0) {
        const formData = new FormData();
        newImages.forEach((file) => formData.append("images", file));

        const uploadRes = await fetch("/api/admin/reviews/upload", {
          method: "POST",
          body: formData,
        });

        const uploadData = await uploadRes.json();

        if (!uploadRes.ok) {
          throw new Error(uploadData.error || "เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ");
        }

        finalImageUrls = [...finalImageUrls, ...(uploadData.urls || [])];
      }

      // 2. Save/Update Review database record
      const body = {
        id: editingReview?.id,
        product_id: productId,
        customer_name: customerName,
        rating,
        comment,
        is_visible: isVisible,
        image_urls: finalImageUrls,
        created_at: reviewDate,
      };

      const res = await fetch("/api/admin/reviews", {
        method: editingReview ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "ไม่สามารถบันทึกข้อมูลรีวิวได้");
      }

      // Success
      Swal.fire({
        icon: "success",
        title: editingReview ? "แก้ไขรีวิวสำเร็จ!" : "เพิ่มรีวิวสำเร็จ!",
        timer: 1500,
        showConfirmButton: false,
      });

      // Clear preview object URLs
      newImagePreviews.forEach((url) => URL.revokeObjectURL(url));

      setShowModal(false);
      window.location.reload(); // Quick refresh to load updated props server-side
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "เกิดข้อผิดพลาดภายในระบบ";
      Swal.fire("ข้อผิดพลาด", msg, "error");
    }
  };

  // Delete Review
  const handleDeleteReview = async (id: string, name: string) => {
    const confirm = await Swal.fire({
      title: `ลบรีวิวของ "${name}"?`,
      text: "การดำเนินการนี้จะไม่สามารถย้อนกลับได้ และรูปภาพรีวิวจะถูกลบจากฐานข้อมูล",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "ลบข้อมูล",
      cancelButtonText: "ยกเลิก",
    });

    if (!confirm.isConfirmed) return;

    Swal.fire({
      title: "กำลังลบข้อมูล...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const res = await fetch(`/api/admin/reviews?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "เกิดข้อผิดพลาดในการลบรีวิว");
      }

      Swal.fire({
        icon: "success",
        title: "ลบรีวิวเรียบร้อยแล้ว",
        timer: 1500,
        showConfirmButton: false,
      });

      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "ลบรีวิวไม่สำเร็จ";
      Swal.fire("ผิดพลาด", msg, "error");
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.headerRow}>
        <div className={styles.titleGroup}>
          <h2>จัดการรีวิวสินค้า ( {reviews.length} )</h2>
          <p>เพิ่ม แก้ไข ลบ หรือเปิด/ปิดการแสดงผลรีวิวสินค้า เพื่อสร้างความน่าเชื่อถือให้กับร้านค้า</p>
        </div>
        <button className={styles.addBtn} onClick={() => openFormModal(null)}>
          <Plus size={16} />
          <span>เพิ่มรีวิวใหม่</span>
        </button>
      </header>

      {/* Search & Filter Controls */}
      <div className={styles.tableControls}>
        <div className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="ค้นหาชื่อลูกค้า, รายละเอียด หรือชื่อสินค้า..."
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Review List Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: "60px", textAlign: "center" }}>สถานะ</th>
                <th style={{ width: "140px" }}>ชื่อลูกค้า</th>
                <th style={{ width: "140px" }}>วันที่รีวิว</th>
                <th style={{ width: "120px" }}>คะแนนดาว</th>
                <th style={{ width: "180px" }}>สินค้าที่รีวิว</th>
                <th>รายละเอียดรีวิว</th>
                <th style={{ width: "100px", textAlign: "center" }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filteredReviews.map((r) => (
                <tr key={r.id} className={styles.tableRow}>
                  {/* Visibility toggle status */}
                  <td style={{ textAlign: "center" }}>
                    <button
                      onClick={() => handleToggleVisibility(r.id, r.is_visible)}
                      className={`${styles.visibleToggle} ${
                        r.is_visible ? styles.visibleToggleActive : styles.visibleToggleInactive
                      }`}
                      title={r.is_visible ? "คลิกเพื่อซ่อนรีวิวหน้าร้าน" : "คลิกเพื่อแสดงรีวิวหน้าร้าน"}
                    >
                      {r.is_visible ? <Eye size={20} /> : <EyeOff size={20} />}
                    </button>
                  </td>

                  <td>
                    <span className={styles.customerName}>{r.customer_name}</span>
                  </td>

                  <td>
                    <span style={{ fontSize: "0.85rem", color: "#475569", fontWeight: 550, whiteSpace: "nowrap" }}>
                      {new Date(r.created_at).toLocaleDateString("th-TH", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </td>

                  <td>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <RatingStars rating={Number(r.rating)} />
                    </div>
                  </td>

                  <td>
                    <span className={styles.productBadge} title={r.products?.name}>
                      {r.products?.name || "ไม่ระบุสินค้า"}
                    </span>
                  </td>

                  <td>
                    <div className={styles.commentText} title={r.comment}>
                      {r.comment}
                    </div>
                  </td>

                  <td style={{ textAlign: "center" }}>
                    <div className={styles.actionsColumn} style={{ justifyContent: "center" }}>
                      <button
                        className={`${styles.actionBtn} ${styles.editBtn}`}
                        onClick={() => openFormModal(r)}
                        title="แก้ไขรีวิว"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className={`${styles.actionBtn} ${styles.deleteBtn}`}
                        onClick={() => handleDeleteReview(r.id, r.customer_name)}
                        title="ลบรีวิว"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredReviews.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "3rem" }}>
                    <div style={{ color: "#94a3b8", fontSize: "2rem", marginBottom: "0.5rem" }}>💬</div>
                    <div style={{ fontWeight: "bold", color: "#64748b" }}>ไม่พบข้อมูลรีวิวสินค้า</div>
                    <div style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
                      คลิกปุ่ม &quot;เพิ่มรีวิวใหม่&quot; ด้านบนเพื่อลงรีวิวแรกในระบบ
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Form Modal */}
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>{editingReview ? "แก้ไขรีวิวสินค้า" : "เพิ่มรีวิวสินค้าใหม่"}</h3>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)} title="ปิด">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveReview}>
              <div className={styles.modalBody}>
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  
                  {/* Grid row for Customer Name and Review Date */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem" }}>
                    {/* Customer Name */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                      <label style={{ fontSize: "0.875rem", fontWeight: 600, color: "#334155" }}>
                        ชื่อลูกค้า <span style={{ color: "#ef4444" }}>*</span>
                      </label>
                      <input
                        type="text"
                        className={styles.searchInput}
                        style={{ paddingLeft: "1rem" }}
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="ระบุชื่อลูกค้า เช่น คุณวิภาดา, K***, หรือ ลูกค้าสั่งซื้อจริง"
                        required
                      />
                    </div>

                    {/* Review Date */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                      <label style={{ fontSize: "0.875rem", fontWeight: 600, color: "#334155" }}>
                        วันที่รีวิว <span style={{ color: "#ef4444" }}>*</span>
                      </label>
                      <input
                        type="date"
                        className={styles.searchInput}
                        style={{ paddingLeft: "1rem" }}
                        value={reviewDate}
                        onChange={(e) => setReviewDate(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Grid row for Product and Stars */}
                  <div className={styles.modalFormGrid}>
                    {/* Product Selection */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                      <label style={{ fontSize: "0.875rem", fontWeight: 600, color: "#334155" }}>
                        สินค้าที่รีวิว <span style={{ color: "#ef4444" }}>*</span>
                      </label>
                      <select
                        className={styles.searchInput}
                        style={{ paddingLeft: "1rem", appearance: "auto" }}
                        value={productId}
                        onChange={(e) => setProductId(e.target.value)}
                        required
                      >
                        <option value="" disabled>--- เลือกสินค้าที่รีวิว ---</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Rating Stars */}
                    <div className={styles.ratingSelector}>
                      <label style={{ fontSize: "0.875rem", fontWeight: 600, color: "#334155" }}>
                        คะแนนรีวิว <span style={{ color: "#ef4444" }}>*</span>
                      </label>
                      <div style={{ padding: "0.4rem 0" }}>
                        <RatingStars rating={rating} onChange={setRating} editable={true} />
                      </div>
                      <span style={{ fontSize: "0.72rem", color: "#64748b", lineHeight: "1.2" }}>
                        💡 คลิกฝั่งซ้ายเพื่อเลือกครึ่งดาว ฝั่งขวาเพื่อเลือกเต็มดาว
                      </span>
                    </div>
                  </div>

                  {/* Comment Text */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                    <label style={{ fontSize: "0.875rem", fontWeight: 600, color: "#334155" }}>
                      รายละเอียดความคิดเห็นของรีวิว <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <textarea
                      className={styles.searchInput}
                      style={{ paddingLeft: "1rem", height: "100px", resize: "vertical", fontFamily: "inherit" }}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="ระบุข้อความรีวิว เช่น 'หมอนเย็นสบาย นอนหลับลึกตลอดคืน แนะนำร้านนี้เลยค่ะ ส่งไวมากๆ'"
                      required
                    />
                  </div>

                  {/* Image uploads section (Multi-image + Preview) */}
                  <div className={styles.imagesSection}>
                    <label style={{ fontSize: "0.875rem", fontWeight: 600, color: "#334155" }}>
                      รูปภาพรีวิว / ภาพแคปแชต (แนบได้หลายรูป)
                    </label>
                    
                    <div className={styles.imagesScrollRow}>
                      {/* 1. Existing images (from edit mode) */}
                      {existingImages.map((url, idx) => (
                        <div key={`exist-${idx}`} className={styles.imagePreviewCard}>
                          <img src={url} alt="Existing review file" />
                          <button
                            type="button"
                            className={styles.removeImageOverlay}
                            onClick={() => handleRemoveExistingImage(idx)}
                            title="ลบรูปภาพนี้"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}

                      {/* 2. New uploaded images preview */}
                      {newImagePreviews.map((url, idx) => (
                        <div key={`new-${idx}`} className={styles.imagePreviewCard}>
                          <img src={url} alt="New review file" />
                          <button
                            type="button"
                            className={styles.removeImageOverlay}
                            onClick={() => handleRemoveNewImage(idx)}
                            title="ลบรูปภาพนี้"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}

                      {/* 3. Add images dashed button */}
                      <div
                        className={styles.addImagesBtn}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload size={18} />
                        <span>เพิ่มรูปภาพ</span>
                      </div>
                    </div>

                    <input
                      type="file"
                      ref={fileInputRef}
                      style={{ display: "none" }}
                      accept="image/*"
                      multiple
                      onChange={handleFileChange}
                    />
                  </div>

                  {/* Visibility flag toggle */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.25rem 0" }}>
                    <input
                      type="checkbox"
                      id="isVisibleCheckbox"
                      checked={isVisible}
                      onChange={(e) => setIsVisible(e.target.checked)}
                      style={{ width: "16px", height: "16px", cursor: "pointer" }}
                    />
                    <label
                      htmlFor="isVisibleCheckbox"
                      style={{ fontSize: "0.875rem", fontWeight: 600, color: "#334155", cursor: "pointer" }}
                    >
                      เปิดแสดงผลหน้าร้านทันที
                    </label>
                  </div>

                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowModal(false)}>
                  ยกเลิก
                </button>
                <button type="submit" className={styles.addBtn}>
                  {editingReview ? "บันทึกการแก้ไข" : "บันทึกข้อมูล"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Crop Modal Interface (Active when items are in crop queue) */}
      {currentCropItem && (
        <ImageCropperModal
          imageSrc={currentCropItem.src}
          fileName={currentCropItem.name}
          onCrop={handleImageCropped}
          onCancel={handleCropCancel}
        />
      )}

      {/* Image Full Size Lightbox */}
      {lightboxUrl && (
        <div className={styles.lightboxOverlay} onClick={() => setLightboxUrl(null)}>
          <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.lightboxClose} onClick={() => setLightboxUrl(null)}>
              <X size={18} />
              <span>ปิดหน้าต่าง</span>
            </button>
            <img src={lightboxUrl} alt="Review Full size" className={styles.lightboxImage} />
          </div>
        </div>
      )}
    </div>
  );
}
