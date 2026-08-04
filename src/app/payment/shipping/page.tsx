"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import CartDrawer from "@/components/Cart/CartDrawer";
import OrderSummaryCard from "../slip/OrderSummaryCard";
import ShippingForm from "../slip/ShippingForm";
import styles from "../slip/slip.module.css";

interface ShippingOrder {
  id: string;
  quantity: number;
  total_amount: number;
  customer_name: string | null;
  customer_tel: string | null;
  customer_address: string | null;
  customer_line: string | null;
  payment_method: "promptpay" | "cod";
  payment_status: string;
  shipping_completed: boolean;
  products?: { name: string } | null;
  items?: Array<{
    product_id: string;
    name: string;
    price: number;
    quantity: number;
    image_url: string | null;
  }> | null;
}

function ShippingContent() {
  const router = useRouter();
  const orderId = useSearchParams().get("orderId");
  const [order, setOrder] = useState<ShippingOrder | null>(null);
  const [loading, setLoading] = useState(Boolean(orderId));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(orderId ? "" : "ไม่พบหมายเลขคำสั่งซื้อ");
  const [name, setName] = useState("");
  const [tel, setTel] = useState("");
  const [address, setAddress] = useState("");
  const [lineId, setLineId] = useState("");

  useEffect(() => {
    if (!orderId) {
      return;
    }

    async function loadOrder() {
      try {
        const response = await fetch(`/api/orders/${orderId}/payment-status`, { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "ไม่พบข้อมูลคำสั่งซื้อ");
        if (!data.canEnterShipping) {
          throw new Error("กรุณาชำระเงินผ่าน Omise ให้สำเร็จก่อนกรอกข้อมูลจัดส่ง");
        }
        if (data.shippingCompleted) {
          router.replace(`/success?orderId=${orderId}`);
          return;
        }

        const loadedOrder = data.order as ShippingOrder;
        setOrder(loadedOrder);
        setName(loadedOrder.customer_name || "");
        setTel(loadedOrder.customer_tel || "");
        setAddress(loadedOrder.customer_address || "");
        setLineId(loadedOrder.customer_line || "");
      } catch (loadError: unknown) {
        setError(loadError instanceof Error ? loadError.message : "โหลดข้อมูลคำสั่งซื้อไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    }

    void loadOrder();
  }, [orderId, router]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!orderId) return;
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(`/api/orders/${orderId}/shipping`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: name,
          customer_tel: tel,
          customer_address: address,
          customer_line: lineId,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "บันทึกข้อมูลจัดส่งไม่สำเร็จ");
      router.push(`/success?orderId=${orderId}`);
    } catch (submitError: unknown) {
      setError(submitError instanceof Error ? submitError.message : "บันทึกข้อมูลจัดส่งไม่สำเร็จ");
      setSubmitting(false);
    }
  };

  if (loading) return <ShippingSkeleton />;
  if (!order) {
    return (
      <div className={styles.errorOverlay}>
        <div className={styles.errorCard}>
          <div className={styles.errorIcon}><AlertTriangle size={28} /></div>
          <h2 className={styles.errorTitle}>ไม่สามารถกรอกข้อมูลจัดส่งได้</h2>
          <p className={styles.errorText}>{error}</p>
          <Link href="/" className={styles.errorBackBtn}>กลับสู่หน้าหลัก</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <Header />
      <main className={styles.main}>
        <div className={styles.grid}>
          <div className={styles.summaryColumn}>
            <OrderSummaryCard
              orderId={orderId}
              productName={order.products?.name}
              quantity={order.quantity}
              totalAmount={order.total_amount}
              items={order.items}
            />
          </div>
          <div className={styles.formColumn}>
            <div className={styles.formCard}>
              <div className={styles.formHeader}>
                <h2 className={styles.formTitle}>กรอกที่อยู่จัดส่งสินค้า</h2>
                <p className={styles.formSubtitle}>
                  {order.payment_method === "cod"
                    ? "กรอกข้อมูลผู้รับเพื่อยืนยันออเดอร์เก็บเงินปลายทาง"
                    : "Omise ยืนยันการชำระเงินแล้ว กรุณากรอกข้อมูลผู้รับสำหรับจัดส่ง"}
                </p>
              </div>
              {error && <div className={styles.errorPanel}>{error}</div>}
              <form onSubmit={handleSubmit} className={styles.form}>
                <ShippingForm
                  name={name}
                  onNameChange={setName}
                  tel={tel}
                  onTelChange={setTel}
                  address={address}
                  onAddressChange={setAddress}
                  lineId={lineId}
                  onLineIdChange={setLineId}
                />
                <button type="submit" disabled={submitting} className={styles.submitBtn}>
                  {submitting ? "กำลังบันทึกข้อมูลจัดส่ง..." : "ยืนยันข้อมูลจัดส่ง"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}

function ShippingSkeleton() {
  return (
    <div className={styles.pageContainer}>
      <Header />
      <main className={styles.main}>
        <div className={styles.formCard} style={{ maxWidth: 760, margin: "3rem auto" }}>
          <p className={styles.formSubtitle}>กำลังตรวจสอบคำสั่งซื้อและสถานะการชำระเงิน...</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function ShippingPage() {
  return <Suspense fallback={<ShippingSkeleton />}><ShippingContent /></Suspense>;
}
