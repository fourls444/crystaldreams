"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import styles from "./ProductDetail.module.css";

interface ProductImageGalleryProps {
  images: string[];
  currentImageIndex: number;
  onImageIndexChange: (idx: number) => void;
  onPrevImage: () => void;
  onNextImage: () => void;
  productName: string;
}

export default function ProductImageGallery({
  images,
  currentImageIndex,
  onImageIndexChange,
  onPrevImage,
  onNextImage,
  productName,
}: ProductImageGalleryProps) {
  const currentImage = images[currentImageIndex] || "";
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Disable body scroll when lightbox is open
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

  // Handle Keyboard navigation (Escape to close, Arrows to navigate)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isLightboxOpen) return;

      if (e.key === "Escape") {
        setIsLightboxOpen(false);
      } else if (e.key === "ArrowLeft") {
        onPrevImage();
      } else if (e.key === "ArrowRight") {
        onNextImage();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isLightboxOpen, onPrevImage, onNextImage]);

  return (
    <div className={styles.imageColumn}>
      <div className={styles.imageCard}>
        <div 
          className={styles.imageWrapper}
          onClick={() => setIsLightboxOpen(true)}
          title="คลิกเพื่อดูรูปภาพขนาดเต็ม"
        >
          <Image
            src={currentImage}
            alt={productName}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className={styles.productImage}
            priority
          />

          {/* Left and Right navigation arrows */}
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent opening lightbox
                  onPrevImage();
                }}
                className={styles.prevBtn}
                aria-label="รูปภาพก่อนหน้า"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent opening lightbox
                  onNextImage();
                }}
                className={styles.nextBtn}
                aria-label="รูปภาพถัดไป"
              >
                ›
              </button>
            </>
          )}
        </div>

        {/* Thumbnails below the main image */}
        {images.length > 1 && (
          <div className={styles.thumbnailList}>
            {images.map((imgUrl, idx) => (
              <button
                key={idx}
                type="button"
                className={`${styles.thumbnailBtn} ${
                  idx === currentImageIndex ? styles.thumbnailBtnActive : ""
                }`}
                onClick={() => onImageIndexChange(idx)}
              >
                <div className={styles.thumbnailWrapperMini}>
                  <Image
                    src={imgUrl}
                    alt={`Product thumbnail mini ${idx + 1}`}
                    fill
                    sizes="60px"
                    className={styles.thumbnailImgMini}
                  />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal for Full Image View */}
      {isLightboxOpen && currentImage && (
        <div 
          className={styles.lightboxOverlay}
          onClick={() => setIsLightboxOpen(false)}
        >
          <div 
            className={styles.lightboxContent}
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside content
          >
            <button 
              type="button" 
              className={styles.lightboxCloseBtn}
              onClick={() => setIsLightboxOpen(false)}
              aria-label="ปิดรูปภาพเต็ม"
            >
              ✕
            </button>

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={onPrevImage}
                  className={styles.lightboxPrevBtn}
                  aria-label="รูปภาพก่อนหน้า"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={onNextImage}
                  className={styles.lightboxNextBtn}
                  aria-label="รูปภาพถัดไป"
                >
                  ›
                </button>
              </>
            )}

            <div className={styles.lightboxImageWrapper}>
              <img
                src={currentImage}
                alt={`${productName} view`}
                className={styles.lightboxImage}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
