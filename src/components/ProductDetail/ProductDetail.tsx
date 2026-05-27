"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/utils/supabase";
import Swal from "sweetalert2";
import styles from "./ProductDetail.module.css";

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

export default function ProductDetail() {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Modal States for QR Code
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const [createdOrderId, setCreatedOrderId] = useState("");
  const [totalAmount, setTotalAmount] = useState(0);
  const [loadingQr, setLoadingQr] = useState(false);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .limit(1)
          .single();

        if (error) {
          console.error("Error fetching product:", error);
          setError("ไม่สามารถดึงข้อมูลสินค้าได้ กรุณาลองใหม่อีกครั้ง");
        } else if (data) {
          setProduct(data);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        setError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, []);

  const handleQuantityChange = (val: number) => {
    if (!product) return;
    const newQty = quantity + val;
    if (newQty >= 1 && newQty <= product.stock) {
      setQuantity(newQty);
    }
  };

  const handlePayment = async () => {
    if (!product) return;
    setError("");
    setSubmitting(true);
    setLoadingQr(true);

    try {
      // 1. Create order in background
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product_id: product.id,
          quantity,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ");
      }

      setCreatedOrderId(data.orderId);
      setTotalAmount(data.totalAmount);
      setShowQrModal(true);

      // 2. Fetch PromptPay QR Code base64 data
      const qrRes = await fetch("/api/payment/qr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: data.totalAmount,
        }),
      });

      const qrData = await qrRes.json();

      if (!qrRes.ok) {
        throw new Error(qrData.error || "ไม่สามารถสร้างคิวอาร์โค้ดชำระเงินได้");
      }

      setQrCodeDataUrl(qrData.qrDataUrl);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการดำเนินงาน";
      setError(errMsg);
      setShowQrModal(false);
    } finally {
      setSubmitting(false);
      setLoadingQr(false);
    }
  };

  const proceedToUploadSlip = () => {
    setShowQrModal(false);
    if (createdOrderId) {
      router.push(`/payment/slip?orderId=${createdOrderId}`);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: product?.name || "หมอนสุขภาพ Crystal Dreams",
      text: "สัมผัสประสบการณ์การนอนที่ดีที่สุดด้วยหมอนสุขภาพ Crystal Dreams",
      url: window.location.href,
    };

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log("Error sharing:", err);
      }
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(window.location.href);
        Swal.fire({
          icon: "success",
          title: "คัดลอกลิงก์สำเร็จ!",
          text: "คัดลอกลิงก์สินค้าลงในคลิปบอร์ดแล้ว คุณสามารถนำไปแชร์ต่อได้ทันที",
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
          toast: true,
          position: "top-end",
        });
      } catch (err) {
        console.error("Clipboard copy failed:", err);
        Swal.fire({
          icon: "info",
          title: "แชร์ลิงก์สินค้า",
          text: `คัดลอกลิงก์นี้เพื่อแชร์: ${window.location.href}`,
          confirmButtonText: "ตกลง",
          confirmButtonColor: "#1e3a8a",
        });
      }
    } else {
      Swal.fire({
        icon: "info",
        title: "แชร์ลิงก์สินค้า",
        text: `คัดลอกลิงก์นี้เพื่อแชร์: ${window.location.href}`,
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#1e3a8a",
      });
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinnerWrapper}>
          <div className={styles.spinner}></div>
          <p className={styles.loadingText}>กำลังโหลดข้อมูลร้านค้า...</p>
        </div>
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorCard}>
          <div className={styles.errorIcon}>⚠️</div>
          <h2 className={styles.errorTitle}>เกิดข้อผิดพลาดในการโหลดระบบ</h2>
          <p className={styles.errorSub}>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className={styles.retryButton}
          >
            ลองใหม่อีกครั้ง
          </button>
        </div>
      </div>
    );
  }

  const defaultImage = "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&q=80&w=800";
  const isSoldOut = !product || product.stock <= 0;

  // Extract all available images
  const images = product?.image_urls && product.image_urls.length > 0
    ? product.image_urls
    : [product?.image_url || defaultImage];

  const currentImage = images[currentImageIndex] || defaultImage;

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <main className={styles.main}>
      <div className={styles.grid}>
        
        {/* Product Image Section */}
        <div className={styles.imageColumn}>
          <div className={styles.imageCard}>
            <div className={styles.imageWrapper}>
              <Image
                src={currentImage}
                alt={product?.name || "หมอนสุขภาพ Crystal Dreams"}
                fill
                sizes="(max-w-768px) 100vw, 50vw"
                className={styles.productImage}
                priority
              />
              
              {/* Left and Right navigation arrows */}
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrevImage}
                    className={styles.prevBtn}
                    aria-label="รูปภาพก่อนหน้า"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={handleNextImage}
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
                    className={`${styles.thumbnailBtn} ${idx === currentImageIndex ? styles.thumbnailBtnActive : ""}`}
                    onClick={() => setCurrentImageIndex(idx)}
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

        {/* Detail Section */}
        <div className={styles.detailColumn}>
          <div>
            <h1 className={styles.productName}>
              {product?.name || "หมอนยางพารา + วัสดุ TPE"}
            </h1>
            <div className={styles.priceContainer}>
              <span className={styles.priceText}>
                {product?.price ? product.price.toLocaleString("en-US", { minimumFractionDigits: 2 }) : "1,890.00"} THB
              </span>
              
              {/* Stock Badge next to the price */}
              <span className={`${styles.stockBadge} ${isSoldOut ? styles.stockSoldOut : styles.stockInStock}`}>
                {isSoldOut ? "สินค้าหมด" : `${product?.stock} ชิ้น`}
              </span>
            </div>
            <p className={styles.taxesIncluded}>Taxes included.</p>
          </div>

          {/* คุณสมบัติ */}
          <div className={styles.descriptionSection}>
            <p className={styles.descriptionBullets}>
              {product?.description || "📐 ขนาด: 60*40*10 cm\n(🔥 ส่งฟรี!) 📦 สินค้าพรีออเดอร์: รอของ 14-20 วัน"}
            </p>
          </div>

          {error && (
            <div className={styles.errorAlert}>
              {error}
            </div>
          )}

          <div className={styles.actionContainer}>
            {/* Quantity Selector: Display only if NOT sold out */}
            {!isSoldOut && (
              <div className={styles.quantitySection}>
                <span className={styles.quantityLabel}>จำนวน</span>
                <div className={styles.quantitySelector}>
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1 || submitting}
                    className={styles.qtyBtn}
                  >
                    －
                  </button>
                  <span className={styles.qtyVal}>
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(1)}
                    disabled={!product || quantity >= product.stock || submitting}
                    className={styles.qtyBtn}
                  >
                    ＋
                  </button>
                </div>
              </div>
            )}

            {/* Buttons Area */}
            <div className={styles.buttonGroup}>
              {/* Action button */}
              <button
                type="button"
                onClick={handlePayment}
                disabled={isSoldOut || submitting}
                className={`${styles.btn} ${isSoldOut ? styles.btnBuyNowDisabled : styles.btnBuyNow}`}
              >
                {submitting ? (
                  <div className={styles.btnSpinnerWrapper}>
                    <div className={styles.btnSpinner}></div>
                    <span>กำลังสร้างรายการคำสั่งซื้อ...</span>
                  </div>
                ) : isSoldOut ? (
                  "Sold out"
                ) : (
                  "Buy it now"
                )}
              </button>
            </div>

            {/* Share and Details links */}
            <div className={styles.linkGroup}>
              <button type="button" className={styles.shareLink} onClick={handleShare}>
                <svg className={styles.linkIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" />
                </svg>
                <span>Share</span>
              </button>
              
              <button type="button" className={styles.detailsLink}>
                <span>View full details</span>
                <span className={styles.arrowIcon}>➔</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Modal (Popup) */}
      {showQrModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            
            {/* Header / Brand */}
            <div className={styles.modalHeader}>
              <div className={styles.modalBrand}>
                CRYSTAL DREAMS
              </div>
              <p className={styles.modalSub}>กรุณาสแกนคิวอาร์โค้ดเพื่อชำระเงิน</p>
            </div>

            {/* Total Amount Box */}
            <div className={styles.modalAmountBox}>
              <span className={styles.amountLabel}>ยอดชำระเงินรวมทั้งสิ้น</span>
              <span className={styles.amountValue}>
                {totalAmount.toLocaleString()} บาท
              </span>
              <span className={styles.amountQty}>
                จำนวน {quantity} ชิ้น
              </span>
            </div>

            {/* QR Code display */}
            <div className={styles.qrWrapper}>
              {loadingQr ? (
                <div className={styles.qrLoading}>
                  <div className={styles.qrSpinner}></div>
                  <p className={styles.qrLoadingText}>กำลังเจเนอเรต QR Code...</p>
                </div>
              ) : qrCodeDataUrl ? (
                <>
                  {/* Thai QR Logo Banner */}
                  <div className={styles.qrHeader}>
                    <div className={styles.thaiQrText}>
                      <span className={styles.textBlue}>Thai</span>
                      <span className={styles.textAmber}>QR</span>
                      <span className={styles.textDark}>Payment</span>
                    </div>
                    <span className={styles.promptpayBadge}>
                      PROMPTPAY
                    </span>
                  </div>

                  <div className={styles.qrImageContainer}>
                    <Image
                      src={qrCodeDataUrl}
                      alt="PromptPay QR Code"
                      width={224}
                      height={224}
                      unoptimized
                      className={styles.qrImage}
                    />
                  </div>

                  <p className={styles.qrInstruction}>
                    สแกน QR เพื่อโอนเงินเข้าพร้อมเพย์ของร้านค้า
                  </p>
                </>
              ) : (
                <div className={styles.qrError}>
                  <p>ไม่สามารถโหลดคิวอาร์โค้ดได้</p>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className={styles.modalActions}>
              {qrCodeDataUrl && (
                <a
                  href={qrCodeDataUrl}
                  download={`crystaldreams-qr-${createdOrderId.slice(0, 8)}.png`}
                  className={styles.downloadBtn}
                >
                  📥 ดาวน์โหลดรูปภาพ QR Code
                </a>
              )}

              <button
                onClick={proceedToUploadSlip}
                className={styles.payBtn}
              >
                <span>ฉันโอนเงินเรียบร้อยแล้ว ไปแนบสลิป</span>
                <span>➔</span>
              </button>

              <button
                onClick={() => setShowQrModal(false)}
                className={styles.cancelBtn}
              >
                ยกเลิกชำระเงิน
              </button>
            </div>

          </div>
        </div>
      )}
    </main>
  );
}
