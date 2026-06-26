"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/utils/supabase";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import CartDrawer from "@/components/Cart/CartDrawer";
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
  payment_method?: string | null;
  products?: {
    name: string;
  } | null;
  items?: Array<{
    product_id: string;
    name: string;
    price: number;
    quantity: number;
    image_url: string | null;
  }> | null;
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
  const [stockError, setStockError] = useState("");

  // Form states
  const [name, setName] = useState("");
  const [tel, setTel] = useState("");
  const [address, setAddress] = useState("");
  const [lineId, setLineId] = useState("");
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipPreview, setSlipPreview] = useState<string>("");


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
        setLineId(data.customer_line || "");

        // Check stock availability for products in the order
        let isStockAvailable = true;
        let outOfStockItemName = "";

        if (data.items && Array.isArray(data.items)) {
          const productIds = data.items.map((item: any) => item.product_id);
          const { data: productsData, error: productsErr } = await supabase
            .from("products")
            .select("id, name, stock, is_visible")
            .in("id", productIds);

          if (productsErr || !productsData) {
            console.error("Failed to check product stocks:", productsErr);
          } else {
            const stockMap = new Map(productsData.map((p: any) => [p.id, p]));
            for (const item of data.items) {
              const prod = stockMap.get(item.product_id) as any;
              if (!prod || !prod.is_visible || prod.stock < item.quantity) {
                isStockAvailable = false;
                outOfStockItemName = prod ? prod.name : item.name;
                break;
              }
            }
          }
        } else if (data.product_id) {
          const { data: prodData, error: prodErr } = await supabase
            .from("products")
            .select("name, stock, is_visible")
            .eq("id", data.product_id)
            .single();

          if (prodErr || !prodData || !prodData.is_visible || prodData.stock < data.quantity) {
            isStockAvailable = false;
            outOfStockItemName = prodData ? prodData.name : (data.products?.name || "สินค้า");
          }
        }

        if (!isStockAvailable) {
          setStockError(`ขออภัย สินค้า "${outOfStockItemName}" ในคำสั่งซื้อนี้มีสต็อกไม่เพียงพอแล้ว กรุณายกเลิกคำสั่งซื้อแล้วเลือกสินค้าใหม่`);
        }
      } catch (err) {
        console.error(err);
        setError("เกิดข้อผิดพลาดในการโหลดข้อมูลคำสั่งซื้อ");
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [orderId]);




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

    const isCod = order?.payment_method === "cod";

    if (!isCod && !slipFile) {
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
      formData.append("customer_line", lineId);
      if (slipFile) {
        formData.append("slip", slipFile);
      }

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      }

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
            onClick={() => {
              if (order?.payment_method === "cod") {
                router.push("/");
              } else {
                router.push(`/?orderId=${orderId}&showQr=true`);
              }
            }}
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
              items={order?.items}
            />
          </div>

          {/* ===== คอลัมน์ขวา: ฟอร์มที่อยู่ + อัปโหลดสลิป ===== */}
          <div className={styles.formColumn}>
            <div className={styles.formCard}>
              <div className={styles.formHeader}>
                <h2 className={styles.formTitle}>
                  {order?.payment_method === "cod"
                    ? "กรอกที่อยู่จัดส่งสินค้า"
                    : "กรอกที่อยู่จัดส่งและแนบสลิป"}
                </h2>
                <p className={styles.formSubtitle}>
                  {order?.payment_method === "cod"
                    ? "กรุณากรอกข้อมูลผู้รับของจริงเพื่อความแม่นยำในการจัดส่ง (ระบบเก็บเงินปลายทาง)"
                    : "กรุณากรอกข้อมูลผู้รับของจริงเพื่อความแม่นยำในการจัดส่ง"}
                </p>
              </div>

              {error && <div className={styles.errorPanel}>{error}</div>}
              {stockError && <div className={styles.errorPanel} style={{ backgroundColor: "#fee2e2", borderColor: "#fca5a5", color: "#b91c1c" }}>⚠️ {stockError}</div>}

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

                {order?.payment_method !== "cod" && (
                  <SlipUploadZone
                    slipFile={slipFile}
                    slipPreview={slipPreview}
                    onFileChange={handleFileChange}
                    onClearFile={() => {
                      setSlipFile(null);
                      setSlipPreview("");
                    }}
                  />
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={submitting || !!stockError}
                  className={styles.submitBtn}
                  style={stockError ? { background: "#94a3b8", cursor: "not-allowed" } : undefined}
                >
                  {submitting ? (
                    <div className={styles.btnTextFlex}>
                      <div className={styles.spinnerSmall}></div>
                      <span>
                        {order?.payment_method === "cod"
                          ? "กำลังประมวลผลข้อมูลคำสั่งซื้อ..."
                          : "กำลังอัปโหลดและประมวลผลข้อมูล..."}
                      </span>
                    </div>
                  ) : order?.payment_method === "cod" ? (
                    "ยืนยันคำสั่งซื้อเก็บเงินปลายทาง"
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
      <CartDrawer />
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
      <CartDrawer />
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
