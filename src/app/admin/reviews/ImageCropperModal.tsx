"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { X } from "lucide-react";
import styles from "./ReviewsManager.module.css";

interface CropModalProps {
  imageSrc: string;
  onCrop: (croppedFile: File) => void;
  onCancel: () => void;
  fileName: string;
}

export default function ImageCropperModal({
  imageSrc,
  onCrop,
  onCancel,
  fileName,
}: CropModalProps) {
  const [ratio, setRatio] = useState<"3:4" | "1:1" | "original">("3:4");
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Reset positioning when ratio changes
  useEffect(() => {
    setPosition({ x: 0, y: 0 });
    setZoom(1);
  }, [ratio]);

  // Dimensions of crop boxes
  const cropBox = useMemo(() => {
    if (ratio === "1:1") return { width: 360, height: 360 };
    if (ratio === "3:4") return { width: 345, height: 460 };
    return { width: 360, height: 360 }; // Fallback
  }, [ratio]);

  // Calculate image sizes and cover limits
  const imageMetrics = useMemo(() => {
    if (!imageRef.current) return { coverScale: 1, W_disp: 0, H_disp: 0 };
    const { naturalWidth, naturalHeight } = imageRef.current;
    const coverScale = Math.max(cropBox.width / naturalWidth, cropBox.height / naturalHeight);
    return {
      coverScale,
      W_disp: naturalWidth * coverScale,
      H_disp: naturalHeight * coverScale,
    };
  }, [cropBox, imageSrc, ratio]);

  // Clamped positions to keep image within crop box bounds
  const clampedPos = useMemo(() => {
    if (ratio === "original") return { x: 0, y: 0 };
    const maxTranslateX = Math.max(0, (imageMetrics.W_disp * zoom - cropBox.width) / 2);
    const maxTranslateY = Math.max(0, (imageMetrics.H_disp * zoom - cropBox.height) / 2);
    return {
      x: Math.max(-maxTranslateX, Math.min(maxTranslateX, position.x)),
      y: Math.max(-maxTranslateY, Math.min(maxTranslateY, position.y)),
    };
  }, [position, zoom, imageMetrics, cropBox, ratio]);

  // Dragging event handlers (PointerEvents)
  const handlePointerDown = (e: React.PointerEvent) => {
    if (ratio === "original") return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    if (containerRef.current) {
      containerRef.current.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    if (containerRef.current) {
      containerRef.current.releasePointerCapture(e.pointerId);
    }
  };

  const handleSaveCrop = () => {
    if (ratio === "original") {
      // Just convert original Object URL / Base64 to blob and return
      fetch(imageSrc)
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File([blob], fileName, { type: blob.type || "image/png" });
          onCrop(file);
        });
      return;
    }

    const img = imageRef.current;
    if (!img) return;

    // Create Canvas matching output resolution
    const canvas = document.createElement("canvas");
    const outWidth = ratio === "1:1" ? 600 : 600;
    const outHeight = ratio === "1:1" ? 600 : 800;
    canvas.width = outWidth;
    canvas.height = outHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Scale mapping factor from UI box to Canvas
    const R = outWidth / cropBox.width;

    // Dest coordinates on the Canvas
    const scale = imageMetrics.coverScale * zoom;
    const xDest = ((cropBox.width - img.naturalWidth * scale) / 2 + clampedPos.x) * R;
    const yDest = ((cropBox.height - img.naturalHeight * scale) / 2 + clampedPos.y) * R;
    const wDest = img.naturalWidth * scale * R;
    const hDest = img.naturalHeight * scale * R;

    ctx.drawImage(img, xDest, yDest, wDest, hDest);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], fileName.split(".")[0] + "_cropped.png", { type: "image/png" });
        onCrop(file);
      }
    }, "image/png");
  };

  return (
    <div className={styles.modalOverlay} style={{ zIndex: 100 }}>
      <div className={styles.modalContent} style={{ maxWidth: "850px" }}>
        <div className={styles.modalHeader}>
          <h3>ตัดรูปภาพ (Crop Image)</h3>
          <button type="button" className={styles.closeBtn} onClick={onCancel} title="ยกเลิก">
            <X size={20} />
          </button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.cropperGrid}>
            <div className={styles.cropperLeft}>
              {ratio !== "original" ? (
                /* Crop Window Container */
                <div
                  ref={containerRef}
                  className={styles.cropArea}
                  style={{
                    width: "390px",
                    height: "480px",
                    cursor: isDragging ? "grabbing" : "grab",
                    touchAction: "none",
                  }}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                >
                  {/* Visual Crop Box borders */}
                  <div
                    className={styles.cropBoxContainer}
                    style={{
                      width: `${cropBox.width}px`,
                      height: `${cropBox.height}px`,
                    }}
                  >
                    <img
                      ref={imageRef}
                      src={imageSrc}
                      alt="To Crop"
                      style={{
                        position: "absolute",
                        width: `${imageMetrics.W_disp}px`,
                        height: `${imageMetrics.H_disp}px`,
                        left: "0px",
                        top: "0px",
                        transform: `translate(${clampedPos.x}px, ${clampedPos.y}px) scale(${zoom})`,
                        transformOrigin: "center center",
                        pointerEvents: "none",
                        maxWidth: "none",
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div
                  className={styles.cropArea}
                  style={{ width: "390px", height: "480px", padding: "10px", backgroundColor: "#1e293b", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <img
                    src={imageSrc}
                    alt="Original"
                    style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                  />
                </div>
              )}
            </div>

            <div className={styles.cropperRight}>
              <p style={{ fontSize: "0.85rem", color: "#64748b", marginTop: 0, marginBottom: "0.5rem", lineHeight: "1.5" }}>
                💡 <strong>คำแนะนำ:</strong><br />
                • สำหรับรูปแชต แนะนำขนาด <strong>3:4 (แนวตั้ง)</strong><br />
                • สำหรับรูปสินค้าทั่วไป แนะนำขนาด <strong>1:1 (จตุรัส)</strong>
              </p>

              <div className={styles.ratioSelector} style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <button
                  type="button"
                  className={`${styles.ratioBtn} ${ratio === "3:4" ? styles.ratioBtnActive : ""}`}
                  onClick={() => setRatio("3:4")}
                >
                  สัดส่วน 3:4 (สำหรับแชตรีวิว)
                </button>
                <button
                  type="button"
                  className={`${styles.ratioBtn} ${ratio === "1:1" ? styles.ratioBtnActive : ""}`}
                  onClick={() => setRatio("1:1")}
                >
                  สัดส่วน 1:1 (รูปภาพจตุรัส)
                </button>
                <button
                  type="button"
                  className={`${styles.ratioBtn} ${ratio === "original" ? styles.ratioBtnActive : ""}`}
                  onClick={() => setRatio("original")}
                >
                  รูปต้นฉบับ (ไม่ตัดรูป)
                </button>
              </div>

              {ratio !== "original" && (
                <div className={styles.cropSliderRow} style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.25rem" }}>
                  <span className={styles.cropSliderLabel}>เลื่อนซูมรูปภาพ:</span>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.01"
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className={styles.cropSlider}
                    style={{ width: "100%" }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
        <div className={styles.modalFooter}>
          <button type="button" className={styles.cancelBtn} onClick={onCancel}>
            ยกเลิก
          </button>
          <button type="button" className={styles.addBtn} onClick={handleSaveCrop}>
            ตัดรูปและใช้งาน
          </button>
        </div>
      </div>
    </div>
  );
}
