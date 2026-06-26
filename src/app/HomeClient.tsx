"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, ZoomIn, ChevronLeft, ChevronRight } from "lucide-react";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import RatingStars from "@/components/RatingStars";
import CartDrawer from "@/components/Cart/CartDrawer";
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

  const customerInitial = review.customer_name ? review.customer_name.trim().charAt(0).toUpperCase() : "U";

  return (
    <div className={styles.reviewCard}>
      {/* Testimonial Header: Avatar, Name, Stars */}
      <div style={{ display: "flex", gap: "0.85rem", alignItems: "center" }}>
        <div style={{
          width: "42px",
          height: "42px",
          borderRadius: "50%",
          background: "#0037ad",
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          fontSize: "1.1rem",
          flexShrink: 0,
          boxShadow: "0 2px 8px rgba(30, 58, 138, 0.15)",
        }}>
          {customerInitial}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem", flexGrow: 1, minWidth: 0 }}>
          <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {review.customer_name}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <RatingStars rating={Number(review.rating)} />
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#f59e0b" }}>
              {Number(review.rating).toFixed(1)}
            </span>
          </div>
        </div>
      </div>

      {/* Review Screenshot Image with Background Blur Fill */}
      {images.length > 0 && (
        <div
          className={styles.reviewImageWrapper}
          onClick={() => setLightboxUrl(images[activeImgIndex])}
          title="คลิกเพื่อขยายรูปภาพรีวิว"
        >
          {/* Blur background fill */}
          <img
            src={images[activeImgIndex]}
            alt="Blur background fill"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "blur(14px) opacity(0.2)",
              pointerEvents: "none",
              zIndex: 1,
            }}
          />
          
          <img
            src={images[activeImgIndex]}
            alt={`Review by ${review.customer_name}`}
            className={styles.reviewImage}
            style={{ zIndex: 2 }}
            loading="lazy"
          />
          
          {hasMultipleImages && (
            <>
              <button
                type="button"
                onClick={handlePrev}
                className={styles.reviewImageNavBtnLeft}
                style={{ zIndex: 10 }}
                aria-label="รูปภาพก่อนหน้า"
              >
                <ChevronLeft size={10} />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className={styles.reviewImageNavBtnRight}
                style={{ zIndex: 10 }}
                aria-label="รูปภาพถัดไป"
              >
                <ChevronRight size={10} />
              </button>
              
              <div className={styles.reviewImageIndicators} style={{ zIndex: 10 }}>
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

          <div className={styles.reviewImageOverlay} style={{ zIndex: 5 }}>
            <ZoomIn size={16} />
          </div>
        </div>
      )}

      {/* Product Tag Text (Moved under the image, no emoji, no border badge) */}
      {review.products?.name && (
        <div style={{
          fontSize: "0.75rem",
          color: "#475569",
          fontWeight: 600,
          marginTop: "0.25rem",
          width: "100%",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap"
        }} title={review.products.name}>
          สินค้าที่รีวิว: <span style={{ fontWeight: 700, color: "#0037ad" }}>{review.products.name}</span>
        </div>
      )}

      {/* Review Comment Quote Block */}
      <div style={{ position: "relative", marginTop: "0.35rem" }}>
        <p style={{
          fontSize: "0.875rem",
          color: "#475569",
          lineHeight: "1.6",
          margin: 0,
          fontStyle: "italic",
          whiteSpace: "pre-line",
          paddingLeft: "0.75rem",
          borderLeft: "3px solid #0037ad",
        }} title={review.comment}>
          "{review.comment}"
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
  const [currentIndex, setCurrentIndex] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const productsGridRef = useRef<HTMLDivElement>(null);
  const reviewsGridRef = useRef<HTMLDivElement>(null);

  const scrollProducts = (direction: "left" | "right") => {
    if (productsGridRef.current) {
      const scrollAmount = 300;
      productsGridRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const scrollReviews = (direction: "left" | "right") => {
    if (reviewsGridRef.current) {
      const scrollAmount = 350;
      reviewsGridRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // Parse banners dynamically from database settings
  const bannersRaw = initialSettings.homepage_banners;
  let parsedBanners: { url: string; name: string; visible: boolean }[] = [];
  if (bannersRaw) {
    try {
      const parsed = JSON.parse(bannersRaw);
      if (Array.isArray(parsed)) {
        parsedBanners = parsed.map((item, idx) => {
          if (typeof item === "string") {
            return { url: item, name: `Crystal Dreams Banner ${idx + 1}`, visible: true };
          }
          return {
            url: item.url || "",
            name: item.name || `Crystal Dreams Banner ${idx + 1}`,
            visible: item.visible !== false,
          };
        });
      }
    } catch (e) {
      console.error("Failed to parse homepage_banners:", e);
    }
  }

  // Filter only visible banners for display
  const visibleBanners = parsedBanners.filter((b) => b.visible);

  const slides = visibleBanners.length > 0
    ? visibleBanners.map((banner, idx) => ({ id: idx + 1, url: banner.url, alt: banner.name }))
    : [
        { id: 1, url: "/images/banner.png", alt: "Crystal Dreams Banner 1" },
        { id: 2, url: "/images/banner.png", alt: "Crystal Dreams Banner 2" },
        { id: 3, url: "/images/banner.png", alt: "Crystal Dreams Banner 3" },
        { id: 4, url: "/images/banner.png", alt: "Crystal Dreams Banner 4" },
      ];

  const isSingle = slides.length <= 1;
  const extendedSlides = isSingle
    ? slides
    : [slides[slides.length - 1], ...slides, slides[0]];

  const handleTransitionEnd = () => {
    if (isSingle) return;
    if (currentIndex === 0) {
      setIsTransitioning(false);
      setCurrentIndex(slides.length);
    } else if (currentIndex === slides.length + 1) {
      setIsTransitioning(false);
      setCurrentIndex(1);
    }
  };

  // Re-enable transition after warping
  useEffect(() => {
    if (!isTransitioning) {
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsTransitioning(true);
        });
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [isTransitioning]);

  // Carousel auto play
  useEffect(() => {
    if (isSingle) return;
    const timer = setInterval(() => {
      handleNextSlide();
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length, currentIndex]);

  const handlePrevSlide = () => {
    if (isSingle) return;
    if (currentIndex <= 0) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev - 1);
  };

  const handleNextSlide = () => {
    if (isSingle) return;
    if (currentIndex >= slides.length + 1) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev + 1);
  };

  const activeDotIndex = isSingle
    ? 0
    : (currentIndex - 1 + slides.length) % slides.length;

  const handleDotClick = (idx: number) => {
    setIsTransitioning(true);
    setCurrentIndex(idx + 1);
  };

  const displayIndex = isSingle ? 0 : currentIndex;

  return (
    <div className="min-h-screen bg-white text-slate-800 flex flex-col justify-between font-sans">
      <Header />

      {/* Banner Carousel (Outside of <main> to be full-width) */}
      <div className={styles.carouselWrapper}>
        <div className={styles.carouselContainer}>
          <div
            className={styles.carouselTrack}
            style={{
              transform: `translateX(calc((100% - var(--slide-width)) / 2 - (var(--slide-width) + var(--slide-gap)) * ${displayIndex}))`,
              transition: !isSingle && isTransitioning ? "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)" : "none",
            }}
            onTransitionEnd={handleTransitionEnd}
          >
            {extendedSlides.map((slide, idx) => {
              const isSlideActive = isSingle
                ? true
                : (idx === currentIndex) ||
                  (currentIndex === 0 && idx === slides.length) ||
                  (currentIndex === slides.length + 1 && idx === 1);

              return (
                <div
                  key={`${slide.id}-${idx}`}
                  className={`${styles.carouselSlide} ${
                    isSlideActive ? styles.carouselSlideActive : ""
                  }`}
                >
                  <img
                    src={slide.url}
                    alt={slide.alt}
                    className={styles.carouselImage}
                  />
                </div>
              );
            })}
          </div>

          {!isSingle && (
            <>
              {/* Left Navigation Button */}
              <button
                onClick={handlePrevSlide}
                className={`${styles.carouselNavBtn} ${styles.carouselNavBtnLeft}`}
                aria-label="เลื่อนไปภาพก่อนหน้า"
              >
                <ChevronLeft size={24} />
              </button>

              {/* Right Navigation Button */}
              <button
                onClick={handleNextSlide}
                className={`${styles.carouselNavBtn} ${styles.carouselNavBtnRight}`}
                aria-label="เลื่อนไปภาพถัดไป"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}
        </div>

        {/* Carousel Indicators dots below the image */}
        {!isSingle && (
          <div className={styles.carouselIndicatorsContainer}>
            <div className={styles.carouselIndicators}>
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => handleDotClick(idx)}
                  className={`${styles.indicatorDot} ${
                    idx === activeDotIndex ? styles.indicatorDotActive : ""
                  }`}
                  aria-label={`ไปที่แบนเนอร์ ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <main className={styles.main}>

        {/* All Products Grid */}
        <section style={{ marginBottom: "3rem" }}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>สินค้าทั้งหมด</h2>
            <div className={styles.scrollControls}>
              <button
                onClick={() => scrollProducts("left")}
                className={styles.scrollBtn}
                aria-label="เลื่อนซ้าย"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => scrollProducts("right")}
                className={styles.scrollBtn}
                aria-label="เลื่อนขวา"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
          <div className={styles.productsGridContainer}>
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
          </div>
        </section>

        {/* Shop Reviews Section */}
        {initialReviews.length > 0 && (
          <section style={{ marginBottom: "2rem" }}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>รีวิวของทางร้าน</h2>
              <div className={styles.scrollControls}>
                <button
                  onClick={() => scrollReviews("left")}
                  className={styles.scrollBtn}
                  aria-label="เลื่อนซ้าย"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => scrollReviews("right")}
                  className={styles.scrollBtn}
                  aria-label="เลื่อนขวา"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
            <div className={styles.productsGridContainer}>
              <div ref={reviewsGridRef} className={styles.reviewsGrid}>
                {initialReviews.map((review) => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    setLightboxUrl={setLightboxUrl}
                  />
                ))}
              </div>
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
      <CartDrawer />
    </div>
  );
}
