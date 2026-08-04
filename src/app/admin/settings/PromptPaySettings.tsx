"use client";

import { AlertTriangle, CreditCard, Truck } from "lucide-react";

interface PromptPaySettingsProps {
  promptpayNumber: string;
  setPromptpayNumber: (val: string) => void;
  promptpayRef1: string;
  setPromptpayRef1: (val: string) => void;
  promptpayRef2: string;
  setPromptpayRef2: (val: string) => void;
  codEnabled: boolean;
  setCodEnabled: (val: boolean) => void;
  styles: Record<string, string>;
}

export default function PromptPaySettings({
  codEnabled,
  setCodEnabled,
  styles,
}: PromptPaySettingsProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <section style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "1rem", padding: "2rem" }}>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginBottom: "1rem" }}>
          <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "0.5rem", background: "#dbeafe", color: "#1e3a8a", display: "grid", placeItems: "center" }}>
            <CreditCard size={20} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Omise PromptPay</h3>
            <p style={{ margin: 0, color: "#64748b", fontSize: "0.82rem" }}>QR และการยืนยันยอดถูกจัดการผ่าน Omise อัตโนมัติ</p>
          </div>
        </div>
        <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "0.75rem", padding: "1rem", color: "#1e3a8a", lineHeight: 1.6, fontSize: "0.86rem" }}>
          ตั้งค่า <code>OMISE_SECRET_KEY</code> และ <code>NEXT_PUBLIC_APP_URL</code> ที่ environment ของเซิร์ฟเวอร์ และตั้ง webhook ใน Omise Dashboard มาที่ <code>/api/webhooks/omise</code> ไม่ต้องกำหนดหมายเลขพร้อมเพย์หรือ Ref ในหน้านี้แล้ว
        </div>
      </section>

      <section style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "1rem", padding: "2rem" }}>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginBottom: "1rem" }}>
          <Truck size={20} color="#b45309" />
          <div>
            <h3 style={{ margin: 0, fontSize: "1.1rem" }}>เก็บเงินปลายทาง (COD)</h3>
            <p style={{ margin: 0, color: "#64748b", fontSize: "0.82rem" }}>คง flow เดิมและไม่ผ่าน Omise</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setCodEnabled(!codEnabled)}
          aria-pressed={codEnabled}
          className={codEnabled ? styles.saveBtn : styles.cancelFormBtn}
          style={{ minWidth: 170 }}
        >
          {codEnabled ? "เปิดใช้งาน COD" : "ปิดใช้งาน COD"}
        </button>
        {!codEnabled && (
          <p style={{ display: "flex", gap: "0.5rem", alignItems: "center", color: "#b45309", fontSize: "0.82rem", marginBottom: 0 }}>
            <AlertTriangle size={16} /> ลูกค้าจะไม่เห็นตัวเลือก COD
          </p>
        )}
      </section>
    </div>
  );
}
