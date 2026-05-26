"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/utils/supabase";

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  image_url: string | null;
}

export default function Home() {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-800">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-800 border-t-transparent"></div>
          <p className="text-slate-500 font-medium animate-pulse">กำลังโหลดข้อมูลร้านค้า...</p>
        </div>
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-800 p-4">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-md w-full text-center shadow-xl">
          <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center border border-red-200 mb-4">
            <span className="text-red-500 text-3xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">เกิดข้อผิดพลาดในการโหลดระบบ</h2>
          <p className="text-slate-500 text-sm mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="w-full py-3 px-6 bg-blue-800 hover:bg-blue-700 text-white rounded-xl font-medium transition-all shadow-md"
          >
            ลองใหม่อีกครั้ง
          </button>
        </div>
      </div>
    );
  }

  const defaultImage = "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&q=80&w=800";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between font-sans selection:bg-blue-800/10 transition-colors duration-350">
      
      {/* Header */}
      <header className="border-b border-slate-200/80 bg-white/95 backdrop-blur-md sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 cursor-pointer group hover:opacity-90 transition-opacity">
            {/* Logo matching the provided CDM logo */}
            <div className="relative w-10 h-10 flex items-center justify-center bg-white rounded-lg border border-slate-100 shadow-sm p-1 overflow-hidden">
              {/* Minimal geometric representations of CDM in blue and gold */}
              <div className="font-extrabold text-blue-800 text-xl tracking-tighter flex items-center select-none">
                <span>C</span>
                <span className="text-amber-500 text-lg">D</span>
                <span className="text-blue-800">M</span>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-tight text-blue-900 leading-none">
                CRYSTAL DREAMS
              </span>
              <span className="text-[10px] font-bold text-amber-500 tracking-widest mt-0.5">
                HEALTHY PILLOW
              </span>
            </div>
          </Link>
          <div className="text-xs px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-800 font-bold">
            ✨ รับประกันของแท้ 100%
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="grow max-w-6xl mx-auto px-4 py-12 w-full flex items-center justify-center animate-premium-slide-up">
        <div className="grid md:grid-cols-12 gap-10 items-center w-full">
          
          {/* Product Image Section */}
          <div className="md:col-span-5 flex justify-center w-full">
            <div className="relative group rounded-3xl overflow-hidden border border-slate-200 bg-white p-2.5 max-w-lg w-full shadow-lg transition-transform duration-500 hover:shadow-xl">
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100">
                <Image
                  src={product?.image_url || defaultImage}
                  alt={product?.name || "หมอนสุขภาพ Crystal Dreams"}
                  fill
                  sizes="(max-w-768px) 100vw, 50vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  priority
                />
                <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-slate-900/60 to-transparent h-1/3 opacity-80" />
                <div className="absolute bottom-6 left-6 right-6">
                  <span className="bg-amber-400 text-blue-950 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                    Premium Quality
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Checkout & Detail Section */}
          <div className="md:col-span-7 lg:pl-6 space-y-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-blue-900 leading-tight md:whitespace-nowrap">
                {product?.name || "หมอนเพื่อสุขภาพ Crystal Dreams"}
              </h1>
              <div className="mt-4 flex items-baseline gap-4">
                <span className="text-4xl font-black text-blue-800">
                  {product?.price?.toLocaleString() || "1,890"} บาท
                </span>
                <span className="text-xs text-slate-650 bg-slate-100 border border-slate-200/60 px-2.5 py-1 rounded-md font-semibold">
                  จัดส่งฟรีทั่วประเทศ
                </span>
              </div>
            </div>

            <div className="border-t border-b border-slate-200/80 py-5 space-y-3">
              <p className="text-slate-600 text-sm leading-relaxed">
                สัมผัสมิติใหม่แห่งการพักผ่อนด้วย <strong className="text-slate-800">หมอนเพื่อสุขภาพ Crystal Dreams</strong> 
                ที่ออกแบบตามหลักสรีรศาสตร์อย่างสมบูรณ์แบบ ช่วยรองรับช่วงต้นคอและบ่าไหล่ได้อย่างพอเหมาะ 
                กระจายแรงกดทับได้อย่างดีเยี่ยม ลดอาการปวดเมื่อยหลังตื่นนอน และช่วยให้คุณหลับลึก สดชื่นตลอดคืน
              </p>
              
              <div className="flex flex-wrap gap-4 pt-2">
                <div className="flex items-center gap-2 text-xs text-emerald-600 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  สินค้าพร้อมส่ง (ในสต็อกคงเหลือ {product?.stock} ใบ)
                </div>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm font-medium">
                {error}
              </div>
            )}

            <div className="space-y-6">
              {/* Quantity Selector */}
              <div className="flex items-center justify-between bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
                <div>
                  <span className="block text-sm font-bold text-blue-900">จำนวนที่ต้องการสั่งซื้อ</span>
                  <span className="text-xs text-slate-400">เลือกจำนวนสินค้าที่ต้องการ</span>
                </div>
                <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-xl p-1">
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1 || submitting}
                    className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-slate-500 hover:text-blue-900 hover:bg-white hover:shadow-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    －
                  </button>
                  <span className="w-8 text-center font-extrabold text-lg text-blue-900">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(1)}
                    disabled={!product || quantity >= product.stock || submitting}
                    className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-slate-500 hover:text-blue-900 hover:bg-white hover:shadow-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    ＋
                  </button>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={handlePayment}
                disabled={submitting || (product?.stock ?? 0) <= 0}
                className="w-full bg-linear-to-r from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-950 text-white font-extrabold py-4 px-6 rounded-2xl transition-all duration-300 shadow-md shadow-blue-800/10 hover:shadow-lg hover:shadow-blue-800/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {submitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    <span>กำลังสร้างรายการคำสั่งซื้อ...</span>
                  </div>
                ) : (
                  `ชำระเงิน • ${((product?.price || 1890) * quantity).toLocaleString()} บาท`
                )}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* QR Code Modal (Popup) */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full border border-slate-100 shadow-2xl space-y-6 relative overflow-hidden animate-scale-up">
            
            {/* Header / Brand */}
            <div className="text-center space-y-1">
              <div className="font-extrabold text-blue-900 text-lg tracking-tight">
                CRYSTAL DREAMS
              </div>
              <p className="text-xs text-slate-400">กรุณาสแกนคิวอาร์โค้ดเพื่อชำระเงิน</p>
            </div>

            {/* Total Amount Box */}
            <div className="bg-blue-50/50 border border-blue-100/50 rounded-2xl py-4 px-6 text-center space-y-1">
              <span className="text-xs text-slate-500 font-semibold block">ยอดชำระเงินรวมทั้งสิ้น</span>
              <span className="text-3xl font-black text-blue-800">
                {totalAmount.toLocaleString()} บาท
              </span>
              <span className="text-[10px] text-slate-500 font-bold block">
                จำนวน {quantity} ชิ้น
              </span>
            </div>

            {/* QR Code display */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col items-center justify-center shadow-sm relative">
              {loadingQr ? (
                <div className="h-64 flex flex-col items-center justify-center gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-3 border-blue-800 border-t-transparent"></div>
                  <p className="text-xs text-slate-400 font-medium">กำลังเจเนอเรต QR Code...</p>
                </div>
              ) : qrCodeDataUrl ? (
                <>
                  {/* Thai QR Logo Banner */}
                  <div className="w-full flex justify-between items-center border-b border-slate-100 pb-2.5 mb-3.5">
                    <div className="text-slate-800 font-extrabold tracking-tighter text-xs flex items-center gap-0.5">
                      <span className="text-blue-800">Thai</span>
                      <span className="text-amber-500">QR</span>
                      <span className="text-slate-700">Payment</span>
                    </div>
                    <span className="text-[9px] text-slate-400 font-extrabold border border-slate-200 px-1.5 py-0.5 rounded-md">
                      PROMPTPAY
                    </span>
                  </div>

                  <div className="relative w-56 h-56 bg-white p-2.5 rounded-2xl border border-slate-100">
                    <Image
                      src={qrCodeDataUrl}
                      alt="PromptPay QR Code"
                      width={224}
                      height={224}
                      unoptimized
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <p className="text-[10px] text-slate-450 font-bold text-center mt-3">
                    สแกน QR เพื่อโอนเงินเข้าพร้อมเพย์ของร้านค้า
                  </p>
                </>
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <p className="text-xs text-red-500 font-medium">ไม่สามารถโหลดคิวอาร์โค้ดได้</p>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="space-y-3 pt-2">
              {qrCodeDataUrl && (
                <a
                  href={qrCodeDataUrl}
                  download={`crystaldreams-qr-${createdOrderId.slice(0, 8)}.png`}
                  className="w-full py-3 border border-slate-200 hover:border-slate-300 bg-slate-50 text-slate-700 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-sm shadow-sm"
                >
                  📥 ดาวน์โหลดรูปภาพ QR Code
                </a>
              )}

              <button
                onClick={proceedToUploadSlip}
                className="w-full py-4 bg-linear-to-r from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-950 text-white font-extrabold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 text-sm"
              >
                <span>ฉันโอนเงินเรียบร้อยแล้ว ไปแนบสลิป</span>
                <span>➔</span>
              </button>

              <button
                onClick={() => setShowQrModal(false)}
                className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition-all text-sm text-center"
              >
                ยกเลิกชำระเงิน
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-8">
        <div className="max-w-6xl mx-auto px-4 text-center md:flex md:justify-between md:text-left text-slate-450 text-xs">
          <p>© {new Date().getFullYear()} Crystal Dreams. All rights reserved.</p>
          <div className="mt-2 md:mt-0 flex justify-center gap-4">
            <span className="hover:text-blue-900 transition-colors">รับประกันความพึงพอใจ</span>
            <span>•</span>
            <span className="hover:text-blue-900 transition-colors">ส่งไว 1-3 วัน</span>
          </div>
        </div>
      </footer>

      {/* Simple Inline Animation Helpers */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fade-in {
          animation: fadeIn 0.25s ease-out forwards;
        }
        .animate-scale-up {
          animation: scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>
    </div>
  );
}
