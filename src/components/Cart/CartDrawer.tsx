"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { X, Trash2, ShoppingCart, ArrowRight } from "lucide-react";
import Swal from "sweetalert2";
import { useCart } from "@/context/CartContext";
import styles from "./CartDrawer.module.css";
import PaymentQrModal from "../ProductDetail/PaymentQrModal";
import PaymentMethodModal from "../Checkout/PaymentMethodModal";

export default function CartDrawer() {
  const router = useRouter();
  const {
    cart,
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
                disabled={submitting}
                className={styles.checkoutBtn}
              >
                {submitting ? (
                  <>
                    <div className={styles.btnSpinner}></div>
                    <span>กำลังดำเนินการ...</span>
                  </>
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
