"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";
import styles from "./Footer.module.css";

export default function Footer() {
  const [settings, setSettings] = useState({
    footer_main_title: "เกี่ยวกับเรา",
    columns: [
      { id: 1, title: "สถานที่ตั้ง", text: "ซอย 57 ตำบล บึงคำพร้อย อำเภอลำลูกกา ปทุมธานี 12150", visible: true },
      { id: 2, title: "ติดต่อ", text: "Call : (+66) 062-991-6986\nLine : @cdmth\nGmail : CrystalDreamsth@gmail.com", visible: true },
      { id: 3, title: "ที่มา", text: "Crystal Dreams ก่อตั้งด้วยความตั้งใจที่อยากให้คนไทยสามารถพักผ่อนได้อย่างเต็มที่ โดยปราศจากความกังวลทุกค่ำคืน", visible: true },
      { id: 4, title: "บริการลูกค้า", text: "นโยบายความเป็นส่วนตัว\nข้อกำหนดการใช้งาน\nนโยบายการรับประกัน", visible: false },
      { id: 5, title: "ความปลอดภัย", text: "ชำระเงินผ่านระบบพร้อมเพย์และบัตรเครดิตปลอดภัย 100%", visible: false },
    ]
  });

  useEffect(() => {
    async function fetchFooterSettings() {
      try {
        const { data, error } = await supabase
          .from("settings")
          .select("key, value")
          .in("key", [
            "footer_main_title",
            "footer_col1_title", "footer_col1_text", "footer_col1_visible",
            "footer_col2_title", "footer_col2_text", "footer_col2_visible",
            "footer_col3_title", "footer_col3_text", "footer_col3_visible",
            "footer_col4_title", "footer_col4_text", "footer_col4_visible",
            "footer_col5_title", "footer_col5_text", "footer_col5_visible",
          ]);

        if (error) {
          console.error("Error fetching footer settings:", error);
          return;
        }

        if (data && data.length > 0) {
          const fetchedMap = new Map<string, string>();
          data.forEach((item) => fetchedMap.set(item.key, item.value));

          setSettings((prev) => {
            const newCols = prev.columns.map((col) => {
              const prefix = `footer_col${col.id}`;
              const title = fetchedMap.get(`${prefix}_title`) ?? col.title;
              const text = fetchedMap.get(`${prefix}_text`) ?? col.text;
              
              // visibility check
              let visible = col.visible;
              const dbVis = fetchedMap.get(`${prefix}_visible`);
              if (dbVis !== undefined) {
                visible = dbVis === "true";
              }

              return { id: col.id, title, text, visible };
            });

            return {
              footer_main_title: fetchedMap.get("footer_main_title") ?? prev.footer_main_title,
              columns: newCols,
            };
          });
        }
      } catch (err) {
        console.error("Failed to load footer settings:", err);
      }
    }

    fetchFooterSettings();
  }, []);

  const visibleColumns = settings.columns.filter((c) => c.visible);

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <h2 className={styles.mainTitle}>{settings.footer_main_title}</h2>
        
        <div className={styles.grid}>
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

