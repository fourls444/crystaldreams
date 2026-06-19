"use client";

import { useState, useEffect } from "react";
import { Save, RefreshCw } from "lucide-react";
import Swal from "sweetalert2";
import styles from "../admin.module.css";

import BannerSettings, { BannerItem } from "./BannerSettings";
import PromptPaySettings from "./PromptPaySettings";
import FooterSettings, { FooterColumn } from "./FooterSettings";

export default function SystemSettingsManager() {
  const [promptpayNumber, setPromptpayNumber] = useState("");
  const [promptpayRef1, setPromptpayRef1] = useState("");
  const [promptpayRef2, setPromptpayRef2] = useState("");

  const [initialNumber, setInitialNumber] = useState("");
  const [initialRef1, setInitialRef1] = useState("");
  const [initialRef2, setInitialRef2] = useState("");

  // Homepage Banners states
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [initialBanners, setInitialBanners] = useState<BannerItem[]>([]);

  // Footer Main Title
  const [footerMainTitle, setFooterMainTitle] = useState("");
  const [initialMainTitle, setInitialMainTitle] = useState("");

  // Consolidated Footer Columns Array
  const [footerColumns, setFooterColumns] = useState<FooterColumn[]>([
    { title: "", text: "", visible: true },
    { title: "", text: "", visible: true },
    { title: "", text: "", visible: true },
    { title: "", text: "", visible: false },
    { title: "", text: "", visible: false },
  ]);
  const [initialFooterColumns, setInitialFooterColumns] = useState<FooterColumn[]>([
    { title: "", text: "", visible: true },
    { title: "", text: "", visible: true },
    { title: "", text: "", visible: true },
    { title: "", text: "", visible: false },
    { title: "", text: "", visible: false },
  ]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch current settings from backend on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings");
      const data = await res.json();
      if (data.success && data.settings) {
        const num = data.settings.promptpay_number || "";
        const r1 = data.settings.promptpay_ref1 || "";
        const r2 = data.settings.promptpay_ref2 || "";

        setPromptpayNumber(num);
        setInitialNumber(num);

        setPromptpayRef1(r1);
        setInitialRef1(r1);

        setPromptpayRef2(r2);
        setInitialRef2(r2);

        // Load footer settings
        const fmt = data.settings.footer_main_title || "เกี่ยวกับเรา";
        setFooterMainTitle(fmt);
        setInitialMainTitle(fmt);

        // Load footer columns dynamically
        const loadedColumns: FooterColumn[] = [];
        for (let i = 1; i <= 5; i++) {
          const defaultTitle =
            i === 1
              ? "สถานที่ตั้ง"
              : i === 2
              ? "ติดต่อ"
              : i === 3
              ? "ที่มา"
              : i === 4
              ? "บริการลูกค้า"
              : "ความปลอดภัย";
          const defaultText =
            i === 1
              ? "ซอย 57 ตำบล บึงคำพร้อย อำเภอลำลูกกา ปทุมธานี 12150"
              : i === 2
              ? "Call : (+66) 062-991-6986\nLine : @cdmth\nGmail : CrystalDreamsth@gmail.com"
              : i === 3
              ? "Crystal Dreams ก่อตั้งด้วยความตั้งใจที่อยากให้คนไทยสามารถพักผ่อนได้อย่างเต็มที่ โดยปราศจากความกังวลทุกค่ำคืน"
              : i === 4
              ? "นโยบายความเป็นส่วนตัว\nข้อกำหนดการใช้งาน\nนโยบายการรับประกัน"
              : "ชำระเงินผ่านระบบพร้อมเพย์และบัตรเครดิตปลอดภัย 100%";
          const defaultVisible = i <= 3;

          const keyVisible = `footer_col${i}_visible`;
          const valVisibleStr = data.settings[keyVisible];
          let visible = defaultVisible;
          if (valVisibleStr === "true") visible = true;
          if (valVisibleStr === "false") visible = false;

          loadedColumns.push({
            title: data.settings[`footer_col${i}_title`] || defaultTitle,
            text: data.settings[`footer_col${i}_text`] || defaultText,
            visible,
          });
        }
        setFooterColumns(loadedColumns);
        setInitialFooterColumns(loadedColumns);

        // Load homepage banners setting
        let bns = [];
        try {
          bns = data.settings.homepage_banners ? JSON.parse(data.settings.homepage_banners) : [];
        } catch (e) {
          console.error("Failed to parse homepage_banners on fetch:", e);
        }
        const mappedBanners: BannerItem[] = bns.map((item: any) => {
          if (typeof item === "string") {
            return { url: item, name: "", visible: true };
          }
          return {
            url: item.url || "",
            name: item.name || "",
            visible: item.visible !== false,
          };
        });
        setBanners(mappedBanners);
        setInitialBanners(mappedBanners);
      }
    } catch (err) {
      console.error("Failed to fetch system settings:", err);
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถดึงข้อมูลการตั้งค่าระบบได้",
        confirmButtonColor: "#1e3a8a",
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper to update column field by index
  const updateColumnField = (index: number, key: keyof FooterColumn, value: any) => {
    setFooterColumns((prev) =>
      prev.map((col, i) => (i === index ? { ...col, [key]: value } : col))
    );
  };

  // Save Settings to Database
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNumber = promptpayNumber.replace(/[^0-9]/g, "");

    // Validate structure
    if (!cleanNumber) {
      Swal.fire({
        icon: "error",
        title: "ข้อผิดพลาด",
        text: "กรุณากรอกหมายเลขพร้อมเพย์",
        confirmButtonColor: "#1e3a8a",
      });
      return;
    }

    if (![10, 13, 15].includes(cleanNumber.length)) {
      Swal.fire({
        icon: "error",
        title: "รูปแบบหมายเลขไม่ถูกต้อง",
        text: "ต้องเป็นเบอร์โทรศัพท์ 10 หลัก, เลขบัตรประชาชน/ผู้เสียภาษี 13 หลัก หรือ Biller ID (K-SHOP) 15 หลักเท่านั้น",
        confirmButtonColor: "#1e3a8a",
      });
      return;
    }

    setSaving(true);
    try {
      const promises = [];

      // Save promptpay_number
      if (cleanNumber !== initialNumber) {
        promises.push(
          fetch("/api/admin/settings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key: "promptpay_number", value: cleanNumber }),
          }).then((r) => r.json())
        );
      }

      // Save promptpay_ref1
      if (promptpayRef1.trim() !== initialRef1) {
        promises.push(
          fetch("/api/admin/settings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key: "promptpay_ref1", value: promptpayRef1.trim() }),
          }).then((r) => r.json())
        );
      }

      // Save promptpay_ref2
      if (promptpayRef2.trim() !== initialRef2) {
        promises.push(
          fetch("/api/admin/settings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key: "promptpay_ref2", value: promptpayRef2.trim() }),
          }).then((r) => r.json())
        );
      }

      // Save footer settings
      if (footerMainTitle !== initialMainTitle) {
        promises.push(
          fetch("/api/admin/settings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key: "footer_main_title", value: footerMainTitle }),
          }).then((r) => r.json())
        );
      }

      // Save columns
      footerColumns.forEach((col, idx) => {
        const num = idx + 1;
        const initCol = initialFooterColumns[idx];
        if (col.title !== initCol.title) {
          promises.push(
            fetch("/api/admin/settings", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ key: `footer_col${num}_title`, value: col.title }),
            }).then((r) => r.json())
          );
        }
        if (col.text !== initCol.text) {
          promises.push(
            fetch("/api/admin/settings", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ key: `footer_col${num}_text`, value: col.text }),
            }).then((r) => r.json())
          );
        }
        if (col.visible !== initCol.visible) {
          promises.push(
            fetch("/api/admin/settings", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ key: `footer_col${num}_visible`, value: String(col.visible) }),
            }).then((r) => r.json())
          );
        }
      });

      // Save homepage banners
      if (JSON.stringify(banners) !== JSON.stringify(initialBanners)) {
        promises.push(
          fetch("/api/admin/settings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key: "homepage_banners", value: JSON.stringify(banners) }),
          }).then((r) => r.json())
        );
      }

      const results = await Promise.all(promises);
      const errors = results.filter((res) => !res.success);

      if (errors.length > 0) {
        throw new Error(errors[0].error || "บางรายการบันทึกล้มเหลว");
      }

      setInitialNumber(cleanNumber);
      setInitialRef1(promptpayRef1.trim());
      setInitialRef2(promptpayRef2.trim());
      setInitialMainTitle(footerMainTitle);
      setInitialFooterColumns([...footerColumns]);
      setInitialBanners(banners);

      Swal.fire({
        icon: "success",
        title: "บันทึกเรียบร้อยแล้ว",
        confirmButtonColor: "#1e3a8a",
        timer: 1500,
      });
    } catch (err: any) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "บันทึกไม่สำเร็จ",
        text: err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์",
        confirmButtonColor: "#1e3a8a",
      });
    } finally {
      setSaving(false);
    }
  };

  const hasChanges =
    promptpayNumber.replace(/[^0-9]/g, "") !== initialNumber ||
    promptpayRef1.trim() !== initialRef1 ||
    promptpayRef2.trim() !== initialRef2 ||
    JSON.stringify(banners) !== JSON.stringify(initialBanners) ||
    footerMainTitle !== initialMainTitle ||
    JSON.stringify(footerColumns) !== JSON.stringify(initialFooterColumns);

  if (loading) {
    return (
      <div className={styles.panelContainer}>
        <header className={styles.panelHeader}>
          <div>
            <div className={`${styles.skeleton} ${styles.skeletonText}`} style={{ width: "220px", height: "1.75rem", marginBottom: "0.5rem" }}></div>
            <div className={`${styles.skeleton} ${styles.skeletonText}`} style={{ width: "340px", height: "0.85rem" }}></div>
          </div>
        </header>

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "2rem" }}>
          <div
            style={{
              background: "#ffffff",
              borderRadius: "1rem",
              padding: "2rem",
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
            }}
          >
            {/* Header skeleton */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "1rem" }}>
              <div className={styles.skeleton} style={{ width: "2.5rem", height: "2.5rem", borderRadius: "0.5rem" }}></div>
              <div style={{ flexGrow: 1 }}>
                <div className={`${styles.skeleton} ${styles.skeletonText}`} style={{ width: "250px", height: "1.1rem", marginBottom: "0.4rem" }}></div>
                <div className={`${styles.skeleton} ${styles.skeletonText}`} style={{ width: "100%", maxWidth: "450px", height: "0.75rem" }}></div>
              </div>
            </div>

            {/* Inputs skeletons */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {/* Field 1 */}
              <div>
                <div className={`${styles.skeleton} ${styles.skeletonText}`} style={{ width: "180px", height: "0.875rem", marginBottom: "0.5rem" }}></div>
                <div className={`${styles.skeleton} ${styles.skeletonBlock}`} style={{ borderRadius: "0.5rem" }}></div>
                <div className={`${styles.skeleton} ${styles.skeletonText}`} style={{ width: "280px", height: "0.75rem", marginTop: "0.5rem" }}></div>
              </div>

              {/* Field 2 */}
              <div>
                <div className={`${styles.skeleton} ${styles.skeletonText}`} style={{ width: "150px", height: "0.875rem", marginBottom: "0.5rem" }}></div>
                <div className={`${styles.skeleton} ${styles.skeletonBlock}`} style={{ borderRadius: "0.5rem" }}></div>
                <div className={`${styles.skeleton} ${styles.skeletonText}`} style={{ width: "320px", height: "0.75rem", marginTop: "0.5rem" }}></div>
              </div>

              {/* Field 3 */}
              <div>
                <div className={`${styles.skeleton} ${styles.skeletonText}`} style={{ width: "150px", height: "0.875rem", marginBottom: "0.5rem" }}></div>
                <div className={`${styles.skeleton} ${styles.skeletonBlock}`} style={{ borderRadius: "0.5rem" }}></div>
                <div className={`${styles.skeleton} ${styles.skeletonText}`} style={{ width: "320px", height: "0.75rem", marginTop: "0.5rem" }}></div>
              </div>

              {/* Alert Warning box skeleton */}
              <div className={styles.skeleton} style={{ width: "100%", height: "4.5rem", borderRadius: "0.5rem" }}></div>
            </div>

            {/* Buttons skeleton */}
            <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end", marginTop: "2rem", borderTop: "1px solid #f1f5f9", paddingTop: "1.25rem" }}>
              <div className={styles.skeleton} style={{ width: "150px", height: "2.5rem", borderRadius: "0.375rem" }}></div>
              <div className={styles.skeleton} style={{ width: "120px", height: "2.5rem", borderRadius: "0.375rem" }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.panelContainer}>
      <header className={styles.panelHeader}>
        <div>
          <h2 className={styles.panelTitle}>ตั้งค่าระบบ (System Settings)</h2>
          <p className={styles.panelSubtitle}>จัดการข้อมูลทั่วไป บัญชีรับเงิน และการเชื่อมต่อของร้านค้า</p>
        </div>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "2rem" }}>
        {/* Main Settings Card */}
        <form onSubmit={handleSaveSettings} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          <BannerSettings banners={banners} setBanners={setBanners} styles={styles} />

          <PromptPaySettings
            promptpayNumber={promptpayNumber}
            setPromptpayNumber={setPromptpayNumber}
            promptpayRef1={promptpayRef1}
            setPromptpayRef1={setPromptpayRef1}
            promptpayRef2={promptpayRef2}
            setPromptpayRef2={setPromptpayRef2}
            styles={styles}
          />

          <FooterSettings
            footerMainTitle={footerMainTitle}
            setFooterMainTitle={setFooterMainTitle}
            footerColumns={footerColumns}
            updateColumnField={updateColumnField}
            styles={styles}
          />

          {/* Form Actions */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
            <button
              type="submit"
              className={styles.saveBtn}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.75rem 1.5rem",
                backgroundColor: hasChanges ? "#1e3a8a" : "#94a3b8",
                cursor: hasChanges && !saving ? "pointer" : "not-allowed",
              }}
              disabled={!hasChanges || saving}
            >
              {saving ? <RefreshCw className={styles.spinIcon} size={16} /> : <Save size={16} />}
              <span>บันทึกตั้งค่าทั้งหมด</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
