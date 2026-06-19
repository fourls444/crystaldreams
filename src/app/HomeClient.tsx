"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, X, ZoomIn, ChevronLeft, ChevronRight } from "lucide-react";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import styles from "./HomeClient.module.css";
import type { Review } from "@/types/review";

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
  discount_percent?: number;
}

interface HomeClientProps {
  initialProducts: Product[];
  initialReviews: Review[];
  initialSettings: Record<string, string>;
}

function RatingStars({ rating }: { rating: number }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    const leftVal = i - 0.5;
    const rightVal = i;

    stars.push(
      <div
        key={i}
        style={{
          position: "relative",
          display: "inline-block",
          width: "16px",
          height: "16px",
        }}
      >
        <Star
          size={16}
          color="#cbd5e1"
          fill="#cbd5e1"
          style={{ position: "absolute", top: 0, left: 0 }}
        />
        {rating >= leftVal && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: rating >= rightVal ? "100%" : "50%",
              overflow: "hidden",
            }}
          >
            <Star size={16} color="#fbbf24" fill="#fbbf24" />
          </div>
        )}
      </div>
    );
  }
  return (
    <div style={{ display: "inline-flex", gap: "2px", alignItems: "center" }}>
      {stars}
    </div>
  );
}

function ReviewCard({ review, setLightboxUrl }: { review: Review; setLightboxUrl: (url: string | null) => void }) {
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const images = review.image_urls || [];
  const hasMultipleImages = images.length > 1;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImgIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImgIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className={styles.reviewCard}>
      {/* Review Header with full product name before customer name */}
      <div className={styles.reviewHeader}>
        {review.products?.name && (
          <div className={styles.productNameRow}>
            <span className={styles.reviewLabelSmall}>สินค้าที่รีวิว:</span>
            <span className={styles.productNameFull}>
              {review.products.name}
            </span>
          </div>
        )}
        <div className={styles.customerNameRow}>
          <span className={styles.reviewLabelSmall}>ชื่อลูกค้า:</span>
          <span className={styles.customerName}>
            {review.customer_name}
          </span>
        </div>
      </div>

      {/* Review Screenshot Image */}
      {images.length > 0 && (
        <div
          className={styles.reviewImageWrapper}
          onClick={() => setLightboxUrl(images[activeImgIndex])}
          title="คลิกเพื่อขยายรูปภาพรีวิว"
        >
          <img
            src={images[activeImgIndex]}
            alt={`Review by ${review.customer_name}`}
            className={styles.reviewImage}
            loading="lazy"
          />
          
          {hasMultipleImages && (
            <>
              <button
                type="button"
                onClick={handlePrev}
                className={styles.reviewImageNavBtnLeft}
                aria-label="รูปภาพก่อนหน้า"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className={styles.reviewImageNavBtnRight}
                aria-label="รูปภาพถัดไป"
              >
                <ChevronRight size={16} />
              </button>
              
              <div className={styles.reviewImageIndicators}>
                {images.map((_, idx) => (
                  <span
                    key={idx}
                    className={`${styles.reviewImageDot} ${
                      idx === activeImgIndex ? styles.reviewImageDotActive : ""
                    }`}
                  />
                ))}
              </div>
            </>
          )}

          <div className={styles.reviewImageOverlay}>
            <ZoomIn size={20} />
          </div>
        </div>
      )}

      {/* Star ratings and rating text */}
      <div className={styles.starsRow}>
        <RatingStars rating={Number(review.rating)} />
        <span className={styles.ratingText}>
          ({Number(review.rating).toFixed(1)} / 5.0 คะแนน)
        </span>
      </div>

      {/* Comment section */}
      <div className={styles.commentSection}>
        <span className={styles.reviewLabel}>รายละเอียดการรีวิว:</span>
        <p className={styles.reviewComment} title={review.comment}>
          {review.comment}
        </p>
      </div>
    </div>
  );
}

