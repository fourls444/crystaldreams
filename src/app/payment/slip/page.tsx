"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/utils/supabase";

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

      // Call upload API endpoint
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.error || "เกิดข้อผิดพลาดในการอัปโหลดหลักฐาน");
      }

      // Trigger verify API in the background (Async execution)
      fetch(`/api/orders/${orderId}/verify`, { method: "POST" }).catch(console.error);

      // Redirect to Success Page
      router.push(`/success?orderId=${orderId}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการบันทึกข้อมูล";
      setError(message);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-800">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-800 border-t-transparent"></div>
          <p className="text-slate-500 font-medium">กำลังเตรียมหน้าส่งหลักฐาน...</p>
        </div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-800 p-4">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-md w-full text-center shadow-xl">
          <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center border border-red-200 mb-4">
            <span className="text-red-500 text-3xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">เกิดข้อผิดพลาด</h2>
          <p className="text-slate-500 text-sm mb-6">{error}</p>
          <Link 
            href="/"
            className="block w-full py-3 px-6 bg-blue-800 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all text-center shadow-md"
          >
            กลับสู่หน้าหลัก
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-800 flex flex-col justify-between font-sans selection:bg-blue-800/10">
      
      {/* Header */}
      <header className="border-b border-slate-200/80 bg-white/95 backdrop-blur-md sticky top-0 z-40 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 cursor-pointer group hover:opacity-90 transition-opacity">
            <div className="relative w-10 h-10 flex items-center justify-center bg-white rounded-lg border border-slate-100 shadow-sm p-1">
              <div className="font-extrabold text-blue-800 text-xl tracking-tighter flex items-center select-none">
                <span>C</span>
                <span className="text-amber-500 text-lg">D</span>
                <span className="text-blue-800">M</span>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-tight text-blue-900 leading-none">
                แจ้งชำระเงิน
              </span>
              <span className="text-[10px] font-bold text-amber-500 tracking-wider mt-0.5">
                SHIPPING DETAILS
              </span>
            </div>
          </Link>
          <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md">
            Order: #{orderId?.slice(0, 8)}
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="grow max-w-4xl mx-auto px-4 py-12 w-full animate-premium-slide-up">
        <div className="grid md:grid-cols-12 gap-8 items-start">
          
          {/* Order Info Column */}
          <div className="md:col-span-4 space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-md space-y-4">
              <h2 className="text-sm font-bold text-blue-900 uppercase tracking-wider border-b border-slate-100 pb-3">
                สรุปรายการคำสั่งซื้อ
              </h2>
              
              <div className="space-y-3">
                <div>
                  <span className="text-xs text-slate-400 block">สินค้าที่สั่งซื้อ</span>
                  <span className="text-sm font-bold text-slate-800">{order?.products?.name}</span>
                </div>
                
                <div className="flex justify-between border-t border-slate-50 pt-3">
                  <div>
                    <span className="text-xs text-slate-400 block">จำนวน</span>
                    <span className="text-sm font-bold text-slate-800">{order?.quantity} ใบ</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">ยอดรวมทั้งสิ้น</span>
                    <span className="text-base font-extrabold text-blue-800">
                      {order?.total_amount?.toLocaleString()} บาท
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="bg-amber-50/50 border border-amber-100/50 rounded-2xl p-4 text-xs text-slate-600 leading-relaxed">
                📢 <strong>ยืนยันสลิปรวดเร็ว:</strong> ระบบจะใช้ AI ในการตรวจสอบสลิปโอนเงินทันทีที่กดยืนยัน หากถูกต้องสต็อกสินค้าจะถูกตัดและจัดเตรียมแพ็คสินค้าส่งให้ทันที
              </div>
            </div>
          </div>

          {/* Form & Upload Column */}
          <div className="md:col-span-8">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-md space-y-6">
              
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-bold text-blue-900">
                  กรอกที่อยู่จัดส่งและแนบสลิป
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  กรุณากรอกข้อมูลผู้รับของจริงเพื่อความแม่นยำในการจัดส่ง
                </p>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm font-medium">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* 1. Recipient details */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-blue-900 mb-1.5 uppercase">
                      ชื่อ-นามสกุล ผู้รับของ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="เช่น สมชาย ใจดี"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-800/80 focus:bg-white transition-all text-sm shadow-inner"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-blue-900 mb-1.5 uppercase">
                      เบอร์โทรศัพท์ผู้รับ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={tel}
                      onChange={(e) => setTel(e.target.value)}
                      placeholder="เช่น 0891234567"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-800/80 focus:bg-white transition-all text-sm shadow-inner"
                      required
                    />
                  </div>
                </div>

                {/* 2. Detailed Address */}
                <div>
                  <label className="block text-xs font-bold text-blue-900 mb-1.5 uppercase">
                    ที่อยู่สำหรับการจัดส่งโดยละเอียด <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="บ้านเลขที่, หมู่บ้าน/อาคาร, ถนน, ซอย, ตำบล/แขวง, อำเภอ/เขต, จังหวัด, รหัสไปรษณีย์"
                    rows={4}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-800/80 focus:bg-white transition-all text-sm shadow-inner resize-none"
                    required
                  />
                </div>

                {/* 3. Image Upload */}
                <div className="space-y-2.5">
                  <label className="block text-xs font-bold text-blue-900 uppercase">
                    อัปโหลดรูปภาพสลิปโอนเงิน (สลิปโอนเงินสำเร็จ) <span className="text-red-500">*</span>
                  </label>
                  
                  <div className="group relative border-2 border-dashed border-slate-200 hover:border-blue-800/40 bg-slate-50 hover:bg-slate-100/50 rounded-2xl p-4 transition-all flex flex-col items-center justify-center min-h-45 cursor-pointer shadow-inner">
                    {slipPreview ? (
                      <div className="relative w-full max-h-72 flex flex-col items-center py-2">
                        <Image 
                          src={slipPreview} 
                          alt="Receipt Preview" 
                          width={256}
                          height={256}
                          unoptimized
                          className="max-h-64 rounded-xl object-contain border border-slate-200 shadow-md bg-white"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setSlipFile(null);
                            setSlipPreview("");
                          }}
                          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-slate-900/80 hover:bg-slate-950 text-white flex items-center justify-center text-xs font-bold shadow-md transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="text-4xl mb-2 text-slate-400 group-hover:scale-105 transition-transform duration-300">📸</span>
                        <p className="text-sm font-bold text-slate-700 text-center">
                          คลิกเลือก หรือ ลากรูปภาพสลิปมาวางที่นี่
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          รองรับเฉพาะไฟล์รูปภาพ JPG, JPEG, PNG
                        </p>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      required={!slipFile}
                    />
                  </div>
                </div>

                  {/* Submit Action Button */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-linear-to-r from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-950 text-white font-extrabold py-4 px-6 rounded-2xl transition-all duration-300 shadow-md shadow-blue-800/10 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                  {submitting ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
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

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="max-w-4xl mx-auto px-4 text-center text-slate-400 text-xs">
          <p>© Crystal Dreams. ข้อมูลที่อยู่จัดส่งและสลิปการทำธุรกรรมของท่านจะได้รับความปลอดภัยสูงสุด</p>
        </div>
      </footer>
    </div>
  );
}

export default function SlipPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-800">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-800 border-t-transparent"></div>
          <p className="text-slate-400 font-medium">กำลังเตรียมข้อมูลแบบฟอร์ม...</p>
        </div>
      </div>
    }>
      <SlipContent />
    </Suspense>
  );
}
