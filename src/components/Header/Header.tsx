"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/context/CartContext";
import styles from "./Header.module.css";

export default function Header() {
  const { setIsCartOpen, cartCount } = useCart();

  return (
    <>
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

      <button
        onClick={() => setIsCartOpen(true)}
        className={styles.cartTrigger}
        aria-label="เปิดตะกร้าสินค้า"
      >
        <ShoppingCart size={26} />
        {cartCount > 0 && <span className={styles.cartBadge}>{cartCount}</span>}
      </button>
    </>
  );
}
