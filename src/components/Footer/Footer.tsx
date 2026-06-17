"use client";

import { useEffect, useState } from "react";
import styles from "./Footer.module.css";

interface FooterProps {
  initialSettings?: Record<string, string>;
}

export default function Footer({ initialSettings }: FooterProps) {
  const getMergedSettings = (fetchedData?: Record<string, string> | null) => {
    const defaultTitle = "เกี่ยวกับเรา";
    const defaultColumns = [
      { id: 1, title: "สถานที่ตั้ง", text: "ซอย 57 ตำบล บึงคำพร้อย อำเภอลำลูกกา ปทุมธานี 12150", visible: true },
      { id: 2, title: "ติดต่อ", text: "Call : (+66) 062-991-6986\nLine : @cdmth\nGmail : CrystalDreamsth@gmail.com", visible: true },
      { id: 3, title: "ที่มา", text: "Crystal Dreams ก่อตั้งด้วยความตั้งใจที่อยากให้คนไทยสามารถพักผ่อนได้อย่างเต็มที่ โดยปราศจากความกังวลทุกค่ำคืน", visible: true },
      { id: 4, title: "บริการลูกค้า", text: "นโยบายความเป็นส่วนตัว\nข้อกำหนดการใช้งาน\nนโยบายการรับประกัน", visible: false },
      { id: 5, title: "ความปลอดภัย", text: "ชำระเงินผ่านระบบพร้อมเพย์และบัตรเครดิตปลอดภัย 100%", visible: false },
    ];

    if (!fetchedData) {
      return { footer_main_title: defaultTitle, columns: defaultColumns };
    }

    const fetchedMap = new Map<string, string>(Object.entries(fetchedData));
    const newCols = defaultColumns.map((col) => {
      const prefix = `footer_col${col.id}`;
      const title = fetchedMap.get(`${prefix}_title`) ?? col.title;
      const text = fetchedMap.get(`${prefix}_text`) ?? col.text;
      
      let visible = col.visible;
      const dbVis = fetchedMap.get(`${prefix}_visible`);
      if (dbVis !== undefined) {
        visible = dbVis === "true";
      }

      return { id: col.id, title, text, visible };
    });

    return {
      footer_main_title: fetchedMap.get("footer_main_title") ?? defaultTitle,
      columns: newCols,
    };
  };

  const [settings, setSettings] = useState(() => getMergedSettings(initialSettings));

  useEffect(() => {
    async function fetchFooterSettings() {
      try {
        const res = await fetch("/api/settings");
        const data = await res.json();
        
        if (data.success && data.settings) {
          setSettings(getMergedSettings(data.settings));
        }
      } catch (err) {
        console.error("Failed to load footer settings client-side:", err);
      }
    }

    // Only query api client-side if settings weren't preloaded
    if (!initialSettings || Object.keys(initialSettings).length === 0) {
      fetchFooterSettings();
    }
  }, [initialSettings]);

  const visibleColumns = settings.columns.filter((c) => c.visible);

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <h2 className={styles.mainTitle}>{settings.footer_main_title}</h2>
        
        <div className={styles.grid} style={{ "--cols-count": String(visibleColumns.length) } as React.CSSProperties}>
          {visibleColumns.map((col) => (
            <div key={col.id} className={styles.column}>
              <h3 className={styles.colTitle}>{col.title}</h3>
              <p className={styles.colText} style={{ whiteSpace: "pre-line" }}>
                {col.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}

