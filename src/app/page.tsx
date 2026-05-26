"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
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
  const [name, setName] = useState("");
  const [tel, setTel] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    setError("");

    if (!name.trim()) {
      setError("กรุณากรอกชื่อ-นามสกุลของคุณ");
      return;
    }
    if (!tel.trim() || tel.length < 9) {
      setError("กรุณากรอกเบอร์โทรศัพท์ที่ถูกต้อง (อย่างน้อย 9 หลัก)");
      return;
    }

    setSubmitting(true);

    try {
      // 1. Create order via Backend API
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product_id: product.id,
          quantity,
          customer_name: name,
          customer_tel: tel,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ");
      }

      // 2. Redirect to Payment (QR Code) Page
      router.push(`/payment?orderId=${data.orderId}`);
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
          <p className="text-slate-400 font-medium animate-pulse">กำลังโหลดข้อมูลร้านค้า...</p>
        </div>
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white p-4">
        <div className="bg-slate-900 border border-red-900/50 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="mx-auto w-16 h-16 bg-red-950/40 rounded-full flex items-center justify-center border border-red-500/20 mb-4">
            <span className="text-red-500 text-3xl">⚠️</span>
          </div>
          <h2 className="text-xl font-semibold mb-2">ไม่สามารถเชื่อมต่อฐานข้อมูลได้</h2>
          <p className="text-slate-400 text-sm mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-medium transition-all"
          >
            โหลดหน้าใหม่อีกครั้ง
          </button>
        </div>
      </div>
    );
  }

  const defaultImage = "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&q=80&w=800"; // Beautiful premium pillow image

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans selection:bg-indigo-500/30">
      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <span className="font-bold text-white text-lg">C</span>
            </div>
            <span className="font-semibold text-lg tracking-wide bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Crystal Dreams
            </span>
          </div>
          <div className="text-xs px-3 py-1.5 rounded-full bg-indigo-950/40 border border-indigo-500/30 text-indigo-400 font-medium">
            ✨ หมอนสุขภาพพรีเมียม
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-6xl mx-auto px-4 py-12 w-full flex items-center justify-center">
        <div className="grid md:grid-cols-12 gap-8 items-center w-full">
          {/* Product Image Section */}
          <div className="md:col-span-6 flex justify-center">
            <div className="relative group rounded-3xl overflow-hidden border border-slate-800 bg-slate-900/20 p-2 max-w-md w-full">
              <div className="relative aspect-square rounded-2xl overflow-hidden">
                <Image
                  src={product?.image_url || defaultImage}
                  alt={product?.name || "หมอนสุขภาพ Crystal Dreams"}
                  fill
                  sizes="(max-w-768px) 100vw, 50vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
                <div className="absolute bottom-6 left-6 right-6">
                  <span className="bg-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
                    Best Seller
                  </span>
                  <h2 className="text-2xl font-bold mt-2 text-white">
                    {product?.name}
                  </h2>
                </div>
              </div>
            </div>
          </div>

          {/* Checkout & Detail Section */}
          <div className="md:col-span-6 lg:pl-6">
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
                  {product?.name || "หมอนเพื่อสุขภาพ Crystal Dreams"}
                </h1>
                <div className="mt-3 flex items-baseline gap-4">
                  <span className="text-3xl font-bold text-indigo-400">
                    ฿{product?.price?.toLocaleString() || "1,890"}
                  </span>
                  <span className="text-slate-500 line-through text-sm">฿2,990</span>
                </div>
              </div>

              <div className="border-t border-b border-slate-800/80 py-4 space-y-2">
                <p className="text-slate-300 text-sm leading-relaxed">
                  สัมผัสประสบการณ์การนอนหลับที่สมบูรณ์แบบด้วยหมอนที่ออกแบบตามหลักสรีรศาสตร์ 
                  ช่วยรองรับต้นคอและไหล่ได้อย่างถูกต้อง ลดอาการปวดเมื่อย นอนหลับลึกตลอดคืน
                </p>
                <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium pt-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  สินค้าพร้อมส่ง (คงเหลือ {product?.stock} ใบ)
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-950/30 border border-red-500/20 rounded-2xl text-red-400 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Quantity Selector */}
                <div className="flex items-center justify-between bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
                  <div>
                    <span className="block text-sm font-semibold text-white">จำนวนสินค้า</span>
                    <span className="text-xs text-slate-400">จำกัดสต็อกชิ้นต่อการสั่งซื้อ</span>
                  </div>
                  <div className="flex items-center gap-4 bg-slate-950 border border-slate-800 rounded-xl p-1">
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(-1)}
                      disabled={quantity <= 1}
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-900 transition-colors disabled:opacity-40"
                    >
                      －
                    </button>
                    <span className="w-8 text-center font-bold text-lg text-white">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(1)}
                      disabled={!product || quantity >= product.stock}
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-900 transition-colors disabled:opacity-40"
                    >
                      ＋
                    </button>
                  </div>
                </div>

                {/* Customer Information Form */}
                <div className="space-y-4">
                  <div>
                    <label htmlFor="customer-name" className="block text-sm font-medium text-slate-300 mb-1.5">
                      ชื่อ-นามสกุล ผู้สั่งซื้อ <span className="text-indigo-400">*</span>
                    </label>
                    <input
                      type="text"
                      id="customer-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="เช่น สมชาย ใจดี"
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/50 transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="customer-tel" className="block text-sm font-medium text-slate-300 mb-1.5">
                      เบอร์โทรศัพท์ผู้ติดต่อ <span className="text-indigo-400">*</span>
                    </label>
                    <input
                      type="tel"
                      id="customer-tel"
                      value={tel}
                      onChange={(e) => setTel(e.target.value)}
                      placeholder="เช่น 0891234567"
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/50 transition-colors"
                      required
                    />
                  </div>
                </div>

                {/* Payment Submit Button */}
                <button
                  type="submit"
                  disabled={submitting || (product?.stock ?? 0) <= 0}
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 shadow-lg shadow-indigo-500/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {submitting ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      <span>กำลังสร้างคำสั่งซื้อ...</span>
                    </div>
                  ) : (
                    `ชำระเงิน • ฿${((product?.price || 1890) * quantity).toLocaleString()}`
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center md:flex md:justify-between md:text-left text-slate-500 text-sm">
          <p>© {new Date().getFullYear()} Crystal Dreams. All rights reserved.</p>
          <p className="mt-2 md:mt-0">ร้านค้าหมอนเพื่อสุขภาพพรีเมียม รับประกันความพึงพอใจ 100%</p>
        </div>
      </footer>
    </div>
  );
}
