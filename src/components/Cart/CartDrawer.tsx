"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X, Trash2, ShoppingCart, ArrowRight } from "lucide-react";
import Swal from "sweetalert2";
import { useCart } from "@/context/CartContext";
import { supabase } from "@/utils/supabase";
import styles from "./CartDrawer.module.css";
import PaymentQrModal from "../ProductDetail/PaymentQrModal";
import PaymentMethodModal from "../Checkout/PaymentMethodModal";

export default function CartDrawer() {
  const router = useRouter();
  const {
    cart,
    setCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartCount,
    cartTotal,
    isCartOpen,
    setIsCartOpen,
  } = useCart();

  // QR Modal states
  const [showQrModal, setShowQrModal] = useState(false);
  const [loadingQr, setLoadingQr] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const [createdOrderId, setCreatedOrderId] = useState("");
  const [totalAmount, setTotalAmount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);

  // Stock checking states
  const [stockMap, setStockMap] = useState<Record<string, number>>({});
  const [stockChecking, setStockChecking] = useState(false);
  const [recentOrders, setRecentOrders] = useState<string[]>([]);

  // Load recent orders from localStorage when cart opens
  useEffect(() => {
    if (isCartOpen) {
      try {
        const saved = localStorage.getItem("crystaldreams_recent_orders");
        if (saved) {
          setRecentOrders(JSON.parse(saved));
        }
      } catch (e) {
        console.error("Error reading recent orders:", e);
      }
    }
  }, [isCartOpen]);

  // Fetch latest stock from Supabase when cart opens or length changes
  useEffect(() => {
    if (!isCartOpen || cart.length === 0) return;

    const checkStocks = async () => {
      setStockChecking(true);
      try {
        const productIds = cart.map((item) => item.id);
        const { data, error } = await supabase
          .from("products")
          .select("id, stock, is_visible")
          .in("id", productIds);

        if (error) {
          console.error("Failed to check stock:", error);
          return;
        }

        if (data) {
          const map: Record<string, number> = {};
          data.forEach((p) => {
            map[p.id] = p.is_visible ? p.stock : 0;
          });
          setStockMap(map);

          // Synchronize with local cart context stocks
          setCart((prevCart) =>
            prevCart.map((item) => {
              const latestStock = map[item.id];
              if (latestStock !== undefined && latestStock !== item.stock) {
                return { ...item, stock: latestStock };
              }
              return item;
            })
          );
        }
      } catch (err) {
        console.error("Error fetching stocks:", err);
      } finally {
        setStockChecking(false);
      }
    };

    checkStocks();
  }, [isCartOpen, cart.length, setCart]);

  // Check if there are any items that are out of stock or have insufficient quantity
  const hasOutOfStockItems = cart.some((item) => {
    const currentStock = stockMap[item.id] !== undefined ? stockMap[item.id] : item.stock;
    return currentStock <= 0 || item.quantity > currentStock;
  });

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setShowPaymentMethodModal(true);
  };

  const handlePaymentMethodSelect = async (selectedMethod: "promptpay" | "cod") => {
    setShowPaymentMethodModal(false);
    setSubmitting(true);
    if (selectedMethod === "promptpay") {
      setLoadingQr(true);
      setShowQrModal(true);
    }

    try {
      // 1. Create order in backend with all cart items
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: cart.map((item) => ({
            product_id: item.id,
            quantity: item.quantity,
          })),
          payment_method: selectedMethod,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ");
      }

      setCreatedOrderId(data.orderId);
      setTotalAmount(data.totalAmount);
      
      // Save recent order ID for tracking
      try {
        const saved = localStorage.getItem("crystaldreams_recent_orders");
        const list = saved ? JSON.parse(saved) : [];
        if (!list.includes(data.orderId)) {
          list.unshift(data.orderId);
          localStorage.setItem("crystaldreams_recent_orders", JSON.stringify(list.slice(0, 5)));
        }
      } catch (e) {
        console.error("Error saving recent order ID:", e);
      }
      
      // Close cart drawer
      setIsCartOpen(false);

      if (selectedMethod === "promptpay") {
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
      alert(errMsg);
      setShowQrModal(false);
    } finally {
      setSubmitting(false);
      setLoadingQr(false);
    }
  };

  const proceedToUploadSlip = () => {
    setShowQrModal(false);
    if (createdOrderId) {
      // Clear cart once checkout is verified and we proceed to fill in slip
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
  };

  return (
    <>
      {/* Background Overlay */}
      <div
        className={`${styles.overlay} ${isCartOpen ? styles.overlayOpen : ""}`}
        onClick={() => setIsCartOpen(false)}
      />

      {/* Cart Drawer */}
      <div className={`${styles.drawer} ${isCartOpen ? styles.drawerOpen : ""}`}>
        <div className={styles.header}>
          <h3 className={styles.title}>
            <ShoppingCart size={20} />
            <span>ตะกร้าสินค้าของคุณ</span>
            {cartCount > 0 && <span className={styles.countBadge}>{cartCount}</span>}
          </h3>
          <button
            onClick={() => setIsCartOpen(false)}
            className={styles.closeBtn}
            title="ปิดตะกร้า"
          >
            <X size={20} />
          </button>
        </div>

        {cart.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🛒</div>
            <h4 className={styles.emptyText}>ตะกร้าสินค้ายังว่างอยู่</h4>
            <p className={styles.emptyDesc}>
              ดูเหมือนว่าคุณยังไม่มีสินค้าในตะกร้า เลือกชมสินค้าเพื่อนอนหลับสบายได้เลย!
            </p>
            <button onClick={() => setIsCartOpen(false)} className={styles.shopBtn}>
              เลือกซื้อสินค้าต่อ
            </button>
            {recentOrders.length > 0 && (
              <div style={{ marginTop: "2rem", borderTop: "1px solid #e2e8f0", paddingTop: "1.25rem", width: "100%", textAlign: "left" }}>
                <h5 style={{ fontSize: "0.825rem", fontWeight: "800", color: "#1e3a8a", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                  📦 ติดตามสถานะพัสดุล่าสุดของคุณ
                </h5>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {recentOrders.map((ordId) => (
                    <Link
                      key={ordId}
                      href={`/track?orderId=${ordId}`}
                      onClick={() => setIsCartOpen(false)}
                      style={{ fontSize: "0.775rem", color: "#475569", textDecoration: "none", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#f8fafc", padding: "0.5rem 0.75rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0", transition: "all 0.2s" }}
                    >
                      <span>คำสั่งซื้อ: ...{ordId.slice(-8)}</span>
                      <span style={{ color: "#1e3a8a", fontWeight: "700" }}>ดูสถานะ ➔</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            <Link
              href="/track"
              onClick={() => setIsCartOpen(false)}
              className={styles.shopBtn}
              style={{
                marginTop: "0.75rem",
                backgroundColor: "transparent",
                border: "1.5px solid #1e3a8a",
                color: "#1e3a8a",
                textDecoration: "none",
                display: "block"
              }}
            >
              🔍 ค้นหาและติดตามสถานะพัสดุ
            </Link>
          </div>
        ) : (
          <>
            {/* Scrollable list zone */}
            <div className={styles.itemListZone}>
              {cart.map((item) => (
                <div key={item.id} className={styles.cartItem}>
                  <div className={styles.imgWrapper}>
                    <Image
                      src={item.image_url || "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&q=80&w=800"}
                      alt={item.name}
                      fill
                      sizes="80px"
                      className={styles.itemImg}
                    />
                  </div>

                  <div className={styles.itemDetails}>
                    <div>
                      <h4 className={styles.itemName}>{item.name}</h4>
                      <div className={styles.itemPrice}>
                        {item.price.toLocaleString("en-US", { minimumFractionDigits: 2 })} THB
                      </div>
                      {item.stock <= 0 ? (
                        <div className={styles.stockError} style={{ color: "#ef4444", fontSize: "0.8rem", marginTop: "0.25rem", fontWeight: "500" }}>
                          ⚠️ สินค้าหมดสต็อก
                        </div>
                      ) : item.quantity > item.stock ? (
                        <div className={styles.stockError} style={{ color: "#ef4444", fontSize: "0.8rem", marginTop: "0.25rem", fontWeight: "500" }}>
                          ⚠️ มีสินค้าไม่เพียงพอ (คงเหลือ {item.stock} ชิ้น)
                        </div>
                      ) : null}
                    </div>

                    <div className={styles.itemRow}>
                      <div className={styles.qtySelector}>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1 || submitting}
                          className={styles.qtyBtn}
                        >
                          －
                        </button>
                        <span className={styles.qtyVal}>{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= item.stock || submitting}
                          className={styles.qtyBtn}
                        >
                          ＋
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        disabled={submitting}
                        className={styles.removeBtn}
                        title="ลบสินค้านี้"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {recentOrders.length > 0 && (
                <div style={{ padding: "1rem 1.25rem 0.5rem 1.25rem", borderTop: "1px solid #f1f5f9", marginTop: "1rem" }}>
                  <Link
                    href={`/track?orderId=${recentOrders[0]}`}
                    onClick={() => setIsCartOpen(false)}
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.775rem", color: "#1e3a8a", backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", padding: "0.6rem 0.85rem", borderRadius: "0.75rem", textDecoration: "none", fontWeight: "700" }}
                  >
                    <span>📦 ติดตามสถานะจัดส่งออเดอร์ล่าสุด (...{recentOrders[0].slice(-8)})</span>
                    <span>ดูสเตตัส ➔</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Footer subtotal & Action buttons */}
            <div className={styles.footer}>
              <div className={styles.totalRow}>
                <span className={styles.totalLabel}>ยอดรวมทั้งหมด</span>
                <span className={styles.totalValue}>
                  {cartTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })} THB
                </span>
              </div>

              <button
                type="button"
                onClick={handleCheckout}
                disabled={submitting || hasOutOfStockItems || stockChecking}
                className={styles.checkoutBtn}
                style={hasOutOfStockItems ? { backgroundColor: "#94a3b8" } : undefined}
              >
                {submitting ? (
                  <>
                    <div className={styles.btnSpinner}></div>
                    <span>กำลังดำเนินการ...</span>
                  </>
                ) : stockChecking ? (
                  <span>กำลังตรวจสอบสต็อกสินค้า...</span>
                ) : hasOutOfStockItems ? (
                  <span>มีสินค้าหมดสต็อกในตะกร้า</span>
                ) : (
                  <>
                    <span>ชำระเงิน (Checkout)</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>

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
        totalAmount={cartTotal}
      />
    </>
  );
}
