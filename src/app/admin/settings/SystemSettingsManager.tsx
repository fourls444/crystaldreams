"use client";

import { useState, useEffect } from "react";
import { Settings, CreditCard, Save, RefreshCw, AlertTriangle, Eye, EyeOff, HelpCircle, GripVertical } from "lucide-react";
import Swal from "sweetalert2";
import styles from "../admin.module.css";

export default function SystemSettingsManager() {
  const [promptpayNumber, setPromptpayNumber] = useState("");
  const [promptpayRef1, setPromptpayRef1] = useState("");
  const [promptpayRef2, setPromptpayRef2] = useState("");

  const [initialNumber, setInitialNumber] = useState("");
  const [initialRef1, setInitialRef1] = useState("");
  const [initialRef2, setInitialRef2] = useState("");

  // Homepage Banners states
  const [banners, setBanners] = useState<string[]>([]);
  const [initialBanners, setInitialBanners] = useState<string[]>([]);
  const [uploadingBanners, setUploadingBanners] = useState(false);

  // Drag and Drop States and Handlers
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    setBanners((prev) => {
      const next = [...prev];
      const draggedItem = next[draggedIndex];
      next.splice(draggedIndex, 1);
      next.splice(targetIndex, 0, draggedItem);
      return next;
    });
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingBanners(true);
    const formData = new FormData();
    Array.from(files).forEach((file) => {
      formData.append("images", file);
    });

    try {
      const res = await fetch("/api/admin/upload-images", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.urls) {
        setBanners((prev) => [...prev, ...data.urls]);
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: "อัปโหลดรูปแบนเนอร์สำเร็จ",
          showConfirmButton: false,
          timer: 1500,
        });
      } else {
        throw new Error(data.error || "Upload failed");
      }
    } catch (err: any) {
      console.error(err);
      Swal.fire("ข้อผิดพลาด", err.message || "ไม่สามารถอัปโหลดรูปภาพได้", "error");
    } finally {
      setUploadingBanners(false);
      if (e.target) e.target.value = "";
    }
  };

  const moveBannerUp = (index: number) => {
    if (index === 0) return;
    setBanners((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[index - 1];
      next[index - 1] = temp;
      return next;
    });
  };

  const moveBannerDown = (index: number) => {
    if (index === banners.length - 1) return;
    setBanners((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[index + 1];
      next[index + 1] = temp;
      return next;
    });
  };

  const removeBanner = (index: number) => {
    setBanners((prev) => prev.filter((_, i) => i !== index));
  };

  // Footer fields states
  const [footerMainTitle, setFooterMainTitle] = useState("");
  
  // States for 5 columns
  const [col1Title, setCol1Title] = useState("");
  const [col1Text, setCol1Text] = useState("");
  const [col1Visible, setCol1Visible] = useState(true);

  const [col2Title, setCol2Title] = useState("");
  const [col2Text, setCol2Text] = useState("");
  const [col2Visible, setCol2Visible] = useState(true);

  const [col3Title, setCol3Title] = useState("");
  const [col3Text, setCol3Text] = useState("");
  const [col3Visible, setCol3Visible] = useState(true);

  const [col4Title, setCol4Title] = useState("");
  const [col4Text, setCol4Text] = useState("");
  const [col4Visible, setCol4Visible] = useState(false);

  const [col5Title, setCol5Title] = useState("");
  const [col5Text, setCol5Text] = useState("");
  const [col5Visible, setCol5Visible] = useState(false);

  // Tab state for Footer columns
  const [activeFooterTab, setActiveFooterTab] = useState(1);

  // Initial states for comparison
  const [initialMainTitle, setInitialMainTitle] = useState("");
  const [initialCol1Title, setInitialCol1Title] = useState("");
  const [initialCol1Text, setInitialCol1Text] = useState("");
  const [initialCol1Visible, setInitialCol1Visible] = useState(true);

  const [initialCol2Title, setInitialCol2Title] = useState("");
  const [initialCol2Text, setInitialCol2Text] = useState("");
  const [initialCol2Visible, setInitialCol2Visible] = useState(true);

  const [initialCol3Title, setInitialCol3Title] = useState("");
  const [initialCol3Text, setInitialCol3Text] = useState("");
  const [initialCol3Visible, setInitialCol3Visible] = useState(true);

  const [initialCol4Title, setInitialCol4Title] = useState("");
  const [initialCol4Text, setInitialCol4Text] = useState("");
  const [initialCol4Visible, setInitialCol4Visible] = useState(false);

  const [initialCol5Title, setInitialCol5Title] = useState("");
  const [initialCol5Text, setInitialCol5Text] = useState("");
  const [initialCol5Visible, setInitialCol5Visible] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [qrPreviewUrl, setQrPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // 1. Fetch current settings from backend on mount
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
        
        const c1t = data.settings.footer_col1_title || "สถานที่ตั้ง";
        const c1x = data.settings.footer_col1_text || "ซอย 57 ตำบล บึงคำพร้อย อำเภอลำลูกกา ปทุมธานี 12150";
        const c1v = data.settings.footer_col1_visible !== "false"; // default true

        const c2t = data.settings.footer_col2_title || "ติดต่อ";
        const c2x = data.settings.footer_col2_text || "Call : (+66) 062-991-6986\nLine : @cdmth\nGmail : CrystalDreamsth@gmail.com";
        const c2v = data.settings.footer_col2_visible !== "false"; // default true

        const c3t = data.settings.footer_col3_title || "ที่มา";
        const c3x = data.settings.footer_col3_text || "Crystal Dreams ก่อตั้งด้วยความตั้งใจที่อยากให้คนไทยสามารถพักผ่อนได้อย่างเต็มที่ โดยปราศจากความกังวลทุกค่ำคืน";
        const c3v = data.settings.footer_col3_visible !== "false"; // default true

        const c4t = data.settings.footer_col4_title || "บริการลูกค้า";
        const c4x = data.settings.footer_col4_text || "นโยบายความเป็นส่วนตัว\nข้อกำหนดการใช้งาน\nนโยบายการรับประกัน";
        const c4v = data.settings.footer_col4_visible === "true"; // default false

        const c5t = data.settings.footer_col5_title || "ความปลอดภัย";
        const c5x = data.settings.footer_col5_text || "ชำระเงินผ่านระบบพร้อมเพย์และบัตรเครดิตปลอดภัย 100%";
        const c5v = data.settings.footer_col5_visible === "true"; // default false

        setFooterMainTitle(fmt);
        setInitialMainTitle(fmt);

        setCol1Title(c1t);
        setInitialCol1Title(c1t);
        setCol1Text(c1x);
        setInitialCol1Text(c1x);
        setCol1Visible(c1v);
        setInitialCol1Visible(c1v);

        setCol2Title(c2t);
        setInitialCol2Title(c2t);
        setCol2Text(c2x);
        setInitialCol2Text(c2x);
        setCol2Visible(c2v);
        setInitialCol2Visible(c2v);

        setCol3Title(c3t);
        setInitialCol3Title(c3t);
        setCol3Text(c3x);
        setInitialCol3Text(c3x);
        setCol3Visible(c3v);
        setInitialCol3Visible(c3v);

        setCol4Title(c4t);
        setInitialCol4Title(c4t);
        setCol4Text(c4x);
        setInitialCol4Text(c4x);
        setCol4Visible(c4v);
        setInitialCol4Visible(c4v);

        setCol5Title(c5t);
        setInitialCol5Title(c5t);
        setCol5Text(c5x);
        setInitialCol5Text(c5x);
        setCol5Visible(c5v);
        setInitialCol5Visible(c5v);

        // Load homepage banners setting
        let bns = [];
        try {
          bns = data.settings.homepage_banners ? JSON.parse(data.settings.homepage_banners) : [];
        } catch (e) {
          console.error("Failed to parse homepage_banners on fetch:", e);
        }
        setBanners(bns);
        setInitialBanners(bns);
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

  // 2. Generate Live QR Preview for testing
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
      // Simulate generating a QR code for 1 THB to preview
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
            <p style="color: #ef4444; font-weight: 600; margin-bottom: 0.5rem;">เกิดข้อผิดพลาด: ${err.message || 'ไม่สามารถเชื่อมต่อ API ได้'}</p>
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

  // 3. Save Settings to Database
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

      const saveCol = (num: number, title: string, initialTitle: string, text: string, initialText: string, visible: boolean, initialVisible: boolean) => {
        if (title !== initialTitle) {
          promises.push(
            fetch("/api/admin/settings", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ key: `footer_col${num}_title`, value: title }),
            }).then((r) => r.json())
          );
        }
        if (text !== initialText) {
          promises.push(
            fetch("/api/admin/settings", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ key: `footer_col${num}_text`, value: text }),
            }).then((r) => r.json())
          );
        }
        if (visible !== initialVisible) {
          promises.push(
            fetch("/api/admin/settings", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ key: `footer_col${num}_visible`, value: String(visible) }),
            }).then((r) => r.json())
          );
        }
      };

      saveCol(1, col1Title, initialCol1Title, col1Text, initialCol1Text, col1Visible, initialCol1Visible);
      saveCol(2, col2Title, initialCol2Title, col2Text, initialCol2Text, col2Visible, initialCol2Visible);
      saveCol(3, col3Title, initialCol3Title, col3Text, initialCol3Text, col3Visible, initialCol3Visible);
      saveCol(4, col4Title, initialCol4Title, col4Text, initialCol4Text, col4Visible, initialCol4Visible);
      saveCol(5, col5Title, initialCol5Title, col5Text, initialCol5Text, col5Visible, initialCol5Visible);

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
      
      setInitialCol1Title(col1Title);
      setInitialCol1Text(col1Text);
      setInitialCol1Visible(col1Visible);

      setInitialCol2Title(col2Title);
      setInitialCol2Text(col2Text);
      setInitialCol2Visible(col2Visible);

      setInitialCol3Title(col3Title);
      setInitialCol3Text(col3Text);
      setInitialCol3Visible(col3Visible);

      setInitialCol4Title(col4Title);
      setInitialCol4Text(col4Text);
      setInitialCol4Visible(col4Visible);

      setInitialCol5Title(col5Title);
      setInitialCol5Text(col5Text);
      setInitialCol5Visible(col5Visible);

      setInitialBanners(banners);

      Swal.fire({
        icon: "success",
        title: "บันทึกข้อมูลสำเร็จ",
        text: "บันทึกการตั้งค่าระบบพร้อมเพย์และข้อมูลส่วนท้ายของร้านค้าเรียบร้อยแล้ว",
        confirmButtonColor: "#1e3a8a",
        timer: 2000,
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
    col1Title !== initialCol1Title ||
    col1Text !== initialCol1Text ||
    col1Visible !== initialCol1Visible ||
    col2Title !== initialCol2Title ||
    col2Text !== initialCol2Text ||
    col2Visible !== initialCol2Visible ||
    col3Title !== initialCol3Title ||
    col3Text !== initialCol3Text ||
    col3Visible !== initialCol3Visible ||
    col4Title !== initialCol4Title ||
    col4Text !== initialCol4Text ||
    col4Visible !== initialCol4Visible ||
    col5Title !== initialCol5Title ||
    col5Text !== initialCol5Text ||
    col5Visible !== initialCol5Visible;

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
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)" 
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

  const cleanNum = promptpayNumber.replace(/[^0-9]/g, "");
  let numType = "ยังไม่ได้ระบุ";
  if (cleanNum.length === 10) numType = "เบอร์โทรศัพท์มือถือ (MSISDN - Tag 29)";
  else if (cleanNum.length === 13) numType = "เลขบัตรประชาชน/เลขผู้เสียภาษี (NATID - Tag 29)";
  else if (cleanNum.length === 15) numType = "Biller ID / K-SHOP (Bill Payment - Tag 30)";

  const isBillPayment = cleanNum.length === 15;

  const renderFooterColumnTab = (
    num: number,
    title: string,
    setTitle: (val: string) => void,
    text: string,
    setText: (val: string) => void,
    visible: boolean,
    setVisible: (val: boolean) => void
  ) => {
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
            onClick={() => setVisible(!visible)}
            style={{ 
              background: "none", 
              border: "1px solid", 
              borderColor: visible ? "#bfdbfe" : "#cbd5e1",
              cursor: "pointer", 
              color: visible ? "#1e3a8a" : "#64748b",
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              padding: "0.35rem 0.75rem",
              borderRadius: "0.375rem",
              backgroundColor: visible ? "#eff6ff" : "#f1f5f9",
              transition: "all 0.2s"
            }}
          >
            {visible ? <Eye size={16} /> : <EyeOff size={16} />}
            <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>{visible ? "แสดงผลบนหน้าเว็บ" : "ซ่อนคอลัมน์นี้"}</span>
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
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={!visible}
              style={{ 
                width: "100%", 
                padding: "0.75rem 1rem", 
                borderRadius: "0.5rem", 
                border: "1px solid #cbd5e1", 
                backgroundColor: visible ? "#ffffff" : "#f8fafc", 
                color: visible ? "#0f172a" : "#94a3b8",
                cursor: visible ? "text" : "not-allowed",
                fontSize: "0.95rem",
                fontWeight: 500,
                transition: "all 0.2s"
              }}
              required={visible}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.5rem" }}>
              เนื้อหา (Column Content)
            </label>
            <textarea
              placeholder="ระบุรายละเอียดข้อความของคุณ..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={!visible}
              rows={5}
              style={{ 
                width: "100%", 
                padding: "0.75rem 1rem", 
                borderRadius: "0.5rem", 
                border: "1px solid #cbd5e1", 
                fontFamily: "inherit", 
                backgroundColor: visible ? "#ffffff" : "#f8fafc", 
                color: visible ? "#0f172a" : "#94a3b8",
                cursor: visible ? "text" : "not-allowed",
                fontSize: "0.95rem",
                lineHeight: "1.5",
                transition: "all 0.2s"
              }}
              required={visible}
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
          boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)"
        }}>
          <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>
            ตัวอย่างแสดงผลจริงในหน้าแรก (Live Preview)
          </div>
          {visible ? (
            <div style={{ 
              borderLeft: "3px solid #1e3a8a", 
              paddingLeft: "0.75rem",
              textAlign: "left"
            }}>
              <h4 style={{ 
                fontSize: "1.1rem", 
                fontWeight: 600, 
                color: "#1e293b", 
                margin: "0 0 0.5rem 0", 
                fontFamily: "inherit" 
              }}>
                {title.trim() || <span style={{ color: "#cbd5e1", fontStyle: "italic" }}>ไม่ได้ระบุหัวข้อ</span>}
              </h4>
              <p style={{ 
                fontSize: "0.9rem", 
                color: "#475569", 
                lineHeight: "1.6", 
                margin: 0, 
                whiteSpace: "pre-line", 
                fontFamily: "inherit" 
              }}>
                {text.trim() || <span style={{ color: "#cbd5e1", fontStyle: "italic" }}>ไม่ได้ระบุเนื้อหา</span>}
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
    <div className={styles.panelContainer}>
      <header className={styles.panelHeader}>
        <div>
          <h2 className={styles.panelTitle}>
            ตั้งค่าระบบ (System Settings)
          </h2>
          <p className={styles.panelSubtitle}>จัดการข้อมูลทั่วไป บัญชีรับเงิน และการเชื่อมต่อของร้านค้า</p>
        </div>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "2rem" }}>
        {/* Main Settings Card */}
        <form onSubmit={handleSaveSettings} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Homepage Banners Settings Card */}
          <div 
            style={{ 
              background: "#ffffff", 
              borderRadius: "1rem", 
              padding: "2rem", 
              border: "1px solid #e2e8f0", 
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)" 
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "1rem" }}>
              <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "0.5rem", backgroundColor: "#eff6ff", color: "#1e3a8a", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center" }}>
                <Save size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>รูปภาพแบนเนอร์หน้าแรก (Homepage Banners)</h3>
                <p style={{ fontSize: "0.8rem", color: "#64748b", margin: 0 }}>จัดการรูปภาพแบนเนอร์ภาพสไลด์สำหรับโปรโมตร้านค้า (ลากเพื่อจัดเรียงลำดับซ้ายไปขวา หรืออัปโหลดเพิ่มได้)</p>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* Image list displaying banners in horizontal grid */}
              {banners.length > 0 ? (
                <div style={{ 
                  display: "flex", 
                  flexWrap: "wrap", 
                  gap: "1rem", 
                  padding: "0.5rem 0" 
                }}>
                  {banners.map((url, idx) => {
                    const isDragged = draggedIndex === idx;
                    return (
                      <div 
                        key={idx} 
                        draggable
                        onDragStart={(e) => handleDragStart(e, idx)}
                        onDragOver={(e) => handleDragOver(e, idx)}
                        onDrop={(e) => handleDrop(e, idx)}
                        onDragEnd={handleDragEnd}
                        style={{ 
                          display: "flex", 
                          flexDirection: "column", 
                          width: "220px", 
                          border: isDragged ? "2px dashed #3b82f6" : "1px solid #e2e8f0", 
                          borderRadius: "0.75rem",
                          backgroundColor: isDragged ? "#f0f9ff" : "#ffffff",
                          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.02)",
                          overflow: "hidden",
                          transition: "transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease",
                          cursor: "grab",
                          opacity: isDragged ? 0.6 : 1,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-2px)";
                          e.currentTarget.style.boxShadow = "0 8px 12px -3px rgba(0,0,0,0.05), 0 4px 6px -2px rgba(0,0,0,0.03)";
                          e.currentTarget.style.borderColor = "#cbd5e1";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "none";
                          e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.02)";
                          e.currentTarget.style.borderColor = isDragged ? "#3b82f6" : "#e2e8f0";
                        }}
                      >
                        {/* Banner Image Container */}
                        <div style={{ position: "relative", width: "100%", height: "110px", backgroundColor: "#f1f5f9" }}>
                          <img 
                            src={url} 
                            alt={`Banner ${idx + 1}`} 
                            style={{ 
                              width: "100%", 
                              height: "100%", 
                              objectFit: "cover",
                              display: "block"
                            }}
                          />
                          {/* Number Badge */}
                          <span style={{ 
                            position: "absolute", 
                            top: "0.5rem", 
                            left: "0.5rem", 
                            fontSize: "0.75rem", 
                            fontWeight: 700, 
                            color: "#ffffff", 
                            backgroundColor: "rgba(15, 23, 42, 0.75)", 
                            padding: "0.15rem 0.5rem", 
                            borderRadius: "0.25rem",
                            backdropFilter: "blur(4px)"
                          }}>
                            {idx + 1}
                          </span>
                        </div>
                        
                        {/* Footer details & action inside card */}
                        <div style={{ 
                          padding: "0.75rem 1rem", 
                          display: "flex", 
                          alignItems: "center", 
                          justifyContent: "space-between", 
                          gap: "0.5rem",
                          borderTop: "1px solid #f1f5f9",
                          backgroundColor: "#f8fafc",
                          flexGrow: 1
                        }}>
                          {/* Grip Handle and Text */}
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", overflow: "hidden", flexGrow: 1 }}>
                            <div style={{ color: "#94a3b8", display: "flex", alignItems: "center", cursor: "grab" }}>
                              <GripVertical size={16} />
                            </div>
                            <span 
                              title={url}
                              style={{ 
                                fontSize: "0.75rem", 
                                color: "#475569", 
                                textOverflow: "ellipsis", 
                                overflow: "hidden", 
                                whiteSpace: "nowrap",
                              }}
                            >
                              {url.substring(url.lastIndexOf('/') + 1) || url}
                            </span>
                          </div>
                          
                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeBanner(idx);
                            }}
                            style={{
                              padding: "0.35rem 0.5rem",
                              borderRadius: "0.375rem",
                              border: "1px solid #fee2e2",
                              backgroundColor: "#fee2e2",
                              color: "#ef4444",
                              cursor: "pointer",
                              fontSize: "0.75rem",
                              fontWeight: "bold",
                              flexShrink: 0,
                              transition: "all 0.15s ease"
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = "#fca5a5";
                              e.currentTarget.style.borderColor = "#fca5a5";
                              e.currentTarget.style.color = "#ffffff";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = "#fee2e2";
                              e.currentTarget.style.borderColor = "#fee2e2";
                              e.currentTarget.style.color = "#ef4444";
                            }}
                          >
                            ลบ
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ padding: "2rem", border: "1px dashed #cbd5e1", borderRadius: "0.5rem", textAlign: "center", color: "#94a3b8", fontSize: "0.9rem" }}>
                  ยังไม่มีรูปภาพแบนเนอร์ในระบบ (ระบบจะแสดงผลภาพแบนเนอร์เริ่มต้น 4 รูป)
                </div>
              )}

              {/* Upload control button */}
              <div>
                <label 
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.625rem 1.25rem",
                    backgroundColor: "#eff6ff",
                    color: "#1e3a8a",
                    border: "1px solid #bfdbfe",
                    borderRadius: "0.5rem",
                    fontWeight: 600,
                    fontSize: "0.85rem",
                    cursor: uploadingBanners ? "not-allowed" : "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  <RefreshCw className={uploadingBanners ? styles.spinIcon : ""} size={16} />
                  <span>{uploadingBanners ? "กำลังอัปโหลดแบนเนอร์..." : "อัปโหลดรูปแบนเนอร์เพิ่ม (เลือกได้หลายไฟล์)"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={uploadingBanners}
                    onChange={handleBannerUpload}
                    style={{ display: "none" }}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Main Settings Card (PromptPay) */}
          <div 
            style={{ 
              background: "#ffffff", 
              borderRadius: "1rem", 
              padding: "2rem", 
              border: "1px solid #e2e8f0", 
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)" 
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
                  lineHeight: "1.5"
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

          {/* Footer Settings Card */}
          <div 
            style={{ 
              background: "#ffffff", 
              borderRadius: "1rem", 
              padding: "2rem", 
              border: "1px solid #e2e8f0", 
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)" 
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
                  scrollbarWidth: "thin"
                }}>
                  {[1, 2, 3, 4, 5].map((num) => {
                    const isTabActive = activeFooterTab === num;
                    const colTitle = num === 1 ? col1Title : num === 2 ? col2Title : num === 3 ? col3Title : num === 4 ? col4Title : col5Title;
                    const colVisible = num === 1 ? col1Visible : num === 2 ? col2Visible : num === 3 ? col3Visible : num === 4 ? col4Visible : col5Visible;
                    
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
                          transition: "all 0.2s"
                        }}
                      >
                        <span style={{ 
                          width: "8px", 
                          height: "8px", 
                          borderRadius: "50%", 
                          backgroundColor: colVisible ? "#22c55e" : "#cbd5e1",
                          flexShrink: 0
                        }} />
                        <span>คอลัมน์ที่ {num} {colTitle.trim() ? `(${colTitle.trim()})` : ''}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Tab content panel */}
                <div style={{
                  border: (activeFooterTab === 1 ? col1Visible : activeFooterTab === 2 ? col2Visible : activeFooterTab === 3 ? col3Visible : activeFooterTab === 4 ? col4Visible : col5Visible) 
                    ? "1px solid #bfdbfe" 
                    : "1px solid #e2e8f0", 
                  padding: "1.5rem", 
                  borderRadius: "0.75rem", 
                  backgroundColor: (activeFooterTab === 1 ? col1Visible : activeFooterTab === 2 ? col2Visible : activeFooterTab === 3 ? col3Visible : activeFooterTab === 4 ? col4Visible : col5Visible) 
                    ? "#f0f9ff" 
                    : "#f8fafc",
                  opacity: (activeFooterTab === 1 ? col1Visible : activeFooterTab === 2 ? col2Visible : activeFooterTab === 3 ? col3Visible : activeFooterTab === 4 ? col4Visible : col5Visible) 
                    ? 1 
                    : 0.85,
                  transition: "all 0.2s"
                }}>
                  {activeFooterTab === 1 && renderFooterColumnTab(1, col1Title, setCol1Title, col1Text, setCol1Text, col1Visible, setCol1Visible)}
                  {activeFooterTab === 2 && renderFooterColumnTab(2, col2Title, setCol2Title, col2Text, setCol2Text, col2Visible, setCol2Visible)}
                  {activeFooterTab === 3 && renderFooterColumnTab(3, col3Title, setCol3Title, col3Text, setCol3Text, col3Visible, setCol3Visible)}
                  {activeFooterTab === 4 && renderFooterColumnTab(4, col4Title, setCol4Title, col4Text, setCol4Text, col4Visible, setCol4Visible)}
                  {activeFooterTab === 5 && renderFooterColumnTab(5, col5Title, setCol5Title, col5Text, setCol5Text, col5Visible, setCol5Visible)}
                </div>
              </div>
            </div>
          </div>

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
                cursor: hasChanges && !saving ? "pointer" : "not-allowed"
              }}
              disabled={!hasChanges || saving}
            >
              {saving ? <RefreshCw className={styles.spinIcon} size={16} /> : <Save size={16} />}
              <span>บันทึกตั้งค่าทั้งหมด</span>
            </button>
          </div>
        </form>

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
              textAlign: "center"
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
                alignItems: "center"
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
              
              <p style={{ fontSize: "0.7rem", color: "#94a3b8", marginTop: "1rem", marginBottom: 0, fontFamily: "monospace", wordBreak: "break-all", textAlign: "center" }}>
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
              </p>
            </div>
            
            <button 
              onClick={() => setQrPreviewUrl(null)} 
              className={styles.cancelFormBtn}
              style={{ marginTop: "1.5rem", fontSize: "0.8rem", padding: "0.4rem 1rem" }}
            >
              ซ่อนตัวอย่าง
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
