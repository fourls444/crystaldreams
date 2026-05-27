"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/utils/supabase";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import styles from "./slip.module.css";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import OrderSummaryCard from "./OrderSummaryCard";
import ShippingForm from "./ShippingForm";
import SlipUploadZone from "./SlipUploadZone";



interface Order {
  id: string;
  customer_name: string | null;
  customer_tel: string | null;
  customer_address: string | null;
  total_amount: number;
  quantity: number;
  products?: {
    name: string;
  } | null;
}

function SlipContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  const [loading, setLoading] = useState(orderId ? true : false);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState(
    orderId ? "" : "ไม่พบหมายเลขคำสั่งซื้อ กรุณากลับไปดำเนินการใหม่ที่หน้าแรก"
  );
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [tel, setTel] = useState("");
  const [address, setAddress] = useState("");
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipPreview, setSlipPreview] = useState<string>("");

  // ---- K-SHOP QR Code States ----
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState("");

  // ดึงข้อมูลคำสั่งซื้อ
  useEffect(() => {
    if (!orderId) return;

    async function fetchOrder() {
      try {
        const { data, error: fetchErr } = await supabase
          .from("orders")
          .select("*, products(name)")
          .eq("id", orderId)
          .single();

        if (fetchErr || !data) {
          setError("ไม่พบข้อมูลคำสั่งซื้อในระบบ");
          setLoading(false);
          return;
        }

        setOrder(data);
        setName(data.customer_name || "");
        setTel(data.customer_tel || "");
      } catch (err) {
        console.error(err);
        setError("เกิดข้อผิดพลาดในการโหลดข้อมูลคำสั่งซื้อ");
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [orderId]);

  // สร้าง QR อัตโนมัติเมื่อโหลดออเดอร์สำเร็จ
  useEffect(() => {
    if (order) {
      handleGenerateQr();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order]);

  // ---- สร้าง QR Code ----
  const handleGenerateQr = useCallback(
    async () => {
      if (!order) return;
      setQrLoading(true);
      setQrError("");
      setQrDataUrl("");

      try {
        const res = await fetch("/api/payment/qr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: order.total_amount,
            orderId: order.id,
            // ส่งค่าว่างเพื่อให้ API ใช้ค่าจาก NEXT_PUBLIC_PROMPTPAY_NUMBER ใน env.local เอง
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setQrError(data.error || "ไม่สามารถสร้าง QR Code ได้");
        } else {
          setQrDataUrl(data.qrDataUrl);
        }
      } catch {
        setQrError("เกิดข้อผิดพลาดในการเชื่อมต่อ");
      } finally {
        setQrLoading(false);
      }
    },
    [order]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSlipFile(file);
      setSlipPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || !tel.trim() || !address.trim()) {
      setError("กรุณากรอกข้อมูลสำหรับการจัดส่งให้ครบถ้วน");
      return;
    }

    if (!slipFile) {
      setError("กรุณาแนบรูปภาพสลิปหลักฐานการโอนเงินเพื่อยืนยัน");
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("order_id", orderId!);
      formData.append("customer_name", name);
      formData.append("customer_tel", tel);
      formData.append("customer_address", address);
      formData.append("slip", slipFile);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.error || "เกิดข้อผิดพลาดในการอัปโหลดหลักฐาน");
      }

      // Verify สลิปใน background (async)
      fetch(`/api/orders/${orderId}/verify`, { method: "POST" }).catch(console.error);

      router.push(`/success?orderId=${orderId}`);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการบันทึกข้อมูล";
      setError(message);
      setSubmitting(false);
    }
  };



  if (loading) {
    return <SlipSkeleton />;
  }

  if (error && !order) {
    return (
      <div className={styles.errorOverlay}>
        <div className={styles.errorCard}>
          <div className={styles.errorIcon}>
            <AlertTriangle size={28} />
          </div>
          <h2 className={styles.errorTitle}>เกิดข้อผิดพลาด</h2>
          <p className={styles.errorText}>{error}</p>
          <Link href="/" className={styles.errorBackBtn}>
            กลับสู่หน้าหลัก
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <Header />

      <main className={styles.main}>
        <div className={styles.backHeader}>
          <button
            onClick={() => router.push(`/?orderId=${orderId}&showQr=true`)}
            className={styles.backLinkBtn}
            style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
          >
            <ArrowLeft size={16} />
            <span>ย้อนกลับ</span>
          </button>
        </div>

        <div className={styles.grid}>
          {/* ===== คอลัมน์ซ้าย: สรุปออเดอร์ ===== */}
          <div className={styles.summaryColumn}>
            <OrderSummaryCard
              orderId={orderId}
              productName={order?.products?.name}
              quantity={order?.quantity}
              totalAmount={order?.total_amount}
            />
          </div>

          {/* ===== คอลัมน์ขวา: ฟอร์มที่อยู่ + อัปโหลดสลิป ===== */}
          <div className={styles.formColumn}>
            <div className={styles.formCard}>
              <div className={styles.formHeader}>
                <h2 className={styles.formTitle}>
                  กรอกที่อยู่จัดส่งและแนบสลิป
                </h2>
                <p className={styles.formSubtitle}>
                  กรุณากรอกข้อมูลผู้รับของจริงเพื่อความแม่นยำในการจัดส่ง
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
                />

                <SlipUploadZone
                  slipFile={slipFile}
                  slipPreview={slipPreview}
                  onFileChange={handleFileChange}
                  onClearFile={() => {
                    setSlipFile(null);
                    setSlipPreview("");
                  }}
                />

                {/* Submit */}
                <button
                  type="submit"
                  disabled={submitting}
                  className={styles.submitBtn}
                >
                  {submitting ? (
                    <div className={styles.btnTextFlex}>
                      <div className={styles.spinnerSmall}></div>
                      <span>กำลังอัปโหลดและประมวลผลข้อมูล...</span>
                    </div>
                  ) : (
                    "ยืนยันการชำระเงินและคำสั่งซื้อ"
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function SlipSkeleton() {
  return (
    <div className={styles.pageContainer}>
      <Header />
      <main className={styles.main}>
        <div className={styles.backHeader}>
          <span className={styles.backLinkBtn} style={{ opacity: 0.5 }}>
            ← ย้อนกลับ
          </span>
        </div>
        <div className={styles.grid}>
          {/* ===== คอลัมน์ซ้าย: สรุปออเดอร์ ===== */}
          <div className={styles.summaryColumn}>
            <div className={`${styles.summaryCard} ${styles.skeletonCard}`}>
              <h2 className={styles.summaryTitle}>สรุปรายการคำสั่งซื้อ</h2>
              <div className={styles.summaryItems}>
                <div>
                  <span className={styles.itemLabel}>Order ID</span>
                  <span className={`${styles.skeleton} ${styles.skeletonText}`} style={{ width: "120px" }}></span>
                </div>
                <div>
                  <span className={styles.itemLabel}>สินค้าที่สั่งซื้อ</span>
                  <span className={`${styles.skeleton} ${styles.skeletonText}`} style={{ width: "180px" }}></span>
                </div>
                <div className={styles.totalRow}>
                  <div>
                    <span className={styles.itemLabel}>จำนวน</span>
                    <span className={`${styles.skeleton} ${styles.skeletonText}`} style={{ width: "50px" }}></span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span className={styles.itemLabel}>ยอดรวมทั้งสิ้น</span>
                    <span className={`${styles.skeleton} ${styles.skeletonText}`} style={{ width: "80px", height: "1.25rem" }}></span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ===== คอลัมน์ขวา: ฟอร์มที่อยู่ ===== */}
          <div className={styles.formColumn}>
            <div className={styles.formCard}>
              <div className={styles.formHeader}>
                <div className={`${styles.skeleton}`} style={{ width: "60%", height: "1.5rem" }}></div>
                <div className={`${styles.skeleton}`} style={{ width: "40%", height: "0.875rem", marginTop: "0.5rem" }}></div>
              </div>
              <div className={styles.form}>
                <div className={styles.recipientRow}>
                  <div className={styles.inputGroup}>
                    <div className={`${styles.skeleton}`} style={{ width: "80px", height: "0.75rem", marginBottom: "0.375rem" }}></div>
                    <div className={`${styles.skeleton}`} style={{ width: "100%", height: "2.5rem" }}></div>
                  </div>
                  <div className={styles.inputGroup}>
                    <div className={`${styles.skeleton}`} style={{ width: "80px", height: "0.75rem", marginBottom: "0.375rem" }}></div>
                    <div className={`${styles.skeleton}`} style={{ width: "100%", height: "2.5rem" }}></div>
                  </div>
                </div>
                <div className={styles.inputGroup}>
                  <div className={`${styles.skeleton}`} style={{ width: "120px", height: "0.75rem", marginBottom: "0.375rem" }}></div>
                  <div className={`${styles.skeleton}`} style={{ width: "100%", height: "6rem" }}></div>
                </div>
                <div className={styles.inputGroup}>
                  <div className={`${styles.skeleton}`} style={{ width: "120px", height: "0.75rem", marginBottom: "0.375rem" }}></div>
                  <div className={`${styles.skeleton}`} style={{ width: "100%", height: "11.25rem" }}></div>
                </div>
                <div className={`${styles.skeleton}`} style={{ width: "100%", height: "3rem" }}></div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function SlipPage() {
  return (
    <Suspense fallback={<SlipSkeleton />}>
      <SlipContent />
    </Suspense>
  );
}
