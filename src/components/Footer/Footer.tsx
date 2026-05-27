"use client";

import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <h2 className={styles.mainTitle}>เกี่ยวกับเรา</h2>
        
        <div className={styles.grid}>
          {/* Column 1: Location */}
          <div className={styles.column}>
            <h3 className={styles.colTitle}>สถานที่ตั้ง</h3>
            <p className={styles.colText}>
              ซอย 57 ตำบล บึงคำพร้อย อำเภอลำลูกกา ปทุมธานี 12150
            </p>
          </div>

          {/* Column 2: Contact */}
          <div className={styles.column}>
            <h3 className={styles.colTitle}>ติดต่อ</h3>
            <p className={styles.colText}>
              Call : (+66) 062-991-6986<br />
              Line : @cdmth<br />
              Gmail : CrystalDreamsth@gmail.com
            </p>
          </div>

          {/* Column 3: Origin */}
          <div className={styles.column}>
            <h3 className={styles.colTitle}>ที่มา</h3>
            <p className={styles.colText}>
              Crystal Dreams ก่อตั้งด้วยความตั้งใจที่อยากให้คนไทยสามารถพักผ่อนได้อย่างเต็มที่ โดยปราศจากความกังวลทุกค่ำคืน
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
