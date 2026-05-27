"use client";

import Image from "next/image";
import { Plus, Trash2 } from "lucide-react";
import AdminProductForm from "./AdminProductForm";
import styles from "./admin.module.css";

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  image_url: string | null;
  description?: string | null;
  detail?: string | null;
  image_urls?: string[] | null;
}

interface ProductInventoryManagerProps {
  initialProducts: Product[];
  showProductModal: boolean;
  onSetShowProductModal: (show: boolean) => void;
  editingProduct: Product | null;
  onSetEditingProduct: (product: Product | null) => void;
  onDeleteProduct: (productId: string, productName: string) => void;
  onSaveSuccess: () => void;
  onCancel: () => void;
}

export default function ProductInventoryManager({
  initialProducts,
  showProductModal,
  onSetShowProductModal,
  editingProduct,
  onSetEditingProduct,
  onDeleteProduct,
  onSaveSuccess,
  onCancel,
}: ProductInventoryManagerProps) {
  const totalProducts = initialProducts.length;

  return (
    <div>
      <header className={styles.panelHeader}>
        <div>
          <h2 className={styles.panelTitle}>คลังสินค้าและรายการสินค้า ({totalProducts})</h2>
          <p className={styles.panelSubtitle}>เพิ่มรายการสินค้าใหม่ ปรับปรุงแก้ไข หรือลบสินค้าออกจากหน้าร้าน</p>
        </div>
        <div className={styles.headerActions}>
          <button
            onClick={() => {
              onSetEditingProduct(null);
              onSetShowProductModal(true);
            }}
            className={styles.addProductBtn}
            style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
          >
            <Plus size={16} />
            <span>เพิ่มสินค้าใหม่</span>
          </button>
        </div>
      </header>

      {showProductModal ? (
        <div className={styles.tableCard} style={{ padding: "2rem" }}>
          <h3 className={styles.sectionTitle}>
            {editingProduct ? "แก้ไขรายละเอียดสินค้า" : "เพิ่มสินค้าใหม่เข้าร้านค้า"}
          </h3>
          <p className={styles.sectionSubtitle}>
            {editingProduct ? "แก้ไขชื่อสินค้า ราคา สต็อก หรือรูปภาพของสินค้าชิ้นนี้" : "กรอกข้อมูลเพื่อลงรายการสินค้าใหม่ในคลัง"}
          </p>
          <AdminProductForm
            initialProduct={editingProduct}
            onSaveSuccess={onSaveSuccess}
            onCancel={onCancel}
          />
        </div>
      ) : (
        <div className={styles.productGrid}>
          {initialProducts.map((p) => {
            const hasStock = p.stock > 0;
            return (
              <div key={p.id} className={styles.productListItem}>
                <div className={styles.productListItemImage}>
                  <Image
                    src={p.image_url || "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&q=80&w=800"}
                    alt={p.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
                <div className={styles.productListItemContent}>
                  <h4 className={styles.productListItemName}>{p.name}</h4>
                  <div className={styles.productListItemPriceRow}>
                    <span className={styles.productListItemPrice}>{p.price.toLocaleString()} ฿</span>
                    <span
                      className={`${styles.productListItemStock} ${hasStock ? styles.productListItemStockIn : styles.productListItemStockOut}`}
                    >
                      {hasStock ? `มีสินค้า ${p.stock} ชิ้น` : "สินค้าหมด"}
                    </span>
                  </div>
                  <div className={styles.productListItemActions}>
                    <button
                      onClick={() => {
                        onSetEditingProduct(p);
                        onSetShowProductModal(true);
                      }}
                      className={styles.editProductBtn}
                    >
                      แก้ไขรายละเอียด
                    </button>
                    <button
                      onClick={() => onDeleteProduct(p.id, p.name)}
                      className={styles.deleteProductBtn}
                      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                      title="ลบสินค้านี้"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {initialProducts.length === 0 && (
            <div style={{ gridColumn: "span 3" }}>
              <div className={styles.emptyState}>
                <div className={styles.emptyStateIcon}>📦</div>
                <div className={styles.emptyStateTitle}>ไม่มีสินค้าในระบบ</div>
                <div className={styles.emptyStateDesc}>คลิกปุ่ม "เพิ่มสินค้าใหม่" เพื่อลงสินค้าแรกเข้าระบบคลังสินค้า</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
