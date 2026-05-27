"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/utils/supabase";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import styles from "./slip.module.css";

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
      <div className={styles.loadingContainer}>
        <div className={styles.loadingWrapper}>
          <div className={styles.spinner}></div>
          <p className={styles.itemValue}>กำลังเตรียมหน้าส่งหลักฐาน...</p>
        </div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className={styles.errorOverlay}>
        <div className={styles.errorCard}>
          <div className={styles.errorIcon}>
            <span style={{ fontSize: '1.75rem' }}>⚠️</span>
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
      
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className={styles.main}>
        <div className={styles.backHeader}>
          <Link href="/" className={styles.backLinkBtn}>
            ← ย้อนกลับสู่หน้าแรก
          </Link>
        </div>
        
        <div className={styles.grid}>
          
          {/* Order Info Column */}
          <div className={styles.summaryColumn}>
            
            <div className={styles.summaryCard}>
              <h2 className={styles.summaryTitle}>
                สรุปรายการคำสั่งซื้อ
              </h2>
              
              <div className={styles.summaryItems}>
                <div>
                  <span className={styles.itemLabel}>Order ID</span>
                  <span className={styles.itemValue} style={{ fontFamily: 'monospace' }}>#{orderId}</span>
                </div>
                
                <div>
                  <span className={styles.itemLabel}>สินค้าที่สั่งซื้อ</span>
                  <span className={styles.itemValue}>{order?.products?.name}</span>
                </div>
                
                <div className={styles.totalRow}>
                  <div>
                    <span className={styles.itemLabel}>จำนวน</span>
                    <span className={styles.itemValue}>{order?.quantity} ใบ</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className={styles.itemLabel}>ยอดรวมทั้งสิ้น</span>
                    <span className={styles.totalValue}>
                      {order?.total_amount?.toLocaleString()} บาท
                    </span>
                  </div>
                </div>
              </div>
              
              <div className={styles.promptInfo}>
                📢 <strong>ยืนยันสลิปรวดเร็ว:</strong> ระบบจะใช้ AI ในการตรวจสอบสลิปโอนเงินทันทีที่กดยืนยัน หากถูกต้องสต็อกสินค้าจะถูกตัดและจัดเตรียมแพ็คสินค้าส่งให้ทันที
              </div>
            </div>
          </div>

          {/* Form & Upload Column */}
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

              {error && (
                <div className={styles.errorPanel}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className={styles.form}>
                
                {/* 1. Recipient details */}
                <div className={styles.recipientRow}>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>
                      ชื่อ-นามสกุล ผู้รับของ <span className={styles.inputLabelSpan}>*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="เช่น สมชาย ใจดี"
                      className={styles.inputField}
                      required
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>
                      เบอร์โทรศัพท์ผู้รับ <span className={styles.inputLabelSpan}>*</span>
                    </label>
                    <input
                      type="tel"
                      value={tel}
                      onChange={(e) => setTel(e.target.value)}
                      placeholder="เช่น 0891234567"
                      className={styles.inputField}
                      required
                    />
                  </div>
                </div>

                {/* 2. Detailed Address */}
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>
                    ที่อยู่สำหรับการจัดส่งโดยละเอียด <span className={styles.inputLabelSpan}>*</span>
                  </label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="บ้านเลขที่, หมู่บ้าน/อาคาร, ถนน, ซอย, ตำบล/แขวง, อำเภอ/เขต, จังหวัด, รหัสไปรษณีย์"
                    rows={4}
                    className={styles.textareaField}
                    required
                  />
                </div>

                {/* 3. Image Upload */}
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>
                    อัปโหลดรูปภาพสลิปโอนเงิน (สลิปโอนเงินสำเร็จ) <span className={styles.inputLabelSpan}>*</span>
                  </label>
                  
                  <div className={styles.uploadWrapper}>
                    {slipPreview ? (
                      <div className={styles.previewContainer}>
                        <Image 
                          src={slipPreview} 
                          alt="Receipt Preview" 
                          width={256}
                          height={256}
                          unoptimized
                          className={styles.previewImage}
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setSlipFile(null);
                            setSlipPreview("");
                          }}
                          className={styles.removeBtn}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className={styles.uploadIcon}>📸</span>
                        <p className={styles.uploadText}>
                          คลิกเลือก หรือ ลากรูปภาพสลิปมาวางที่นี่
                        </p>
                        <p className={styles.uploadSubtext}>
                          รองรับเฉพาะไฟล์รูปภาพ JPG, JPEG, PNG
                        </p>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className={styles.fileInput}
                      required={!slipFile}
                    />
                  </div>
                </div>

                {/* Submit Action Button */}
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

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default function SlipPage() {
  return (
    <Suspense fallback={
      <div className={styles.loadingContainer}>
        <div className={styles.loadingWrapper}>
          <div className={styles.spinner}></div>
          <p className={styles.itemLabel} style={{ fontWeight: 500 }}>กำลังเตรียมข้อมูลแบบฟอร์ม...</p>
        </div>
      </div>
    }>
      <SlipContent />
    </Suspense>
  );
}
