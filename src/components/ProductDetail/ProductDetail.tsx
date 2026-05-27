"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/utils/supabase";
import Swal from "sweetalert2";
import styles from "./ProductDetail.module.css";
import { AlertTriangle, Share2 } from "lucide-react";
import ProductImageGallery from "./ProductImageGallery";
import ProductFeatures from "./ProductFeatures";
import PaymentQrModal from "./PaymentQrModal";

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
  const searchParams = useSearchParams();
  const orderIdParam = searchParams.get("orderId");
  const showQrParam = searchParams.get("showQr");

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

  // Restore QR modal state from URL parameters
  useEffect(() => {
    if (showQrParam === "true" && orderIdParam) {
      setCreatedOrderId(orderIdParam);
      setShowQrModal(true);
      setLoadingQr(true);

      const fetchOrderDetails = async () => {
        try {
          const { data: orderData, error: fetchErr } = await supabase
            .from("orders")
            .select("quantity, total_amount")
            .eq("id", orderIdParam)
            .single();

          if (fetchErr || !orderData) {
            console.error("Error fetching order for QR restoration:", fetchErr);
            setShowQrModal(false);
            window.history.pushState(null, "", "/");
            return;
          }

          setTotalAmount(orderData.total_amount);
          setQuantity(orderData.quantity);

          // Fetch QR code
          const qrRes = await fetch("/api/payment/qr", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              amount: orderData.total_amount,
            }),
          });

          const qrData = await qrRes.json();
          if (qrRes.ok) {
            setQrCodeDataUrl(qrData.qrDataUrl);
          } else {
            console.error("Error generating QR:", qrData.error);
          }
        } catch (err) {
          console.error("Error loading QR from URL param:", err);
        } finally {
          setLoadingQr(false);
        }
      };

      fetchOrderDetails();
    }
  }, [orderIdParam, showQrParam]);

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
      window.history.pushState(null, "", `/?orderId=${data.orderId}&showQr=true`);

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

  const handleCancelOrder = async () => {
    if (!createdOrderId) return;
    try {
      await fetch(`/api/orders?id=${createdOrderId}`, { method: "DELETE" });
    } catch (err) {
      console.error("Failed to cancel order:", err);
    }
    setShowQrModal(false);
    setCreatedOrderId("");
    setQrCodeDataUrl("");
    window.history.pushState(null, "", "/");
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
    return <ProductDetailSkeleton />;
  }

  if (error && !product) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorCard}>
          <div className={styles.errorIcon}>
            <AlertTriangle size={28} />
          </div>
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

  const images = product?.image_urls && product.image_urls.length > 0
    ? product.image_urls
    : [product?.image_url || defaultImage];

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
        <ProductImageGallery
          images={images}
          currentImageIndex={currentImageIndex}
          onImageIndexChange={setCurrentImageIndex}
          onPrevImage={handlePrevImage}
          onNextImage={handleNextImage}
          productName={product?.name || "หมอนสุขภาพ Crystal Dreams"}
        />

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
          <ProductFeatures
            description={product?.description || "📐 ขนาด: 60*40*10 cm\n(🔥 ส่งฟรี!) 📦 สินค้าพรีออเดอร์: รอของ 14-20 วัน"}
          />

          {/* รายละเอียดเพิ่มเติมจากหลังบ้าน */}
          {product?.detail && (
            <div className={styles.detailSection}>
              <p className={styles.detailText}>
                {product.detail}
              </p>
            </div>
          )}

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

            {/* Share link */}
            <div className={styles.linkGroup}>
              <button type="button" className={styles.shareLink} onClick={handleShare} style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                <Share2 size={16} />
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Modal (Popup) */}
      <PaymentQrModal
        showQrModal={showQrModal}
        loadingQr={loadingQr}
        qrCodeDataUrl={qrCodeDataUrl}
        totalAmount={totalAmount}
        quantity={quantity}
        createdOrderId={createdOrderId}
        onProceed={proceedToUploadSlip}
        onCancel={handleCancelOrder}
      />
    </main>
  );
}

export function ProductDetailSkeleton() {
  return (
    <main className={styles.main}>
      <div className={styles.grid}>
        {/* Product Image Section */}
        <div className={styles.imageColumn}>
          <div className={styles.imageCard}>
            <div className={`${styles.imageWrapper} ${styles.skeleton}`} style={{ width: "100%", height: "440px", aspectRatio: "1 / 1" }}></div>
          </div>
        </div>

        {/* Detail Section */}
        <div className={styles.detailColumn}>
          <div>
            <div className={`${styles.skeleton} ${styles.skeletonTitle}`} style={{ width: "80%", height: "2.5rem" }}></div>
            <div className={styles.priceContainer} style={{ marginTop: "1rem" }}>
              <div className={`${styles.skeleton}`} style={{ width: "120px", height: "2rem" }}></div>
              <div className={`${styles.skeleton}`} style={{ width: "80px", height: "1.5rem" }}></div>
            </div>
            <div className={`${styles.skeleton}`} style={{ width: "100px", height: "0.75rem", marginTop: "0.5rem" }}></div>
          </div>

          <div className={styles.descriptionSection}>
            <div className={`${styles.skeleton}`} style={{ width: "100%", height: "1rem", marginBottom: "0.5rem" }}></div>
            <div className={`${styles.skeleton}`} style={{ width: "90%", height: "1rem", marginBottom: "0.5rem" }}></div>
            <div className={`${styles.skeleton}`} style={{ width: "60%", height: "1rem" }}></div>
          </div>

          <div className={styles.actionContainer}>
            <div className={styles.quantitySection}>
              <div className={`${styles.skeleton}`} style={{ width: "40px", height: "0.85rem", marginBottom: "0.5rem" }}></div>
              <div className={`${styles.skeleton}`} style={{ width: "120px", height: "2.5rem" }}></div>
            </div>
            <div className={styles.buttonGroup}>
              <div className={`${styles.skeleton}`} style={{ width: "100%", height: "3rem" }}></div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
