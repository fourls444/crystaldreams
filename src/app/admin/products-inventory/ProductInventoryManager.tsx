"use client";

import { useState } from "react";
import Image from "next/image";
import { Plus, Trash2, GripVertical } from "lucide-react";
import AdminProductForm from "./AdminProductForm";
import styles from "../admin.module.css";

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  image_url: string | null;
  description?: string | null;
  detail?: string | null;
  image_urls?: string[] | null;
  is_visible?: boolean;
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
  const [prevProducts, setPrevProducts] = useState<Product[]>(initialProducts);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  if (initialProducts !== prevProducts) {
    setPrevProducts(initialProducts);
    setProducts(initialProducts);
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = async (index: number) => {
    setDragOverIndex(null);
    if (draggedIndex === null || draggedIndex === index) return;

    const newProducts = [...products];
    const [draggedItem] = newProducts.splice(draggedIndex, 1);
    newProducts.splice(index, 0, draggedItem);

    setProducts(newProducts);
    setDraggedIndex(null);

    // Call API to save reorder
    try {
      const orderedIds = newProducts.map((p) => p.id);
      const res = await fetch("/api/admin/products", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderedIds }),
      });
      if (!res.ok) {
        throw new Error("Failed to save sort order");
      }
    } catch (err) {
      console.error(err);
      // Revert if error
      setProducts(initialProducts);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const totalProducts = products.length;

  return (
    <div>
      <header className={styles.panelHeader}>
        <div>
          <h2 className={styles.panelTitle}>คลังสินค้าและรายการสินค้า ( {totalProducts} )</h2>
          <p className={styles.panelSubtitle}>เพิ่มรายการสินค้าใหม่ ปรับปรุงแก้ไข หรือลบสินค้าออกจากหน้าร้าน</p>
        </div>
        {!showProductModal && (
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
        )}
      </header>

      {showProductModal ? (
        <div className={`${styles.tableCard} ${styles.productFormCard}`}>
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
        <>
          {products.length > 1 && (
            <div style={{ marginBottom: "1.5rem" }}>
              <p style={{ fontSize: "0.85rem", color: "#475569", display: "flex", alignItems: "center", gap: "0.35rem", fontWeight: 550 }}>
                <span>💡 ลากและวางสินค้า เพื่อจัดเรียงลำดับการแสดงผลบนหน้าแรก (สินค้าชิ้นแรกสุดจะเป็นสินค้าหลัก)</span>
              </p>
            </div>
          )}
          <div className={styles.productGrid}>
            {products.map((p, index) => {
              const hasStock = p.stock > 0;
              const isDragged = draggedIndex === index;
              const isDragOver = dragOverIndex === index;
              return (
                <div 
                  key={p.id} 
                  className={`${styles.productListItem} ${isDragged ? styles.dragged : ""} ${isDragOver ? styles.dragOver : ""}`}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={() => handleDrop(index)}
                  onDragEnd={handleDragEnd}
                  style={{ cursor: "grab" }}
                  title="ลากเพื่อจัดเรียงลำดับการแสดงผล"
                >
                  <div className={styles.productListItemDragHeader}>
                    <GripVertical size={14} />
                    <span>ลากเพื่อจัดเรียงลำดับ</span>
                  </div>
                  <div className={styles.productListItemImage}>
                    <Image
                      src={p.image_url || "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&q=80&w=800"}
                      alt={p.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>
                  <div className={styles.productListItemContent}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                      <h4 className={styles.productListItemName}>{p.name}</h4>
                      <span className={`${styles.visibilityBadge} ${p.is_visible !== false ? styles.visibleBadge : styles.hiddenBadge}`}>
                        {p.is_visible !== false ? "แสดงหน้าร้าน" : "ซ่อนอยู่"}
                      </span>
                    </div>
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
            {products.length === 0 && (
              <div style={{ gridColumn: "span 3" }}>
                <div className={styles.emptyState}>
                  <div className={styles.emptyStateIcon}>📦</div>
                  <div className={styles.emptyStateTitle}>ไม่มีสินค้าในระบบ</div>
                  <div className={styles.emptyStateDesc}>คลิกปุ่ม &quot;เพิ่มสินค้าใหม่&quot; เพื่อลงสินค้าแรกเข้าระบบคลังสินค้า</div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
