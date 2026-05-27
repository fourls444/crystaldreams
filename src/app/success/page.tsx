"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/utils/supabase";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import styles from "./success.module.css";

interface SuccessOrder {
  id: string;
  quantity: number;
  total_amount: number;
  customer_name: string | null;
  customer_tel: string | null;
  customer_address: string | null;
  products: {
    name: string;
  } | null;
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [loading, setLoading] = useState(!!orderId);
  const [order, setOrder] = useState<SuccessOrder | null>(null);

  useEffect(() => {
    if (!orderId) return;

    async function fetchOrder() {
      try {
        const { data, error: fetchErr } = await supabase
          .from("orders")
          .select("*, products(name)")
          .eq("id", orderId)
          .single();

        if (fetchErr) {
          console.error("Error fetching order:", fetchErr);
        } else if (data) {
          setOrder(data);
        }
      } catch (err) {
        console.error("Unexpected error fetching order:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingWrapper}>
          <div className={styles.spinner}></div>
          <p className={styles.infoValueBold}>กำลังโหลดข้อมูลความสำเร็จ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className={styles.main}>
        <div className={styles.card}>
          
          {/* Success Check Icon */}
          <div className={styles.successIconWrapper}>
            <span className={styles.successIcon}>✓</span>
          </div>

          <div className={styles.titleBlock}>
            <h1 className={styles.mainTitle}>ได้รับข้อมูลเรียบร้อยแล้ว!</h1>
            <p className={styles.subtitle}>
              ขอบคุณสำหรับคำสั่งซื้อหมอนสุขภาพ Crystal Dreams ของคุณ ขณะนี้สลิปของท่านกำลังอยู่ในกระบวนการตรวจสอบ
            </p>
          </div>

          {/* Order Details box */}
          {order && (
            <div className={styles.orderDetailsBox}>
              <div className={styles.detailsHeader}>
                <span className={styles.detailsHeaderTitle}>ข้อมูลคำสั่งซื้อ</span>
                <span className={styles.statusBadge}>
                  รอตรวจสอบสลิป
                </span>
              </div>

              <div className={styles.infoList}>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Order ID:</span>
                  <span className={styles.infoValueMono}>{order.id}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>สินค้า:</span>
                  <span className={styles.infoValueBold}>{order.products?.name} x {order.quantity} ใบ</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>ยอดชำระ:</span>
                  <span className={styles.infoValuePrice}>{order.total_amount?.toLocaleString()} บาท</span>
                </div>
              </div>

              <div className={styles.shippingBlock}>
                <span className={styles.shippingTitle}>ข้อมูลที่อยู่จัดส่ง</span>
                <div>
                  <span className={styles.shippingLabel}>ชื่อผู้รับ:</span>
                  <span className={styles.shippingValue}>{order.customer_name}</span>
                </div>
                <div>
                  <span className={styles.shippingLabel}>เบอร์โทรศัพท์:</span>
                  <span className={styles.shippingValue}>{order.customer_tel}</span>
                </div>
                <div className={styles.shippingAddressFlex}>
                  <span className={styles.shippingLabel} style={{ flexShrink: 0 }}>ที่อยู่จัดส่ง:</span>
                  <span className={styles.shippingAddressText}>{order.customer_address}</span>
                </div>
              </div>
            </div>
          )}

          {/* Time notice badge */}
          <div className={styles.noticeBox}>
            <span className={styles.noticeIcon}>📦</span>
            <div>
              <strong className={styles.noticeTitle}>ระยะเวลารอการยืนยัน:</strong>
              หลังจากตรวจสอบความถูกต้องของสลิปโอนเงินสำเร็จ (ปกติใช้เวลา 5-15 นาที) ระบบจะส่งออเดอร์ให้แผนกจัดส่งทันที และท่านจะได้รับสินค้าภายใน 1-3 วันทำการ
            </div>
          </div>

          {/* Home Link button */}
          <Link href="/" className={styles.homeBtn}>
            กลับสู่หน้าหลัก
          </Link>

        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className={styles.loadingContainer}>
        <div className={styles.loadingWrapper}>
          <div className={styles.spinner}></div>
          <p className={styles.infoLabel} style={{ fontWeight: 500 }}>กำลังเตรียมข้อมูลหน้าร้านค้า...</p>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
