"use client";

import Image from "next/image";
import Link from "next/link";
import styles from "./Header.module.css";

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link href="/" className={styles.logoLink}>
          <div className={styles.logoWrapper}>
            <Image
              src="/images/icon.png"
              alt="Crystal Dreams Logo"
              width={95}
              height={65}
              className={styles.logoImage}
              priority
            />
          </div>
        </Link>
      </div>
    </header>
  );
}
