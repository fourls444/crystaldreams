"use client";

import { useState } from "react";
import { Settings, Eye, EyeOff } from "lucide-react";

export interface FooterColumn {
  title: string;
  text: string;
  visible: boolean;
}

interface FooterSettingsProps {
  footerMainTitle: string;
  setFooterMainTitle: (val: string) => void;
  footerColumns: FooterColumn[];
  updateColumnField: (index: number, key: keyof FooterColumn, value: any) => void;
  styles: any;
}

export default function FooterSettings({
  footerMainTitle,
  setFooterMainTitle,
  footerColumns,
  updateColumnField,
  styles,
}: FooterSettingsProps) {
  const [activeFooterTab, setActiveFooterTab] = useState(1);

  const activeCol = footerColumns[activeFooterTab - 1];

  const renderFooterColumnTab = (num: number, col: FooterColumn) => {
    const idx = num - 1;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1e3a8a", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "1.5rem", height: "1.5rem", borderRadius: "50%", backgroundColor: "#eff6ff", color: "#1e3a8a", fontSize: "0.8rem", fontWeight: 800 }}>
              {num}
            </span>
            จัดการข้อมูลคอลัมน์ที่ {num}
          </span>
          <button
            type="button"
            onClick={() => updateColumnField(idx, "visible", !col.visible)}
            style={{
              background: "none",
              border: "1px solid",
              borderColor: col.visible ? "#bfdbfe" : "#cbd5e1",
              cursor: "pointer",
              color: col.visible ? "#1e3a8a" : "#64748b",
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              padding: "0.35rem 0.75rem",
              borderRadius: "0.375rem",
              backgroundColor: col.visible ? "#eff6ff" : "#f1f5f9",
              transition: "all 0.2s",
            }}
          >
            {col.visible ? <Eye size={16} /> : <EyeOff size={16} />}
            <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>{col.visible ? "แสดงผลบนหน้าเว็บ" : "ซ่อนคอลัมน์นี้"}</span>
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.5rem" }}>
              หัวข้อย่อย (Column Title)
            </label>
            <input
              type="text"
              placeholder="ระบุหัวข้อย่อย เช่น ติดต่อเรา"
              value={col.title}
              onChange={(e) => updateColumnField(idx, "title", e.target.value)}
              disabled={!col.visible}
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                borderRadius: "0.5rem",
                border: "1px solid #cbd5e1",
                backgroundColor: col.visible ? "#ffffff" : "#f8fafc",
                color: col.visible ? "#0f172a" : "#94a3b8",
                cursor: col.visible ? "text" : "not-allowed",
                fontSize: "0.95rem",
                fontWeight: 500,
                transition: "all 0.2s",
              }}
              required={col.visible}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.5rem" }}>
              เนื้อหา (Column Content)
            </label>
            <textarea
              placeholder="ระบุรายละเอียดข้อความของคุณ..."
              value={col.text}
              onChange={(e) => updateColumnField(idx, "text", e.target.value)}
              disabled={!col.visible}
              rows={5}
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                borderRadius: "0.5rem",
                border: "1px solid #cbd5e1",
                fontFamily: "inherit",
                backgroundColor: col.visible ? "#ffffff" : "#f8fafc",
                color: col.visible ? "#0f172a" : "#94a3b8",
                cursor: col.visible ? "text" : "not-allowed",
                fontSize: "0.95rem",
                lineHeight: "1.5",
                transition: "all 0.2s",
              }}
              required={col.visible}
            />
            <p style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.35rem", marginBottom: 0 }}>
              💡 สามารถกดปุ่ม Enter เพื่อขึ้นบรรทัดใหม่ได้ ข้อความจะแสดงผลแยกบรรทัดบนหน้าหลักตามที่คุณจัดพิมพ์
            </p>
          </div>
        </div>

        {/* Live Preview Box */}
        <div style={{
          marginTop: "0.5rem",
          padding: "1.25rem",
          borderRadius: "0.75rem",
          border: "1px dashed #cbd5e1",
          backgroundColor: "#ffffff",
          boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)",
        }}>
          <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>
            ตัวอย่างแสดงผลจริงในหน้าแรก (Live Preview)
          </div>
          {col.visible ? (
            <div style={{
              borderLeft: "3px solid #1e3a8a",
              paddingLeft: "0.75rem",
              textAlign: "left",
            }}>
              <h4 style={{
                fontSize: "1.1rem",
                fontWeight: 600,
                color: "#1e293b",
                margin: "0 0 0.5rem 0",
                fontFamily: "inherit",
              }}>
                {col.title.trim() || <span style={{ color: "#cbd5e1", fontStyle: "italic" }}>ไม่ได้ระบุหัวข้อ</span>}
              </h4>
              <p style={{
                fontSize: "0.9rem",
                color: "#475569",
                lineHeight: "1.6",
                margin: 0,
                whiteSpace: "pre-line",
                fontFamily: "inherit",
              }}>
                {col.text.trim() || <span style={{ color: "#cbd5e1", fontStyle: "italic" }}>ไม่ได้ระบุเนื้อหา</span>}
              </p>
            </div>
          ) : (
            <div style={{ color: "#94a3b8", fontSize: "0.85rem", fontStyle: "italic", textAlign: "left" }}>
              คอลัมน์นี้ถูกปิดใช้งาน (ซ่อนอยู่) จะไม่แสดงบนหน้าหลัก
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
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
          <Settings size={20} />
        </div>
        <div>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>ตั้งค่าข้อมูล Footer / เกี่ยวกับเรา (Footer Settings)</h3>
          <p style={{ fontSize: "0.8rem", color: "#64748b", margin: 0 }}>จัดการหัวข้อหลัก และคอลัมน์แสดงข้อมูลติดต่อต่าง ๆ (เปิดใช้งานได้สูงสุด 5 คอลัมน์)</p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <div>
          <label
            htmlFor="footer_main_title_input"
            style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.5rem" }}
          >
            หัวข้อหลัก Footer (Main Title)
          </label>
          <input
            id="footer_main_title_input"
            type="text"
            placeholder="เช่น เกี่ยวกับเรา"
            value={footerMainTitle}
            onChange={(e) => setFooterMainTitle(e.target.value)}
            style={{
              width: "100%",
              padding: "0.75rem 1rem",
              borderRadius: "0.5rem",
              border: "1px solid #cbd5e1",
              fontSize: "1rem",
              fontWeight: 500,
              outline: "none",
            }}
            required
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "0.5rem" }}>
          {/* Tabs Navigation */}
          <div style={{
            display: "flex",
            gap: "0.5rem",
            borderBottom: "1px solid #e2e8f0",
            paddingBottom: "0.75rem",
            overflowX: "auto",
            scrollbarWidth: "thin",
          }}>
            {[1, 2, 3, 4, 5].map((num) => {
              const isTabActive = activeFooterTab === num;
              const col = footerColumns[num - 1];
              const colTitle = col?.title || "";
              const colVisible = col?.visible ?? false;

              return (
                <button
                  key={num}
                  type="button"
                  onClick={() => setActiveFooterTab(num)}
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "0.5rem",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    border: "1px solid",
                    borderColor: isTabActive ? "#1e3a8a" : "#e2e8f0",
                    backgroundColor: isTabActive ? "#eff6ff" : "#ffffff",
                    color: isTabActive ? "#1e3a8a" : "#64748b",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    whiteSpace: "nowrap",
                    transition: "all 0.2s",
                  }}
                >
                  <span style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: colVisible ? "#22c55e" : "#cbd5e1",
                    flexShrink: 0,
                  }} />
                  <span>คอลัมน์ที่ {num} {colTitle.trim() ? `(${colTitle.trim()})` : ""}</span>
                </button>
              );
            })}
          </div>

          {/* Tab content panel */}
          <div style={{
            border: (activeCol?.visible ?? false)
              ? "1px solid #bfdbfe"
              : "1px solid #e2e8f0",
            padding: "1.5rem",
            borderRadius: "0.75rem",
            backgroundColor: (activeCol?.visible ?? false)
              ? "#f0f9ff"
              : "#f8fafc",
            opacity: (activeCol?.visible ?? false)
              ? 1
              : 0.85,
            transition: "all 0.2s",
          }}>
            {activeCol && renderFooterColumnTab(activeFooterTab, activeCol)}
          </div>
        </div>
      </div>
    </div>
  );
}
