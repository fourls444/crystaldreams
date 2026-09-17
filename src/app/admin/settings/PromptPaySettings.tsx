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
            <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Beam PromptPay</h3>
            <p style={{ margin: 0, color: "#64748b", fontSize: "0.82rem" }}>QR และการยืนยันยอดถูกจัดการผ่าน Beam อัตโนมัติ</p>
          </div>
        </div>
        <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "0.75rem", padding: "1rem", color: "#1e3a8a", lineHeight: 1.6, fontSize: "0.86rem" }}>
          ตั้งค่า <code>BEAM_API_KEY</code> และ <code>NEXT_PUBLIC_APP_URL</code> ที่ environment ของเซิร์ฟเวอร์ และตั้ง webhook ใน Beam Lighthouse Dashboard มาที่ <code>/api/webhooks/beam</code> ไม่ต้องกำหนดหมายเลขพร้อมเพย์หรือ Ref ในหน้านี้แล้ว
        </div>
      </section>

      <section className={styles.codSettingsSection}>
        <div className={styles.codSettingsContent}>
          <div className={styles.codSettingsInfo}>
            <div className={styles.codSettingsTitleRow}>
              <Truck size={20} color="#b45309" />
              <div>
                <h3>เก็บเงินปลายทาง (COD)</h3>
                <p>คง flow เดิมและไม่ผ่าน Beam</p>
              </div>
            </div>
            <p className={styles.codSettingsDescription}>
              ควบคุมว่าลูกค้าจะเห็น COD เป็นตัวเลือกในขั้นตอนชำระเงินหรือไม่
            </p>
          </div>

          <div className={styles.codControlPanel}>
            <div className={styles.codControlHeader}>
              <span>สถานะการรับ COD</span>
              <span className={`${styles.codStatusBadge} ${codEnabled ? styles.codStatusBadgeEnabled : styles.codStatusBadgeDisabled}`}>
                {codEnabled ? "เปิดอยู่" : "ปิดอยู่"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setCodEnabled(!codEnabled)}
              aria-pressed={codEnabled}
              className={`${styles.codToggleButton} ${codEnabled ? styles.codToggleButtonEnabled : styles.codToggleButtonDisabled}`}
            >
              {codEnabled ? "ปิดใช้งาน COD" : "เปิดใช้งาน COD"}
            </button>
            <p className={`${styles.codHelper} ${codEnabled ? styles.codHelperEnabled : styles.codHelperDisabled}`}>
              {!codEnabled && <AlertTriangle size={16} aria-hidden="true" />}
              {codEnabled ? "ลูกค้าสามารถเลือก COD ได้ในขั้นตอนชำระเงิน" : "ลูกค้าจะไม่เห็นตัวเลือก COD"}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
