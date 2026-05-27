"use client";

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

  return (
    <div className={styles.imageColumn}>
      <div className={styles.imageCard}>
        <div className={styles.imageWrapper}>
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
                onClick={onPrevImage}
                className={styles.prevBtn}
                aria-label="รูปภาพก่อนหน้า"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={onNextImage}
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
    </div>
  );
}
