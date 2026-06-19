"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/utils/supabase";
import Swal from "sweetalert2";
import styles from "./ProductDetail.module.css";
import { AlertTriangle, Share2, Copy, X, ZoomIn } from "lucide-react";
import type { Review } from "@/types/review";
import ProductImageGallery from "./ProductImageGallery";
import ProductFeatures from "./ProductFeatures";
import PaymentQrModal from "./PaymentQrModal";
import PaymentMethodModal from "../Checkout/PaymentMethodModal";
import CartDrawer from "../Cart/CartDrawer";
import { useCart } from "@/context/CartContext";

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

interface ProductDetailProps {
  productId?: string;
}

export default function ProductDetail({ productId }: ProductDetailProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderIdParam = searchParams.get("orderId");
  const showQrParam = searchParams.get("showQr");

  const { addToCart, clearCart } = useCart();

  const [productsList, setProductsList] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(productId || null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Modal States for QR Code
  const [showQrModal, setShowQrModal] = useState(showQrParam === "true" && !!orderIdParam);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const [createdOrderId, setCreatedOrderId] = useState(orderIdParam || "");
  const [totalAmount, setTotalAmount] = useState(0);
  const [loadingQr, setLoadingQr] = useState(showQrParam === "true" && !!orderIdParam);
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);

  const product = productsList.find((p) => p.id === selectedProductId) || productsList[0] || null;

  const hasDiscount = product && product.discount_percent !== undefined && product.discount_percent > 0;
  const originalPrice = product ? Number(product.price) : 1890;
  const discountedPrice = hasDiscount
    ? Math.round(originalPrice * (1 - (product.discount_percent || 0) / 100))
    : originalPrice;

  useEffect(() => {
    async function fetchProducts() {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .order("sort_order", { ascending: true });

        if (error) {
          console.error("Error fetching products:", error);
          setError("ไม่สามารถดึงข้อมูลสินค้าได้ กรุณาลองใหม่อีกครั้ง");
        } else if (data) {
          setProductsList(data);
          
          // Set initial selected product based on props, URL or first item
          if (productId && data.some((p) => p.id === productId)) {
            setSelectedProductId(productId);
          } else {
            const productIdFromUrl = searchParams.get("productId");
            if (productIdFromUrl && data.some((p) => p.id === productIdFromUrl)) {
              setSelectedProductId(productIdFromUrl);
            } else if (data.length > 0) {
              setSelectedProductId(data[0].id);
            }
          }
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        setError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [searchParams, productId]);

  // Restore QR modal state from URL parameters
  useEffect(() => {
    if (showQrParam === "true" && orderIdParam) {
      const fetchOrderDetails = async () => {
        try {
          setLoadingQr(true);
          const { data: orderData, error: fetchErr } = await supabase
            .from("orders")
            .select("quantity, total_amount")
            .eq("id", orderIdParam)
            .single();

          if (fetchErr || !orderData) {
            console.error("Error fetching order for QR restoration:", fetchErr);
            setShowQrModal(false);
            const url = new URL(window.location.href);
            url.searchParams.delete("orderId");
            url.searchParams.delete("showQr");
            window.history.pushState(null, "", url.pathname + url.search);
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
              orderId: orderIdParam,
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
    setShowPaymentMethodModal(true);
  };

  const handlePaymentMethodSelect = async (selectedMethod: "promptpay" | "cod") => {
    if (!product) return;
    setShowPaymentMethodModal(false);
    setSubmitting(true);
    if (selectedMethod === "promptpay") {
      setLoadingQr(true);
    }

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
          payment_method: selectedMethod,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ");
      }

      setCreatedOrderId(data.orderId);
      setTotalAmount(data.totalAmount);

      if (selectedMethod === "promptpay") {
        setShowQrModal(true);
        const url = new URL(window.location.href);
        url.searchParams.set("orderId", data.orderId);
        url.searchParams.set("showQr", "true");
        window.history.pushState(null, "", url.pathname + url.search);

        // 2. Fetch PromptPay QR Code base64 data
        const qrRes = await fetch("/api/payment/qr", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: data.totalAmount,
            orderId: data.orderId,
          }),
        });

        const qrData = await qrRes.json();

        if (!qrRes.ok) {
          throw new Error(qrData.error || "ไม่สามารถสร้างคิวอาร์โค้ดชำระเงินได้");
        }

        setQrCodeDataUrl(qrData.qrDataUrl);
      } else {
        // Cash on Delivery: Redirect directly to the shipping form page
        clearCart();
        router.push(`/payment/slip?orderId=${data.orderId}`);
      }
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
      clearCart();
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
    const url = new URL(window.location.href);
    url.searchParams.delete("orderId");
    url.searchParams.delete("showQr");
    window.history.pushState(null, "", url.pathname + url.search);
  };

  const handleCopyLink = async () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
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
          icon: "error",
          title: "เกิดข้อผิดพลาด",
          text: "ไม่สามารถคัดลอกลิงก์ได้โดยอัตโนมัติ กรุณาคัดลอกด้วยตนเอง",
          confirmButtonText: "ตกลง",
        });
      }
    } else {
      Swal.fire({
        icon: "info",
        title: "คัดลอกลิงก์สินค้า",
        text: `คัดลอกลิงก์นี้เพื่อแชร์: ${window.location.href}`,
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#1e3a8a",
      });
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

  const hasNoProducts = !loading && productsList.length === 0 && !error;

  if (loading) {
    return <ProductDetailSkeleton />;
  }

  if (hasNoProducts) {
    return (
      <main className={styles.main}>
        <div className={styles.grid}>
          {/* Product Image Section */}
          <div className={styles.imageColumn}>
            <div className={styles.imageCard}>
              <div className={`${styles.imageWrapper} ${styles.skeletonStatic}`} style={{ width: "100%", height: "440px", aspectRatio: "1 / 1", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: "4rem", opacity: 0.15 }}>📦</span>
              </div>
            </div>
          </div>

          {/* Detail Section */}
          <div className={styles.detailColumn}>
            <div>
              <h1 className={styles.productName} style={{ color: "#94a3b8" }}>
                ยังไม่มีสินค้าในขณะนี้
              </h1>
              <div className={styles.priceContainer} style={{ marginTop: "1rem" }}>
                <div className={`${styles.skeletonStatic}`} style={{ width: "120px", height: "2rem" }}></div>
                <div className={`${styles.skeletonStatic}`} style={{ width: "80px", height: "1.5rem" }}></div>
              </div>
              <div className={`${styles.skeletonStatic}`} style={{ width: "100px", height: "0.75rem", marginTop: "0.5rem" }}></div>
            </div>

            <div className={styles.descriptionSection}>
              <p style={{ color: "#64748b", fontSize: "0.95rem", lineHeight: "1.6" }}>
                ขณะนี้ร้านค้ายังไม่มีรายการสินค้าสำหรับจัดจำหน่าย หรือสินค้าทั้งหมดถูกซ่อนอยู่ กรุณากลับมาตรวจสอบใหม่อีกครั้งในภายหลัง
              </p>
              <div className={`${styles.skeletonStatic}`} style={{ width: "90%", height: "1rem", marginTop: "1rem", marginBottom: "0.5rem" }}></div>
              <div className={`${styles.skeletonStatic}`} style={{ width: "60%", height: "1rem" }}></div>
            </div>

            <div className={styles.actionContainer}>
              <div className={styles.buttonGroup}>
                <button
                  type="button"
                  disabled
                  className={`${styles.btn} ${styles.btnBuyNowDisabled}`}
                  style={{ height: "3rem" }}
                >
                  ไม่พร้อมจำหน่าย
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
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
              {hasDiscount ? (
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                  <span className={styles.priceText} style={{ textDecoration: "line-through", color: "#94a3b8", fontSize: "1.1rem", fontWeight: "normal" }}>
                    {originalPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })} THB
                  </span>
                  <span className={styles.priceText} style={{ color: "#ef4444", fontSize: "1.75rem", fontWeight: "bold", lineHeight: 1 }}>
                    {discountedPrice.toLocaleString("en-US")} THB
                  </span>
                  <span style={{ fontSize: "0.85rem", backgroundColor: "#fee2e2", color: "#ef4444", padding: "0.2rem 0.5rem", borderRadius: "0.25rem", fontWeight: "600" }}>
                    SAVE {product?.discount_percent}%
                  </span>
                  <span className={`${styles.stockBadge} ${isSoldOut ? styles.stockSoldOut : styles.stockInStock}`}>
                    {isSoldOut ? "สินค้าหมด" : `${product?.stock} ชิ้น`}
                  </span>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                  <span className={styles.priceText}>
                    {originalPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })} THB
                  </span>
                  <span className={`${styles.stockBadge} ${isSoldOut ? styles.stockSoldOut : styles.stockInStock}`}>
                    {isSoldOut ? "สินค้าหมด" : `${product?.stock} ชิ้น`}
                  </span>
                </div>
              )}
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
              {/* Add to Cart button */}
              {!isSoldOut && (
                <button
                  type="button"
                  onClick={() => {
                    if (product) {
                      addToCart({
                        id: product.id,
                        name: product.name,
                        price: discountedPrice,
                        stock: product.stock,
                        image_url: product.image_url,
                      }, quantity);
                    }
                  }}
                  disabled={submitting}
                  className={`${styles.btn} ${styles.btnAddToCart}`}
                >
                  ใส่ตะกร้า (Add to Cart)
                </button>
              )}

              {/* Buy Now button */}
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
                  "สินค้าหมด (Sold out)"
                ) : (
                  "ซื้อเลย (Buy it now)"
                )}
              </button>
            </div>

            {/* Share link */}
            <div className={styles.linkGroup}>
              <button type="button" className={styles.shareLink} onClick={handleShare} style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                <Share2 size={16} />
                <span>Share</span>
              </button>
              <button type="button" className={styles.shareLink} onClick={handleCopyLink} style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                <Copy size={16} />
                <span>Copy Link</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Other Products Section */}
      {productsList.length > 1 && (
        <div className={styles.otherProductsSection}>
          <h3 className={styles.otherProductsTitle}>สินค้าเพิ่มเติม</h3>
          <div className={styles.otherProductsGrid}>
            {productsList.map((p) => {
              const isSelected = p.id === product?.id;
              const hasOtherDiscount = p.discount_percent !== undefined && p.discount_percent > 0;
              const otherOriginalPrice = Number(p.price);
              const otherDiscountedPrice = hasOtherDiscount
                ? Math.round(otherOriginalPrice * (1 - (p.discount_percent || 0) / 100))
                : otherOriginalPrice;
              return (
                <div
                  key={p.id}
                  className={`${styles.otherProductCard} ${isSelected ? styles.otherProductCardActive : ""}`}
                  onClick={() => {
                    if (productId) {
                      router.push(`/products/${p.id}`);
                    } else {
                      setSelectedProductId(p.id);
                      setCurrentImageIndex(0); // reset gallery image index when switching products
                      const url = new URL(window.location.href);
                      url.searchParams.set("productId", p.id);
                      window.history.replaceState(null, "", url.pathname + url.search);
                    }
                  }}
                >
                  <div className={styles.otherProductImageWrapper}>
                    <img
                      src={p.image_url || defaultImage}
                      alt={p.name}
                      className={styles.otherProductImage}
                    />
                  </div>
                  <div className={styles.otherProductInfo}>
                    <span className={styles.otherProductName}>{p.name}</span>
                    {hasOtherDiscount ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.1rem" }}>
                        <span className={styles.otherProductPrice} style={{ textDecoration: "line-through", color: "#94a3b8", fontSize: "0.8rem", fontWeight: "normal" }}>
                          {otherOriginalPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })} THB
                        </span>
                        <span className={styles.otherProductPrice} style={{ color: "#ef4444", fontWeight: "bold" }}>
                          {otherDiscountedPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })} THB
                        </span>
                      </div>
                    ) : (
                      <span className={styles.otherProductPrice}>
                        {otherOriginalPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })} THB
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* QR Code Modal (Popup) */}
      <PaymentQrModal
        showQrModal={showQrModal}
        loadingQr={loadingQr}
        qrCodeDataUrl={qrCodeDataUrl}
        totalAmount={totalAmount}
        createdOrderId={createdOrderId}
        onProceed={proceedToUploadSlip}
        onCancel={handleCancelOrder}
      />
      
      {/* Payment Method Selection Modal */}
      <PaymentMethodModal
        isOpen={showPaymentMethodModal}
        onClose={() => setShowPaymentMethodModal(false)}
        onSelect={handlePaymentMethodSelect}
        totalAmount={product ? discountedPrice * quantity : 0}
      />

      <CartDrawer />
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