export default function HomeClient({
  initialProducts,
  initialReviews,
  initialSettings,
}: HomeClientProps) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const productsGridRef = useRef<HTMLDivElement>(null);

  const scrollProducts = (direction: "left" | "right") => {
    if (productsGridRef.current) {
      const scrollAmount = 300;
      productsGridRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // Parse banners dynamically from database settings
  const bannersRaw = initialSettings.homepage_banners;
  let customBanners: string[] = [];
  if (bannersRaw) {
    try {
      customBanners = JSON.parse(bannersRaw);
    } catch (e) {
      console.error("Failed to parse homepage_banners:", e);
    }
  }

  const slides = customBanners.length > 0
    ? customBanners.map((url, idx) => ({ id: idx + 1, url, alt: `Crystal Dreams Banner ${idx + 1}` }))
    : [
        { id: 1, url: "/images/banner.png", alt: "Crystal Dreams Banner 1" },
        { id: 2, url: "/images/banner.png", alt: "Crystal Dreams Banner 2" },
        { id: 3, url: "/images/banner.png", alt: "Crystal Dreams Banner 3" },
        { id: 4, url: "/images/banner.png", alt: "Crystal Dreams Banner 4" },
      ];

  // Carousel auto play
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const handlePrevSlide = () => {
    setActiveSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % slides.length);
  };

  return (
    <div className="min-h-screen bg-white text-slate-800 flex flex-col justify-between font-sans">
      <Header />

      {/* Banner Carousel (Outside of <main> to be full-width) */}
      <div className={styles.carouselWrapper}>
        <div className={styles.carouselContainer}>
          <div
            className={styles.carouselTrack}
            style={{ "--active-index": activeSlide } as React.CSSProperties}
          >
            {slides.map((slide, idx) => (
              <div
                key={slide.id}
                className={`${styles.carouselSlide} ${
                  idx === activeSlide ? styles.carouselSlideActive : ""
                }`}
              >
                <img
                  src={slide.url}
                  alt={slide.alt}
                  className={styles.carouselImage}
                />
              </div>
            ))}
          </div>

          {/* Left Navigation Button */}
          <button
            onClick={handlePrevSlide}
            className={styles.carouselNavBtn}
            style={{ left: "1.25rem" }}
            aria-label="เลื่อนไปภาพก่อนหน้า"
          >
            <ChevronLeft size={24} />
          </button>

          {/* Right Navigation Button */}
          <button
            onClick={handleNextSlide}
            className={styles.carouselNavBtn}
            style={{ right: "1.25rem" }}
            aria-label="เลื่อนไปภาพถัดไป"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        {/* Carousel Indicators dots below the image */}
        <div className={styles.carouselIndicatorsContainer}>
          <div className={styles.carouselIndicators}>
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveSlide(idx)}
                className={`${styles.indicatorDot} ${
                  idx === activeSlide ? styles.indicatorDotActive : ""
                }`}
                aria-label={`ไปที่แบนเนอร์ ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      <main className={styles.main}>

        {/* All Products Grid */}
        <section style={{ marginBottom: "3rem" }}>
          <h2 className={styles.sectionTitle}>สินค้าทั้งหมด</h2>
          <div className={styles.productsGridContainer}>
            <button
              onClick={() => scrollProducts("left")}
              className={`${styles.scrollBtn} ${styles.scrollBtnLeft}`}
              aria-label="เลื่อนซ้าย"
            >
              <ChevronLeft size={20} />
            </button>
            <div ref={productsGridRef} className={styles.productsGrid}>
              {initialProducts.map((product) => {
                const hasDiscount =
                  product.discount_percent !== undefined &&
                  product.discount_percent > 0;
                const originalPrice = Number(product.price);
                const discountedPrice = hasDiscount
                  ? Math.round(originalPrice * (1 - (product.discount_percent || 0) / 100))
                  : originalPrice;

                return (
                  <Link
                    key={product.id}
                    href={`/products/${product.id}`}
                    className={styles.productCard}
                  >
                    <div className={styles.productImageWrapper}>
                      {hasDiscount && (
                        <span className={styles.productDiscountBadge}>
                          ลด {product.discount_percent}%
                        </span>
                      )}
                      <img
                        src={product.image_url || "/images/icon.png"}
                        alt={product.name}
                        className={styles.productImage}
                        loading="lazy"
                      />
                    </div>
                    <div className={styles.productInfo}>
                      <h3 className={styles.productName} title={product.name}>
                        {product.name}
                      </h3>
                      <div className={styles.priceContainer}>
                        {hasDiscount ? (
                          <>
                            <span className={styles.originalPrice}>
                              {originalPrice.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                              })}{" "}
                              THB
                            </span>
                            <span
                              className={`${styles.discountedPrice} ${styles.discountedPriceActive}`}
                            >
                              {discountedPrice.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                              })}{" "}
                              THB
                            </span>
                          </>
                        ) : (
                          <span className={styles.discountedPrice}>
                            {originalPrice.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                            })}{" "}
                            THB
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
            <button
              onClick={() => scrollProducts("right")}
              className={`${styles.scrollBtn} ${styles.scrollBtnRight}`}
              aria-label="เลื่อนขวา"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </section>

        {/* Shop Reviews Section */}
        {initialReviews.length > 0 && (
          <section style={{ marginBottom: "2rem" }}>
            <h2 className={styles.sectionTitle}>รีวิวของทางร้าน</h2>
            <div className={styles.reviewsGrid}>
              {initialReviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  setLightboxUrl={setLightboxUrl}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Full Size Image Lightbox */}
      {lightboxUrl && (
        <div
          className={styles.lightboxOverlay}
          onClick={() => setLightboxUrl(null)}
        >
          <div
            className={styles.lightboxContent}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className={styles.lightboxClose}
              onClick={() => setLightboxUrl(null)}
            >
              <X size={18} />
              <span>ปิดรูปภาพ</span>
            </button>
            <img
              src={lightboxUrl}
              alt="Review Full Size Screenshot"
              className={styles.lightboxImage}
            />
          </div>
        </div>
      )}

      <Footer initialSettings={initialSettings} />
    </div>
  );
}
