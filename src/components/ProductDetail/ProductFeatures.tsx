"use client";

import styles from "./ProductDetail.module.css";

interface ProductFeaturesProps {
  description: string;
}

export default function ProductFeatures({ description }: ProductFeaturesProps) {
  return (
    <div className={styles.descriptionSection}>
      <p className={styles.descriptionBullets}>
        {description}
      </p>
    </div>
  );
}
