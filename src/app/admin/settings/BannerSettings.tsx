"use client";

import { useState } from "react";
import { GripVertical, Eye, EyeOff, RefreshCw, Save } from "lucide-react";
import Swal from "sweetalert2";

export interface BannerItem {
  url: string;
  name: string;
  visible: boolean;
}

interface BannerSettingsProps {
  banners: BannerItem[];
  setBanners: React.Dispatch<React.SetStateAction<BannerItem[]>>;
  styles: any;
}

export default function BannerSettings({ banners, setBanners, styles }: BannerSettingsProps) {
  const [uploadingBanners, setUploadingBanners] = useState(false);
  const [isDragOverUpload, setIsDragOverUpload] = useState(false);
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

  const handleBannerFiles = async (files: FileList) => {
    if (files.length === 0) return;

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
        const newBanners: BannerItem[] = data.urls.map((url: string) => ({
          url,
          name: "",
          visible: true,
        }));
        setBanners((prev) => [...prev, ...newBanners]);
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
    }
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleBannerFiles(e.target.files);
      e.target.value = "";
    }
  };

  const removeBanner = (index: number) => {
    Swal.fire({
      title: "ยืนยันการลบ?",
      text: `คุณต้องการลบแบนเนอร์ "${banners[index]?.name || "แบนเนอร์นี้"}" ใช่หรือไม่?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "ใช่, ลบเลย",
      cancelButtonText: "ยกเลิก",
    }).then((result) => {
      if (result.isConfirmed) {
        setBanners((prev) => prev.filter((_, i) => i !== index));
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: "ลบรูปแบนเนอร์สำเร็จ",
          showConfirmButton: false,
          timer: 1500,
        });
      }
    });
  };

  const showPreviewModal = (url: string) => {
    Swal.fire({
      imageUrl: url,
      imageAlt: "Banner Preview",
      showConfirmButton: false,
      showCloseButton: false,
      width: "800px",
      background: "transparent",
    });
  };

  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: "1rem",
        padding: "2rem",
        border: "1px solid #e2e8f0",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
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
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
          padding: "0.5rem 0",
        }}>
          {banners.map((banner, idx) => {
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
                  border: isDragged ? "2px dashed #0037ad" : "1px solid #e2e8f0",
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
                  e.currentTarget.style.borderColor = isDragged ? "#0037ad" : "#e2e8f0";
                }}
              >
                {/* Banner Image Container */}
                <div
                  onClick={() => showPreviewModal(banner.url)}
                  title="คลิกเพื่อดูรูปภาพขนาดเต็ม"
                  style={{
                    position: "relative",
                    width: "100%",
                    height: "110px",
                    backgroundColor: "#f1f5f9",
                    cursor: "pointer",
                  }}
                >
                  <img
                    src={banner.url}
                    alt={banner.name || `Banner ${idx + 1}`}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                      opacity: banner.visible ? 1 : 0.4,
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
                    backdropFilter: "blur(4px)",
                  }}>
                    {idx + 1}
                  </span>

                  {/* Invisible status badge */}
                  {!banner.visible && (
                    <span style={{
                      position: "absolute",
                      top: "0.5rem",
                      right: "0.5rem",
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      color: "#ffffff",
                      backgroundColor: "#ef4444",
                      padding: "0.15rem 0.4rem",
                      borderRadius: "0.25rem",
                    }}>
                      ปิดใช้งาน
                    </span>
                  )}
                </div>

                {/* Footer details & action inside card */}
                <div style={{
                  padding: "0.75rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                  borderTop: "1px solid #f1f5f9",
                  backgroundColor: "#f8fafc",
                  flexGrow: 1,
                }}>
                  {/* Name input */}
                  <input
                    type="text"
                    value={banner.name}
                    placeholder="ตั้งชื่อแบนเนอร์..."
                    onChange={(e) => {
                      const newName = e.target.value;
                      setBanners((prev) => prev.map((item, i) => i === idx ? { ...item, name: newName } : item));
                    }}
                    style={{
                      fontSize: "0.75rem",
                      color: "#334155",
                      border: "1px solid #cbd5e1",
                      borderRadius: "0.375rem",
                      padding: "0.3rem 0.5rem",
                      width: "100%",
                      outline: "none",
                      backgroundColor: "#ffffff",
                      fontWeight: 500,
                    }}
                  />

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
                    {/* Grip Handle and Text */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", overflow: "hidden", flexGrow: 1 }}>
                      <div style={{ color: "#94a3b8", display: "flex", alignItems: "center", cursor: "grab" }}>
                        <GripVertical size={14} />
                      </div>
                      <span
                        title={banner.url}
                        style={{
                          fontSize: "0.65rem",
                          color: "#64748b",
                          textOverflow: "ellipsis",
                          overflow: "hidden",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {banner.url.substring(banner.url.lastIndexOf("/") + 1) || banner.url}
                      </span>
                    </div>

                    {/* Actions Group */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", flexShrink: 0 }}>
                      {/* Enable/Disable Eye Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setBanners((prev) => prev.map((item, i) => i === idx ? { ...item, visible: !item.visible } : item));
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          color: banner.visible ? "#0037ad" : "#94a3b8",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          padding: "0.35rem",
                          borderRadius: "0.375rem",
                          backgroundColor: "transparent",
                          transition: "all 0.2s",
                        }}
                        title={banner.visible ? "เปิดใช้งานอยู่ (แสดงในหน้าแรก)" : "ปิดการใช้งาน (ซ่อนจากหน้าแรก)"}
                      >
                        {banner.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeBanner(idx);
                        }}
                        style={{
                          padding: "0.3rem 0.5rem",
                          borderRadius: "0.375rem",
                          border: "1px solid #fee2e2",
                          backgroundColor: "#fee2e2",
                          color: "#ef4444",
                          cursor: "pointer",
                          fontSize: "0.7rem",
                          fontWeight: "bold",
                          transition: "all 0.15s ease",
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
                </div>
              </div>
            );
          })}

          {/* Drag and Drop File Upload Card with Plus sign */}
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOverUpload(true);
            }}
            onDragLeave={() => setIsDragOverUpload(false)}
            onDrop={async (e) => {
              e.preventDefault();
              setIsDragOverUpload(false);
              const files = e.dataTransfer.files;
              if (files && files.length > 0) {
                await handleBannerFiles(files);
              }
            }}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: "220px",
              height: "172px",
              border: isDragOverUpload ? "2px dashed #0037ad" : "2px dashed #cbd5e1",
              borderRadius: "0.75rem",
              backgroundColor: isDragOverUpload ? "#eff6ff" : "#f8fafc",
              cursor: "pointer",
              transition: "all 0.2s ease",
              gap: "0.5rem",
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.02)",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#0037ad";
              e.currentTarget.style.backgroundColor = "#eff6ff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = isDragOverUpload ? "#0037ad" : "#cbd5e1";
              e.currentTarget.style.backgroundColor = isDragOverUpload ? "#eff6ff" : "#f8fafc";
            }}
          >
            <RefreshCw className={uploadingBanners ? styles.spinIcon : ""} style={{ display: uploadingBanners ? "block" : "none" }} size={24} />
            <span style={{ display: uploadingBanners ? "none" : "block", fontSize: "2rem", color: "#64748b", fontWeight: 300, lineHeight: 1 }}>+</span>
            <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>
              {uploadingBanners ? "กำลังอัปโหลด..." : "อัปโหลด / ลากไฟล์ที่นี่"}
            </span>
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
  );
}
