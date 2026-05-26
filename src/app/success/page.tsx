"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/utils/supabase";

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
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-800">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-800 border-t-transparent"></div>
          <p className="text-slate-500 font-medium">กำลังโหลดข้อมูลความสำเร็จ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-800 flex flex-col justify-between font-sans selection:bg-blue-800/10">
      
      {/* Header */}
      <header className="border-b border-slate-200/80 bg-white/95 backdrop-blur-md sticky top-0 z-40 shadow-sm">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 flex items-center justify-center bg-white rounded-lg border border-slate-100 shadow-sm p-1">
              <div className="font-extrabold text-blue-800 text-xl tracking-tighter flex items-center select-none">
                <span>C</span>
                <span className="text-amber-500 text-lg">D</span>
                <span className="text-blue-800">M</span>
              </div>
            </div>
            <span className="font-extrabold text-lg tracking-tight text-blue-900 leading-none">
              ชำระเงินสำเร็จ
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="grow max-w-md mx-auto px-4 py-12 w-full flex items-center justify-center animate-premium-slide-up">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-lg text-center space-y-6 w-full">
          
          {/* Success Check Icon */}
          <div className="mx-auto w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center border-2 border-emerald-500/20 shadow-sm">
            <span className="text-emerald-500 text-4xl font-bold">✓</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-black text-blue-900">ได้รับข้อมูลเรียบร้อยแล้ว!</h1>
            <p className="text-sm text-slate-500 leading-relaxed">
              ขอบคุณสำหรับคำสั่งซื้อหมอนสุขภาพ Crystal Dreams ของคุณ ขณะนี้สลิปของท่านกำลังอยู่ในกระบวนการตรวจสอบ
            </p>
          </div>

          {/* Order Details box */}
          {order && (
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 text-left space-y-4">
              <div className="border-b border-slate-200/60 pb-3 flex justify-between items-center">
                <span className="text-xs font-bold text-blue-900 uppercase">ข้อมูลคำสั่งซื้อ</span>
                <span className="text-[11px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-extrabold">
                  รอตรวจสอบสลิป
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Order ID:</span>
                  <span className="font-mono text-slate-700 font-semibold">{order.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">สินค้า:</span>
                  <span className="text-slate-800 font-bold">{order.products?.name} x {order.quantity} ใบ</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">ยอดชำระ:</span>
                  <span className="text-blue-800 font-black text-sm">{order.total_amount?.toLocaleString()} บาท</span>
                </div>
              </div>

              <div className="border-t border-slate-200/60 pt-3 space-y-1.5 text-xs">
                <span className="text-xs font-bold text-blue-900 block">ข้อมูลที่อยู่จัดส่ง</span>
                <div>
                  <span className="text-slate-400">ชื่อผู้รับ:</span>
                  <span className="text-slate-800 font-semibold ml-1">{order.customer_name}</span>
                </div>
                <div>
                  <span className="text-slate-400">เบอร์โทรศัพท์:</span>
                  <span className="text-slate-800 font-semibold ml-1">{order.customer_tel}</span>
                </div>
                <div className="flex gap-1">
                  <span className="text-slate-400 shrink-0">ที่อยู่จัดส่ง:</span>
                  <span className="text-slate-700 leading-normal">{order.customer_address}</span>
                </div>
              </div>
            </div>
          )}

          {/* Time notice badge */}
          <div className="bg-amber-50 border border-amber-100/50 rounded-2xl p-4 text-xs text-amber-900 leading-relaxed text-left flex gap-2.5 items-start">
            <span className="text-base select-none">📦</span>
            <div>
              <strong className="block font-bold mb-0.5">ระยะเวลารอการยืนยัน:</strong>
              หลังจากตรวจสอบความถูกต้องของสลิปโอนเงินสำเร็จ (ปกติใช้เวลา 5-15 นาที) ระบบจะส่งออเดอร์ให้แผนกจัดส่งทันที และท่านจะได้รับสินค้าภายใน 1-3 วันทำการ
            </div>
          </div>

          {/* Home Link button */}
          <Link
            href="/"
            className="block w-full py-4 bg-linear-to-r from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-950 text-white font-extrabold rounded-2xl transition-all shadow-md text-sm"
          >
            กลับสู่หน้าหลัก
          </Link>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="max-w-md mx-auto px-4 text-center text-slate-400 text-[10px]">
          <p>© Crystal Dreams. หากมีข้อสงสัยติดต่อสอบถามฝ่ายบริการลูกค้าได้ตลอด 24 ชั่วโมง</p>
        </div>
      </footer>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-800">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-800 border-t-transparent"></div>
          <p className="text-slate-400 font-medium">กำลังเตรียมข้อมูลหน้าร้านค้า...</p>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
