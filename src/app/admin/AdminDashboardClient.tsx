"use client";

import { useState, useMemo, useDeferredValue } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Swal from "sweetalert2";
import { Menu } from "lucide-react";
import styles from "./admin.module.css";
import AdminSidebar from "./sidebar/AdminSidebar";
import DashboardOverview from "./dashboard/DashboardOverview";
import OrdersAndSlipsManager from "./orders-slips/OrdersAndSlipsManager";
import ProductInventoryManager from "./products-inventory/ProductInventoryManager";
import OrderSlipVerificationModal from "./orders-slips/OrderSlipVerificationModal";
import CustomerAddressDetailsModal from "./orders-slips/CustomerAddressDetailsModal";

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

interface Order {
  id: string;
  product_id: string | null;
  quantity: number;
  total_amount: number;
  customer_name: string | null;
  customer_tel: string | null;
  customer_address: string | null;
  status: string; // 'pending' | 'slip_uploaded' | 'verified' | 'rejected'
  slip_url: string | null;
  slip_verified: boolean;
  verified_by: string | null;
  created_at: string;
  products?: {
    name: string;
  } | null;
  items?: any;
}

interface Props {
  initialProducts: Product[];
  initialOrders: Order[];
}

export default function AdminDashboardClient({ initialProducts, initialOrders }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Navigation tab state derived from search params
  const viewParam = searchParams.get("view");
  const activeTab = (viewParam === "orders" || viewParam === "products" || viewParam === "dashboard")
    ? viewParam
    : "dashboard";

  // Sidebar state for mobile drawer
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleTabChange = (tab: "dashboard" | "orders" | "products") => {
    if (tab === "products") {
      setShowProductModal(false);
      setEditingProduct(null);
    }
    router.push(`/admin?view=${tab}`);
    setIsSidebarOpen(false);
  };

  // Product CRUD states
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Order Details / Slip Preview states
  const [showSlipModal, setShowSlipModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [selectedAddressOrder, setSelectedAddressOrder] = useState<Order | null>(null);
  const [orderFilter, setOrderFilter] = useState<"all" | "slip_uploaded" | "verified" | "rejected" | "pending">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Loading States for API buttons
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Sidebar count of pending slips (status = 'slip_uploaded') - Memoized to prevent recalculation on every render
  const pendingSlipsCount = useMemo(() => {
    return initialOrders.filter((o) => o.status === "slip_uploaded").length;
  }, [initialOrders]);

  // Dashboard Stats Calculations - Memoized to prevent recalculation on every render
  const totalSales = useMemo(() => {
    return initialOrders
      .filter((o) => o.status === "verified")
      .reduce((sum, o) => sum + Number(o.total_amount), 0);
  }, [initialOrders]);

  const verifiedOrdersCount = useMemo(() => {
    return initialOrders.filter((o) => o.status === "verified").length;
  }, [initialOrders]);

  // Order Verification Actions
  const handleAutoVerify = async (orderId: string) => {
    setActionLoading(orderId);
    Swal.fire({
      title: "กำลังตรวจสอบสลิปอัตโนมัติ...",
      text: "กรุณารอสักครู่ ระบบกำลังเรียก EasySlip API เพื่ออ่านและตรวจสอบความถูกต้อง",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const res = await fetch(`/api/orders/${orderId}/verify`, { method: "POST" });
      const data = await res.json();

      if (res.ok) {
        Swal.fire({
          icon: "success",
          title: "ยืนยันสลิปสำเร็จ!",
          text: data.message || "ออเดอร์นี้ได้รับการปรับปรุงสถานะเป็นตรวจสอบเรียบร้อยแล้ว",
          confirmButtonText: "ตกลง",
          confirmButtonColor: "#10b981",
        });
        setShowSlipModal(false);
        router.refresh();
      } else {
        Swal.fire({
          icon: "error",
          title: "ไม่สามารถยืนยันอัตโนมัติได้",
          text: data.error || "เกิดข้อผิดพลาดในการดึงข้อมูล EasySlip",
          confirmButtonText: "รับทราบ",
          confirmButtonColor: "#f59e0b",
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด!",
        text: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ในการตรวจสอบได้",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleManualApprove = async (orderId: string) => {
    setActionLoading(orderId);
    Swal.fire({
      title: "กำลังบันทึกการอนุมัติแมนนวล...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const res = await fetch(`/api/orders/${orderId}/manual-approve`, { method: "POST" });
      const data = await res.json();

      if (res.ok) {
        Swal.fire({
          icon: "success",
          title: "อนุมัติเรียบร้อย!",
          text: data.message || "คำสั่งซื้อได้รับการยืนยันโดยผู้ดูแลระบบแล้ว",
          confirmButtonText: "ตกลง",
          confirmButtonColor: "#1e3a8a",
        });
        setShowSlipModal(false);
        router.refresh();
      } else {
        Swal.fire({
          icon: "error",
          title: "ล้มเหลว!",
          text: data.error || "ไม่สามารถดำเนินการอนุมัติได้",
          confirmButtonText: "ตกลง",
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด!",
        text: "เกิดปัญหาในการเชื่อมต่อเซิร์ฟเวอร์",
        confirmButtonText: "ตกลง",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectOrder = async (orderId: string) => {
    const confirm = await Swal.fire({
      title: "ปฏิเสธสลิปหลักฐานการโอนเงิน?",
      text: "การปฏิเสธจะยกเลิกสถานะออเดอร์นี้ และคืนจำนวนสินค้าที่หักไว้กลับเข้าสต็อกดังเดิม คุณต้องการดำเนินการต่อหรือไม่?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "ใช่, ปฏิเสธสลิป",
      cancelButtonText: "ยกเลิก",
    });

    if (!confirm.isConfirmed) return;

    setActionLoading(orderId);
    Swal.fire({
      title: "กำลังส่งผลการปฏิเสธ...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const res = await fetch(`/api/orders/${orderId}/reject`, { method: "POST" });
      const data = await res.json();

      if (res.ok) {
        Swal.fire({
          icon: "success",
          title: "ปฏิเสธรายการเรียบร้อย!",
          text: "ระบบได้ยกเลิกออเดอร์และคืนยอดจำนวนสินค้าเข้าสต็อกแล้ว",
          confirmButtonText: "ตกลง",
          confirmButtonColor: "#ef4444",
        });
        setShowSlipModal(false);
        router.refresh();
      } else {
        Swal.fire({
          icon: "error",
          title: "ไม่สามารถทำรายการได้",
          text: data.error || "เกิดข้อผิดพลาดในการยกเลิกออเดอร์",
          confirmButtonText: "ตกลง",
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด!",
        text: "เกิดปัญหาในการเชื่อมต่อเซิร์ฟเวอร์",
        confirmButtonText: "ตกลง",
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Product Delete Action
  const handleDeleteProduct = async (productId: string, productName: string) => {
    const confirm = await Swal.fire({
      title: `ต้องการลบสินค้าหรือไม่?`,
      text: `คุณกำลังจะลบสินค้า "${productName}" การดำเนินการนี้ไม่สามารถย้อนกลับได้`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "ลบสินค้า",
      cancelButtonText: "ยกเลิก",
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch(`/api/admin/products?id=${productId}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (res.ok) {
        Swal.fire({
          icon: "success",
          title: "ลบสินค้าสำเร็จ!",
          timer: 1500,
          showConfirmButton: false,
        });
        router.refresh();
      } else {
        Swal.fire({
          icon: "error",
          title: "ลบสินค้าไม่สำเร็จ",
          text: data.error || "เกิดข้อผิดพลาดในการลบสินค้า",
          confirmButtonText: "ตกลง",
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด!",
        text: "ไม่สามารถเชื่อมต่อเพื่อลบสินค้าได้",
        confirmButtonText: "ตกลง",
      });
    }
  };

  // Helper to format date in Thai timezone
  const formatThaiDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("th-TH", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }) + " น.";
    } catch {
      return dateStr;
    }
  };

  // Delete individual order action
  const handleDeleteOrder = async (orderId: string) => {
    const confirm = await Swal.fire({
      title: "ต้องการลบออเดอร์นี้หรือไม่?",
      html: "การดำเนินการนี้จะลบข้อมูลคำสั่งซื้อออกจากระบบ<br/>และไม่สามารถย้อนกลับได้",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "ลบข้อมูล",
      cancelButtonText: "ยกเลิก",
    });

    if (!confirm.isConfirmed) return;

    setActionLoading(orderId);
    try {
      const res = await fetch(`/api/admin/orders?id=${orderId}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (res.ok) {
        Swal.fire({
          icon: "success",
          title: "ลบออเดอร์สำเร็จ!",
          timer: 1500,
          showConfirmButton: false,
        });
        router.refresh();
      } else {
        Swal.fire({
          icon: "error",
          title: "ลบไม่สำเร็จ",
          text: data.error || "เกิดข้อผิดพลาดในการลบออเดอร์",
          confirmButtonText: "ตกลง",
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด!",
        text: "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์เพื่อลบออเดอร์ได้",
        confirmButtonText: "ตกลง",
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Use React 18 Deferred Value for search query to prevent input lag/delay.
  // This defers the expensive filtering and re-rendering of the orders table list.
  const deferredSearchQuery = useDeferredValue(searchQuery);

  // Filter and Search Orders - Memoized and deferred to prevent render blocking on keypress
  const filteredOrders = useMemo(() => {
    return initialOrders
      .filter((order) => {
        // 1. Tab Status Filter
        if (orderFilter === "slip_uploaded" && order.status !== "slip_uploaded") return false;
        if (orderFilter === "verified" && order.status !== "verified") return false;
        if (orderFilter === "rejected" && order.status !== "rejected") return false;
        if (orderFilter === "pending" && order.status !== "pending") return false;
        return true;
      })
      .filter((order) => {
        // 2. Search Box Query (Customer details or orderId)
        if (!deferredSearchQuery) return true;
        const q = deferredSearchQuery.toLowerCase();
        return (
          order.id.toLowerCase().includes(q) ||
          (order.customer_name && order.customer_name.toLowerCase().includes(q)) ||
          (order.customer_tel && order.customer_tel.includes(q)) ||
          (order.customer_address && order.customer_address.toLowerCase().includes(q))
        );
      });
  }, [initialOrders, orderFilter, deferredSearchQuery]);

  // Display status in Thai
  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "รอโอนเงิน (Pending)";
      case "slip_uploaded":
        return "รอตรวจสลิป (Slip Uploaded)";
      case "verified":
        return "ชำระเงินสำเร็จ (Verified)";
      case "rejected":
        return "ปฏิเสธสลิป / ยกเลิก (Rejected)";
      default:
        return status;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "pending":
        return styles.statusPending;
      case "slip_uploaded":
        return styles.statusUploaded;
      case "verified":
        return styles.statusVerified;
      case "rejected":
        return styles.statusRejected;
      default:
        return "";
    }
  };

  return (
    <div className={styles.dashboardLayout}>
      {/* Sidebar Overlay for mobile screen */}
      {isSidebarOpen && (
        <div
          className={styles.sidebarOverlay}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <AdminSidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        pendingSlipsCount={pendingSlipsCount}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Mobile Top Navbar */}
      <div className={styles.mobileNavbar}>
        <button
          onClick={() => setIsSidebarOpen(true)}
          className={styles.menuToggleBtn}
          title="เปิดเมนู"
        >
          <Menu size={24} />
        </button>
        <span 
          className={styles.mobileNavbarTitle}
          onClick={() => router.push("/")}
          style={{ cursor: "pointer" }}
          title="กลับไปหน้าหลัก"
        >
          CRYSTAL DREAMS
        </span>
        <div style={{ position: "relative", width: "24px", height: "24px" }}>
          {pendingSlipsCount > 0 && (
            <span className={styles.mobileBadge}>{pendingSlipsCount}</span>
          )}
        </div>
      </div>

      {/* Right Main Content Panel */}
      <main className={styles.contentPanel}>
        {/* VIEW 1: DASHBOARD VIEW */}
        {activeTab === "dashboard" && (
          <DashboardOverview
            totalSales={totalSales}
            verifiedOrdersCount={verifiedOrdersCount}
            pendingSlipsCount={pendingSlipsCount}
            initialOrders={initialOrders}
            formatThaiDate={formatThaiDate}
            getStatusText={getStatusText}
            getStatusBadgeClass={getStatusBadgeClass}
            onViewAllOrders={() => handleTabChange("orders")}
            onSelectAddressOrder={(order) => {
              setSelectedAddressOrder(order);
              setShowAddressModal(true);
            }}
          />
        )}

        {/* VIEW 2: ORDERS & SLIPS VIEW */}
        {activeTab === "orders" && (
          <OrdersAndSlipsManager
            initialOrders={initialOrders}
            filteredOrders={filteredOrders}
            orderFilter={orderFilter}
            onSetOrderFilter={setOrderFilter}
            searchQuery={searchQuery}
            onSetSearchQuery={setSearchQuery}
            formatThaiDate={formatThaiDate}
            getStatusText={getStatusText}
            getStatusBadgeClass={getStatusBadgeClass}
            onSelectAddressOrder={(order) => {
              setSelectedAddressOrder(order);
              setShowAddressModal(true);
            }}
            onSelectOrder={(order) => {
              setSelectedOrder(order);
              setShowSlipModal(true);
            }}
            onDeleteOrder={handleDeleteOrder}
            actionLoading={actionLoading}
          />
        )}

        {/* VIEW 3: PRODUCT MANAGEMENT VIEW */}
        {activeTab === "products" && (
          <ProductInventoryManager
            initialProducts={initialProducts}
            showProductModal={showProductModal}
            onSetShowProductModal={setShowProductModal}
            editingProduct={editingProduct}
            onSetEditingProduct={setEditingProduct}
            onDeleteProduct={handleDeleteProduct}
            onSaveSuccess={() => {
              setShowProductModal(false);
              setEditingProduct(null);
              router.refresh();
            }}
            onCancel={() => {
              setShowProductModal(false);
              setEditingProduct(null);
            }}
          />
        )}
      </main>

      {/* ORDER SLIP VERIFICATION MODAL */}
      <OrderSlipVerificationModal
        showSlipModal={showSlipModal}
        onSetShowSlipModal={setShowSlipModal}
        selectedOrder={selectedOrder}
        actionLoading={actionLoading}
        getStatusText={getStatusText}
        getStatusBadgeClass={getStatusBadgeClass}
        onAutoVerify={handleAutoVerify}
        onManualApprove={handleManualApprove}
        onRejectOrder={handleRejectOrder}
        ordersList={filteredOrders.filter((o) => o.slip_url)}
        onSelectOrder={setSelectedOrder}
      />

      {/* CUSTOMER ADDRESS DETAILS MODAL */}
      <CustomerAddressDetailsModal
        showAddressModal={showAddressModal}
        onSetShowAddressModal={setShowAddressModal}
        selectedAddressOrder={selectedAddressOrder}
      />
    </div>
  );
}
