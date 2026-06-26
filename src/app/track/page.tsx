"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, Copy, Check, ArrowLeft, Loader2, Package, CheckCircle2, Truck, ClipboardCheck, HelpCircle } from "lucide-react";
import Swal from "sweetalert2";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import CartDrawer from "@/components/Cart/CartDrawer";
import styles from "./track.module.css";

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  quantity: number;
  status: string;
  shipping_status: string;
  shipping_carrier: string | null;
  tracking_number: string | null;
  payment_method: string | null;
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
  customer_name?: string;
  customer_tel?: string;
  customer_address?: string;
}

function getCarrierTrackingUrl(carrier: string, trackNo: string): string {
  const c = carrier.toLowerCase();
  if (c.includes("flash")) {
    return `https://www.flashexpress.co.th/tracking/?se=${trackNo}`;
  }
  if (c.includes("j&t") || c.includes("jt")) {
    return "https://www.jtexpress.co.th/index/query/gzquery.html";
  }
  if (c.includes("kerry")) {
    return `https://th.kerryexpress.com/th/track/?track=${trackNo}`;
  }
  if (c.includes("ไปรษณีย์") || c.includes("ems") || c.includes("thailand post")) {
    return `https://track.thailandpost.co.th/?trackNumber=${trackNo}`;
  }
  return "";
}

function TrackingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderIdParam = searchParams.get("orderId");

  const [activeTab, setActiveTab] = useState<"orderId" | "phone">("orderId");
  const [searchVal, setSearchVal] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Results
  const [singleOrder, setSingleOrder] = useState<Order | null>(null);
  const [ordersList, setOrdersList] = useState<Order[]>([]);
  const [copied, setCopied] = useState(false);

  // Auto-search on URL param load
  useEffect(() => {
    if (orderIdParam) {
      setSearchVal(orderIdParam);
      handleSearch(orderIdParam, "orderId");
    }
  }, [orderIdParam]);

  const handleSearch = async (value: string, searchMode: "orderId" | "phone" = activeTab) => {
    const query = value.trim();
    if (!query) return;

    setLoading(true);
    setError("");
    setSingleOrder(null);
    setOrdersList([]);

    try {
      const url = searchMode === "orderId"
        ? `/api/orders/track?orderId=${encodeURIComponent(query)}`
        : `/api/orders/track?phone=${encodeURIComponent(query)}`;

      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "เกิดข้อผิดพลาดในการค้นหา");
      }

      if (searchMode === "orderId") {
        setSingleOrder(data.order);
      } else {
        setOrdersList(data.orders || []);
      }
    } catch (err: any) {
      setError(err.message || "ไม่พบข้อมูล กรุณาตรวจสอบและลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchVal);
    // Push state to URL to support sharing/reloading if searching by Order ID
    if (activeTab === "orderId" && searchVal.trim().length > 10) {
      const url = new URL(window.location.href);
      url.searchParams.set("orderId", searchVal.trim());
      window.history.pushState(null, "", url.pathname + url.search);
    }
  };

  const selectOrderFromList = (order: Order) => {
    setSingleOrder(order);
    // Update URL to match selected order ID
    const url = new URL(window.location.href);
    url.searchParams.set("orderId", order.id);
    window.history.pushState(null, "", url.pathname + url.search);
  };

  const handleCopyTracking = (trackNo: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(trackNo);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      Swal.fire({
        icon: "success",
        title: "คัดลอกเลขพัสดุสำเร็จ",
        timer: 1500,
        showConfirmButton: false,
        toast: true,
        position: "top-end"
      });
    }
  };

  // Status mapping functions
  const getStatusText = (status: string) => {
    switch (status) {
      case "verified": return "ชำระเงินสำเร็จ";
      case "slip_uploaded": return "อัปโหลดสลิปแล้ว (รอแอดมินยืนยัน)";
      case "cod_pending": return "เก็บเงินปลายทาง (ได้รับคำสั่งซื้อแล้ว)";
      case "rejected": return "ปฏิเสธ/ยกเลิกคำสั่งซื้อ";
      case "pending":
      default: return "รอการชำระเงิน";
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "verified": return styles.badgeVerified;
      case "slip_uploaded": return styles.badgeUploaded;
      case "cod_pending": return styles.badgeUploaded;
      case "rejected": return styles.badgeRejected;
      case "pending":
      default: return styles.badgePending;
    }
  };

  const getShippingStatusText = (shippingStatus: string) => {
    switch (shippingStatus) {
      case "shipped": return "อยู่ระหว่างจัดส่ง";
      case "delivered": return "จัดส่งสำเร็จ";
      case "processing":
      default: return "กำลังเตรียมการจัดส่ง";
    }
  };

  const getShippingStatusBadgeClass = (shippingStatus: string) => {
    switch (shippingStatus) {
      case "shipped": return styles.badgeShipped;
      case "delivered": return styles.badgeDelivered;
      case "processing":
      default: return styles.badgeProcessing;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("th-TH", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }) + " น.";
    } catch {
      return dateStr;
    }
  };

  // Determine timeline steps active states
  const getTimelineSteps = (order: Order) => {
    const isVerified = order.status === "verified";
    const isCod = order.payment_method === "cod";
    const isUploaded = order.status === "slip_uploaded";
    const shipping = order.shipping_status;

    return [
      {
        key: "placed",
        label: "ได้รับคำสั่งซื้อ",
        desc: `สร้างออเดอร์เมื่อ ${formatDate(order.created_at)}`,
        active: true,
        icon: <Package size={12} className={styles.stepIcon} />
      },
      {
        key: "payment",
        label: isCod ? "ชำระเงินปลายทาง (ไม่ต้องโอนล่วงหน้า)" : "ตรวจสอบยอดชำระเงิน",
        desc: isVerified 
          ? "ชำระเงินเรียบร้อยแล้ว" 
          : isCod 
            ? "ชำระเงินปลายทางเมื่อได้รับสินค้า" 
            : isUploaded 
              ? "ได้รับสลิปแล้ว กำลังรอแอดมินยืนยันความถูกต้อง" 
              : "รอยืนยันยอดเงินโอน",
        active: isVerified || isCod,
        icon: <ClipboardCheck size={12} className={styles.stepIcon} />
      },
      {
        key: "preparing",
        label: "กำลังเตรียมพัสดุ",
        desc: (isVerified || isCod) && shipping === "processing"
          ? "แอดมินยืนยันรายการ และกำลังเร่งแพ็คสินค้าสุขภาพเพื่อเตรียมจัดส่ง"
          : (isVerified || isCod)
            ? "จัดเตรียมพัสดุเสร็จสิ้น"
            : "รอข้อมูลยืนยันชำระเงินก่อนจัดเตรียมพัสดุ",
        active: isVerified || isCod,
        icon: <Loader2 size={12} className={`${styles.stepIcon} ${shipping === "processing" && (isVerified || isCod) ? "animate-spin" : ""}`} />
      },
      {
        key: "shipped",
        label: "อยู่ระหว่างจัดส่ง",
        desc: shipping === "shipped" || shipping === "delivered"
          ? `จัดส่งพัสดุผ่าน ${order.shipping_carrier || "บริษัทขนส่ง"} แล้ว`
          : "รอพัสดุส่งมอบให้บริษัทขนส่ง",
        active: shipping === "shipped" || shipping === "delivered",
        icon: <Truck size={12} className={styles.stepIcon} />
      },
      {
        key: "delivered",
        label: "จัดส่งสำเร็จ",
        desc: shipping === "delivered" 
          ? "พัสดุถูกจัดส่งและถึงมือผู้รับเรียบร้อย นอนหลับฝันดีสุขภาพดีครับ! 💤" 
          : "รอยืนยันปลายทางพัสดุ",
        active: shipping === "delivered",
        icon: <CheckCircle2 size={12} className={styles.stepIcon} />
      }
    ];
  };

  return (
    <div className={styles.container}>
      <Header />

      <main className={styles.main}>
        {/* Back navigation button */}
        {singleOrder ? (
          <button 
            onClick={() => {
              setSingleOrder(null);
              // Clean URL orderId
              const url = new URL(window.location.href);
              url.searchParams.delete("orderId");
              window.history.pushState(null, "", url.pathname + url.search);
              if (ordersList.length === 0) {
                setSearchVal("");
              }
            }} 
            className={styles.backBtn}
            style={{ marginBottom: "1.5rem" }}
          >
            <ArrowLeft size={16} />
            <span>{ordersList.length > 0 ? "กลับไปที่ประวัติรายการสั่งซื้อ" : "ค้นหาคำสั่งซื้ออื่น / กลับหน้าค้นหา"}</span>
          </button>
        ) : (
          <Link href="/" className={styles.backBtn} style={{ textDecoration: "none", marginBottom: "1.5rem" }}>
            <ArrowLeft size={16} />
            <span>ย้อนกลับไปหน้าแรก</span>
          </Link>
        )}

        <div className={styles.titleArea}>
          <h1 className={styles.pageTitle}>ติดตามสถานะพัสดุ</h1>
          <p className={styles.pageSubtitle}>ตรวจเช็คสถานะการชำระเงิน และการจัดส่งคำสั่งซื้อหมอนสุขภาพของคุณ</p>
        </div>

        {/* Search Card Section */}
        <div className={styles.searchCard}>
          <div className={styles.searchTabs}>
            <button
              onClick={() => {
                setActiveTab("orderId");
                setSearchVal("");
                setError("");
              }}
              className={`${styles.tabBtn} ${activeTab === "orderId" ? styles.tabBtnActive : ""}`}
            >
              ค้นหาด้วยเลขคำสั่งซื้อ
            </button>
            <button
              onClick={() => {
                setActiveTab("phone");
                setSearchVal("");
                setError("");
              }}
              className={`${styles.tabBtn} ${activeTab === "phone" ? styles.tabBtnActive : ""}`}
            >
              ค้นหาด้วยเบอร์โทรศัพท์
            </button>
          </div>

          <form onSubmit={onSubmit} className={styles.searchForm}>
            <div className={styles.inputWrapper}>
              <input
                type="text"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                placeholder={
                  activeTab === "orderId"
                    ? "วางหรือระบุหมายเลขคำสั่งซื้อ (เช่น uuid-f4b9...)"
                    : "ระบุเบอร์โทรศัพท์ที่ใช้สั่งซื้อ (เช่น 0891234567)"
                }
                className={styles.inputField}
                disabled={loading}
                required
              />
            </div>
            <button type="submit" className={styles.submitBtn} disabled={loading || !searchVal.trim()}>
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>กำลังค้นหา...</span>
                </>
              ) : (
                <>
                  <Search size={16} />
                  <span>ค้นหา</span>
                </>
              )}
            </button>
          </form>

          {error && <div className={styles.errorPanel}>⚠️ {error}</div>}
        </div>

        {/* Loading Indicator for nested updates */}
        {loading && (
          <div className={styles.loaderZone}>
            <div className={styles.spinner}></div>
            <span className={styles.loadingText}>กำลังตรวจสอบข้อมูลสต็อกและการจัดส่ง...</span>
          </div>
        )}

        {/* Listing Orders (Search by Phone Mode, when no single order is chosen yet) */}
        {!loading && !singleOrder && activeTab === "phone" && ordersList.length > 0 && (
          <div className={styles.resultCard}>
            <h3 className={styles.resultsTitle}>พบประวัติคำสั่งซื้อทั้งหมด {ordersList.length} รายการ</h3>
            <div className={styles.ordersList}>
              {ordersList.map((order) => {
                // Get display name
                const itemName = order.items && order.items.length > 0
                  ? order.items.map(it => `${it.name} (${it.quantity} ชิ้น)`).join(", ")
                  : `${order.products?.name || "หมอนสุขภาพ"} (${order.quantity} ชิ้น)`;

                return (
                  <div key={order.id} onClick={() => selectOrderFromList(order)} className={styles.orderItemRow}>
                    <div className={styles.orderItemLeft}>
                      <span className={styles.orderItemTitle}>{itemName}</span>
                      <span className={styles.orderItemDate}>รหัสย่อ: ...{order.id.slice(-8)} • วันที่สั่ง: {formatDate(order.created_at)}</span>
                      <span className={styles.orderItemPrice}>ราคารวม: {order.total_amount.toLocaleString()} THB</span>
                    </div>
                    <div className={styles.orderItemRight}>
                      <span className={`${styles.badge} ${getShippingStatusBadgeClass(order.shipping_status)}`}>
                        {getShippingStatusText(order.shipping_status)}
                      </span>
                      <ArrowLeft size={16} style={{ transform: "rotate(180deg)", opacity: 0.5 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Detailed Single Order Timeline Screen */}
        {!loading && singleOrder && (
          <div className={styles.resultCard}>
            <div className={styles.resultHeader}>
              <div className={styles.orderMetaInfo}>
                <span className={styles.orderIdText}>คำสั่งซื้อ ID: ...{singleOrder.id.slice(-12)}</span>
                <span className={styles.orderDateText}>วันที่ทำรายการ: {formatDate(singleOrder.created_at)}</span>
              </div>
              <div className={styles.headerBadges}>
                <span className={`${styles.badge} ${getStatusBadgeClass(singleOrder.status)}`}>
                  {getStatusText(singleOrder.status)}
                </span>
                <span className={`${styles.badge} ${getShippingStatusBadgeClass(singleOrder.shipping_status)}`}>
                  {getShippingStatusText(singleOrder.shipping_status)}
                </span>
              </div>
            </div>

            {/* Cancelled Banner if status is rejected */}
            {singleOrder.status === "rejected" && (
              <div className={styles.errorPanel} style={{ marginBottom: "2rem", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.25rem", backgroundColor: "#fee2e2", borderColor: "#fca5a5", color: "#991b1b" }}>
                <span style={{ fontWeight: 800 }}>❌ คำสั่งซื้อนี้ถูกยกเลิกการดำเนินรายการ</span>
                <span style={{ fontSize: "0.8rem", fontWeight: 400 }}>หากคุณพบข้อผิดพลาดหรือต้องการข้อมูลเพิ่มเติม กรุณาติดต่อเพจแอดมินหรือไลน์ประสานงาน</span>
              </div>
            )}

            {/* Timeline Stepper */}
            <div className={styles.timeline}>
              {getTimelineSteps(singleOrder).map((step, idx) => (
                <div key={step.key} className={styles.timelineStep}>
                  <div className={`${styles.stepDot} ${step.active ? styles.stepDotActive : ""}`}>
                    {step.active ? <span style={{ color: "#fff", display: "flex" }}>✓</span> : null}
                  </div>
                  <span className={`${styles.stepLabel} ${step.active ? styles.stepLabelActive : ""}`}>
                    {step.label}
                  </span>
                  <p className={`${styles.stepDesc} ${step.active ? styles.stepDescActive : ""}`}>
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>

            {/* Shipping details (Carrier & Tracking Number) info box */}
            {(singleOrder.shipping_status === "shipped" || singleOrder.shipping_status === "delivered") && singleOrder.tracking_number && (
              <div className={styles.shippingInfoBlock}>
                <h4 className={styles.shippingInfoTitle}>ข้อมูลการจัดส่งพัสดุ</h4>
                <div className={styles.shippingInfoGrid}>
                  <div className={styles.shippingInfoItem}>
                    <span className={styles.shippingLabel}>ผู้ให้บริการขนส่ง</span>
                    <span className={styles.shippingValue}>{singleOrder.shipping_carrier || "จัดส่งพัสดุ"}</span>
                  </div>
                  <div className={styles.shippingInfoItem}>
                    <span className={styles.shippingLabel}>หมายเลขติดตามพัสดุ (Tracking No.)</span>
                    <div className={styles.trackingNumberRow}>
                      <span className={styles.shippingValue} style={{ color: "#1e3a8a", letterSpacing: "0.03em" }}>{singleOrder.tracking_number}</span>
                      <button onClick={() => handleCopyTracking(singleOrder.tracking_number!)} className={styles.copyBtn}>
                        <Copy size={12} />
                        <span>คัดลอก</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Direct Link Tracking Button */}
                {singleOrder.shipping_carrier && (
                  <a
                    href={getCarrierTrackingUrl(singleOrder.shipping_carrier, singleOrder.tracking_number)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.trackExternalBtn}
                    style={{ display: getCarrierTrackingUrl(singleOrder.shipping_carrier, singleOrder.tracking_number) ? "inline-flex" : "none" }}
                  >
                    <Truck size={14} />
                    <span>ไปหน้าเว็บติดตามพัสดุ ({singleOrder.shipping_carrier})</span>
                  </a>
                )}
              </div>
            )}

            {/* Items Summary zone */}
            <div className={styles.orderItemsBlock}>
              <h4 className={styles.blockTitle}>สรุปรายละเอียดสินค้า</h4>
              <div className={styles.itemsList}>
                {singleOrder.items && Array.isArray(singleOrder.items) && singleOrder.items.length > 0 ? (
                  singleOrder.items.map((item, idx) => (
                    <div key={item.product_id || idx} className={styles.productRow}>
                      <span className={styles.productName}>{item.name}</span>
                      <span className={styles.productQty}>{item.quantity} ชิ้น × {item.price.toLocaleString()} ฿</span>
                    </div>
                  ))
                ) : (
                  <div className={styles.productRow}>
                    <span className={styles.productName}>{singleOrder.products?.name || "หมอนสุขภาพ Crystal Dreams"}</span>
                    <span className={styles.productQty}>{singleOrder.quantity} ใบ</span>
                  </div>
                )}
              </div>
              <div className={styles.totalSummaryRow}>
                <span>ยอดชำระเงินทั้งหมด</span>
                <span>{singleOrder.total_amount.toLocaleString()} THB</span>
              </div>
            </div>

            {/* Client Privacy Note */}
            <div style={{ display: "flex", gap: "0.35rem", alignItems: "center", justifySelf: "center", marginTop: "2rem", opacity: 0.6, fontSize: "0.725rem", color: "#64748b" }}>
              <HelpCircle size={12} />
              <span>ข้อมูลลูกค้าบางส่วน (ที่อยู่, เบอร์โทร) ได้ถูกซ่อนไว้บางส่วนเพื่อความปลอดภัยด้านข้อมูล</span>
            </div>
          </div>
        )}
      </main>

      <Footer />
      <CartDrawer />
    </div>
  );
}

export default function TrackingPage() {
  return (
    <Suspense fallback={
      <div className={styles.container}>
        <Header />
        <main className={styles.main} style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
          <div className={styles.loaderZone}>
            <div className={styles.spinner}></div>
            <span>กำลังโหลดระบบติดตามพัสดุ...</span>
          </div>
        </main>
        <Footer />
        <CartDrawer />
      </div>
    }>
      <TrackingContent />
    </Suspense>
  );
}
