"use client";

import { useState } from "react";
import { CreditCard, HelpCircle, AlertTriangle, Eye, RefreshCw } from "lucide-react";
import Swal from "sweetalert2";

interface PromptPaySettingsProps {
  promptpayNumber: string;
  setPromptpayNumber: (val: string) => void;
  promptpayRef1: string;
  setPromptpayRef1: (val: string) => void;
  promptpayRef2: string;
  setPromptpayRef2: (val: string) => void;
  styles: any;
}

export default function PromptPaySettings({
  promptpayNumber,
  setPromptpayNumber,
  promptpayRef1,
  setPromptpayRef1,
  promptpayRef2,
  setPromptpayRef2,
  styles,
}: PromptPaySettingsProps) {
  const [previewLoading, setPreviewLoading] = useState(false);
  const [qrPreviewUrl, setQrPreviewUrl] = useState<string | null>(null);

  const cleanNum = promptpayNumber.replace(/[^0-9]/g, "");
  let numType = "ยังไม่ได้ระบุ";
  if (cleanNum.length === 10) numType = "เบอร์โทรศัพท์มือถือ (MSISDN - Tag 29)";
  else if (cleanNum.length === 13) numType = "เลขบัตรประชาชน/เลขผู้เสียภาษี (NATID - Tag 29)";
  else if (cleanNum.length === 15) numType = "Biller ID / K-SHOP (Bill Payment - Tag 30)";

  const isBillPayment = cleanNum.length === 15;

  const handleGeneratePreview = async () => {
    const cleanNumber = promptpayNumber.replace(/[^0-9]/g, "");
    if (![10, 13, 15].includes(cleanNumber.length)) {
      Swal.fire({
        icon: "warning",
        title: "หมายเลขไม่ถูกต้อง",
        text: "กรุณากรอกหมายเลขพร้อมเพย์ให้ถูกต้อง (เบอร์โทร 10 หลัก, เลขบัตร 13 หลัก หรือ Biller ID 15 หลัก)",
        confirmButtonColor: "#1e3a8a",
      });
      return;
    }

    setPreviewLoading(true);
    setQrPreviewUrl(null);
    try {
      const res = await fetch("/api/payment/qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: 1,
          billerId: cleanNumber,
          ref1: promptpayRef1.trim() || undefined,
          ref2: promptpayRef2.trim() || undefined,
          orderId: "PREVIEW12345",
        }),
      });

      const data = await res.json();
      if (data.success && data.qrDataUrl) {
        setQrPreviewUrl(data.qrDataUrl);
      } else {
        throw new Error(data.error || "Failed to generate QR");
      }
    } catch (err: any) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "สร้างตัวอย่าง QR Code ล้มเหลว",
        html: `
          <div style="text-align: left; font-size: 0.9rem; line-height: 1.6;">
            <p style="color: #ef4444; font-weight: 600; margin-bottom: 0.5rem;">เกิดข้อผิดพลาด: ${err.message || "ไม่สามารถเชื่อมต่อ API ได้"}</p>
            <strong style="display: block; margin-top: 0.75rem; color: #1e293b;">คำแนะนำในการแก้ไข:</strong>
            <ul style="padding-left: 1.25rem; margin-top: 0.25rem; margin-bottom: 0;">
              <li>ตรวจสอบว่าหมายเลขพร้อมเพย์/Biller ID มีเฉพาะตัวเลขและมีความยาวถูกต้อง (10, 13 หรือ 15 หลัก)</li>
              <li>ตรวจสอบว่าเซิร์ฟเวอร์ยังทำงานอยู่ปกติ และอินเทอร์เน็ตไม่ได้หลุด</li>
              <li>หากปุ่มยังใช้ไม่ได้ ให้ลองรีเฟรชหน้าเว็บแล้วกดใหม่อีกครั้ง</li>
              <li>ตรวจสอบหน้าต่าง Console ของเบราว์เซอร์เพื่อดูข้อผิดพลาดที่เกิดขึ้นจริง</li>
            </ul>
          </div>
        `,
        confirmButtonColor: "#1e3a8a",
      });
    } finally {
      setPreviewLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div
        style={{
          background: "#ffffff",
          borderRadius: "1rem",
          padding: "2rem",
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "1rem" }}>
          <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "0.5rem", backgroundColor: "#eff6ff", color: "#1e3a8a", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center" }}>
            <CreditCard size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>บัญชีพร้อมเพย์รับเงินหลัก (PromptPay Settings)</h3>
            <p style={{ fontSize: "0.8rem", color: "#64748b", margin: 0 }}>กำหนดหมายเลขบัญชีรับเงินของร้านค้า สำหรับสร้าง QR Code ให้ลูกค้าแสกนชำระเงินอัตโนมัติ</p>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div>
            <label
              htmlFor="promptpay_number_input"
              style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.5rem" }}
            >
              หมายเลขพร้อมเพย์ หรือ Biller ID *
            </label>
            <input
              id="promptpay_number_input"
              type="text"
              placeholder="เช่น 0891234567 หรือ 010753600031501"
              value={promptpayNumber}
              onChange={(e) => setPromptpayNumber(e.target.value.replace(/[^0-9]/g, ""))}
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                borderRadius: "0.5rem",
                border: "1px solid #cbd5e1",
                fontSize: "1rem",
                fontWeight: 500,
                outline: "none",
                fontFamily: "monospace",
                transition: "border-color 0.2s",
              }}
              required
            />
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", marginTop: "0.5rem", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                ประเภทที่ตรวจพบ: <strong>{cleanNum.length}</strong> หลัก ({numType})
              </span>

              <span style={{ fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.25rem", color: "#0284c7" }}>
                <HelpCircle size={12} />
                รองรับ: เบอร์มือถือ 10 หลัก, เลขบัตรปชช./ผู้เสียภาษี 13 หลัก, Biller ID (K-SHOP) 15 หลัก
              </span>
            </div>
          </div>

          {/* Input for Ref 1 */}
          <div>
            <div style={{ display: "flex", alignItems: "center", marginBottom: "0.5rem" }}>
              <label
                htmlFor="promptpay_ref1_input"
                style={{ fontSize: "0.875rem", fontWeight: 600, color: isBillPayment ? "#334155" : "#94a3b8" }}
              >
                ค่าอ้างอิง Ref 1 (Reference 1)
              </label>
              {isBillPayment ? (
                <span style={{ fontSize: "0.7rem", color: "#166534", backgroundColor: "#dcfce7", padding: "0.15rem 0.5rem", borderRadius: "9999px", marginLeft: "0.5rem", fontWeight: 600 }}>
                  เปิดใช้งาน (สำหรับ Biller ID)
                </span>
              ) : (
                <span style={{ fontSize: "0.7rem", color: "#475569", backgroundColor: "#f1f5f9", padding: "0.15rem 0.5rem", borderRadius: "9999px", marginLeft: "0.5rem", fontWeight: 500 }}>
                  ไม่ใช้งานสำหรับพร้อมเพย์ประเภทนี้
                </span>
              )}
            </div>
            <input
              id="promptpay_ref1_input"
              type="text"
              placeholder={isBillPayment ? "เช่น KB000002206840 (เว้นว่างไว้เพื่อสุ่มเลข/ใช้เลขออเดอร์)" : "ระบบจะไม่นำค่านี้ไปใช้งานกับพร้อมเพย์ 10/13 หลัก"}
              value={promptpayRef1}
              onChange={(e) => setPromptpayRef1(e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase())}
              disabled={!isBillPayment}
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                borderRadius: "0.5rem",
                border: "1px solid #cbd5e1",
                fontSize: "1rem",
                fontWeight: 500,
                outline: "none",
                fontFamily: "monospace",
                transition: "all 0.2s",
                backgroundColor: isBillPayment ? "#ffffff" : "#f8fafc",
                borderColor: isBillPayment ? "#cbd5e1" : "#e2e8f0",
                color: isBillPayment ? "#0f172a" : "#94a3b8",
                cursor: isBillPayment ? "text" : "not-allowed",
              }}
            />
            <p style={{ fontSize: "0.75rem", color: isBillPayment ? "#64748b" : "#94a3b8", marginTop: "0.25rem" }}>
              💡 <strong>ข้อแนะนำ:</strong> แนะนำให้ปล่อยเป็นค่าว่าง เพื่อให้ระบบนำเลขที่ใบสั่งซื้อ (Order ID) มาสร้างเป็น Ref 1 อัตโนมัติในตอนที่ลูกค้ากดชำระเงิน ซึ่งจะช่วยให้ง่ายต่อการตรวจสลิปแต่ละรายการ
            </p>
          </div>

          {/* Input for Ref 2 */}
          <div>
            <div style={{ display: "flex", alignItems: "center", marginBottom: "0.5rem" }}>
              <label
                htmlFor="promptpay_ref2_input"
                style={{ fontSize: "0.875rem", fontWeight: 600, color: isBillPayment ? "#334155" : "#94a3b8" }}
              >
                ค่าอ้างอิง Ref 2 (Reference 2)
              </label>
              {isBillPayment ? (
                <span style={{ fontSize: "0.7rem", color: "#166534", backgroundColor: "#dcfce7", padding: "0.15rem 0.5rem", borderRadius: "9999px", marginLeft: "0.5rem", fontWeight: 600 }}>
                  เปิดใช้งาน (สำหรับ Biller ID)
                </span>
              ) : (
                <span style={{ fontSize: "0.7rem", color: "#475569", backgroundColor: "#f1f5f9", padding: "0.15rem 0.5rem", borderRadius: "9999px", marginLeft: "0.5rem", fontWeight: 500 }}>
                  ไม่ใช้งานสำหรับพร้อมเพย์ประเภทนี้
                </span>
              )}
            </div>
            <input
              id="promptpay_ref2_input"
              type="text"
              placeholder={isBillPayment ? "ระบุค่าคงที่ หรือปล่อยว่างหากไม่ใช้งาน" : "ระบบจะไม่นำค่านี้ไปใช้งานกับพร้อมเพย์ 10/13 หลัก"}
              value={promptpayRef2}
              onChange={(e) => setPromptpayRef2(e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase())}
              disabled={!isBillPayment}
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                borderRadius: "0.5rem",
                border: "1px solid #cbd5e1",
                fontSize: "1rem",
                fontWeight: 500,
                outline: "none",
                fontFamily: "monospace",
                transition: "all 0.2s",
                backgroundColor: isBillPayment ? "#ffffff" : "#f8fafc",
                borderColor: isBillPayment ? "#cbd5e1" : "#e2e8f0",
                color: isBillPayment ? "#0f172a" : "#94a3b8",
                cursor: isBillPayment ? "text" : "not-allowed",
              }}
            />
            <p style={{ fontSize: "0.75rem", color: isBillPayment ? "#64748b" : "#94a3b8", marginTop: "0.25rem" }}>
              สามารถกำหนดรหัสอ้างอิงลำดับที่สองได้หากธนาคารต้องการ (เช่น รหัสสาขา หรือรหัสสินค้า) หรือปล่อยว่างไว้หากไม่มีความจำเป็น
            </p>
          </div>

          {/* Warning Alert */}
          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              padding: "1.25rem",
              backgroundColor: "#fffbeb",
              border: "1px solid #fef3c7",
              borderRadius: "0.5rem",
              color: "#b45309",
              fontSize: "0.875rem",
              lineHeight: "1.5",
            }}
          >
            <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: "0.1rem" }} />
            <div>
              <strong style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.9rem" }}>ข้อควรระวังสำคัญ!</strong>
              กรุณาตรวจสอบความถูกต้องของตัวเลขบัญชีพร้อมเพย์/Biller ID อย่างละเอียดก่อนกดบันทึก หากระบุเลขผิดพลาด ลูกค้าจะไม่สามารถสแกนชำระเงินได้ หรือเงินอาจโอนไปผิดบัญชี
            </div>
          </div>
        </div>

        {/* PromptPay specific action */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "2rem", borderTop: "1px solid #f1f5f9", paddingTop: "1.25rem" }}>
          <button
            type="button"
            onClick={handleGeneratePreview}
            className={styles.cancelFormBtn}
            style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem 1.25rem" }}
            disabled={previewLoading || !cleanNum}
          >
            {previewLoading ? <RefreshCw className={styles.spinIcon} size={16} /> : <Eye size={16} />}
            <span>ทดสอบสแกน QR Code</span>
          </button>
        </div>
      </div>

      {/* Live Preview Section */}
      {qrPreviewUrl && (
        <div
          style={{
            background: "#ffffff",
            borderRadius: "1rem",
            padding: "2rem",
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
          }}
        >
          <h4 style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.25rem" }}>ตัวอย่างการแสดงผลฝั่งลูกค้า (Live Preview)</h4>
          <p style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "1.5rem" }}>จำลอง QR Code ยอดเงิน 1.00 บาท สำหรับใช้ตรวจสอบการสร้างข้อมูล</p>

          <div
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: "1rem",
              padding: "1.5rem",
              backgroundColor: "#ffffff",
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05)",
              maxWidth: "280px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", alignItems: "center", marginBottom: "1rem" }}>
              <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#ffffff", backgroundColor: "#1e3a8a", padding: "0.15rem 0.5rem", borderRadius: "9999px" }}>
                {isBillPayment ? "BILL PAYMENT" : "PROMPTPAY"}
              </span>
              <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#1e3a8a", border: "1px solid #1e3a8a", padding: "0.125rem 0.45rem", borderRadius: "9999px" }}>THB 1.00</span>
            </div>

            <img
              src={qrPreviewUrl}
              alt="PromptPay Live Preview"
              style={{ width: "200px", height: "200px", objectFit: "contain", display: "block" }}
            />

            <div style={{ fontSize: "0.7rem", color: "#94a3b8", marginTop: "1rem", marginBottom: 0, fontFamily: "monospace", wordBreak: "break-all", textAlign: "center" }}>
              {isBillPayment ? (
                <>
                  <strong style={{ color: "#475569" }}>Biller ID:</strong> {cleanNum}
                  {promptpayRef1.trim() ? (
                    <span style={{ display: "block" }}><strong style={{ color: "#475569" }}>Ref 1:</strong> {promptpayRef1.trim()}</span>
                  ) : (
                    <span style={{ display: "block", color: "#94a3b8", fontStyle: "italic" }}><strong style={{ color: "#475569" }}>Ref 1:</strong> (ดึงหมายเลขออเดอร์อัตโนมัติ)</span>
                  )}
                  {promptpayRef2.trim() && (
                    <span style={{ display: "block" }}><strong style={{ color: "#475569" }}>Ref 2:</strong> {promptpayRef2.trim()}</span>
                  )}
                </>
              ) : (
                <>
                  <strong style={{ color: "#475569" }}>PromptPay:</strong> {cleanNum.length === 10 ? `${cleanNum.slice(0, 3)}-${cleanNum.slice(3, 7)}-${cleanNum.slice(7)}` : cleanNum}
                </>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setQrPreviewUrl(null)}
            className={styles.cancelFormBtn}
            style={{ marginTop: "1.5rem", fontSize: "0.8rem", padding: "0.4rem 1rem" }}
          >
            ซ่อนตัวอย่าง
          </button>
        </div>
      )}
    </div>
  );
}
