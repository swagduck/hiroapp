"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const HistoryTab = dynamic(() => import("@/components/admin/HistoryTab"));
const MenuTab = dynamic(() => import("@/components/admin/MenuTab"));
const PackagesTab = dynamic(() => import("@/components/admin/PackagesTab"));
const OrdersTab = dynamic(() => import("@/components/admin/OrdersTab"));
const AnalyticsTab = dynamic(() => import("@/components/AnalyticsTab"));
const ActivityLogTab = dynamic(() => import("@/components/admin/ActivityLogTab"));
const StaffTab = dynamic(() => import("@/components/admin/StaffTab"));
const VouchersTab = dynamic(() => import("@/components/admin/VouchersTab"));
const InventoryTab = dynamic(() => import("@/components/admin/InventoryTab"));
const CashbookTab = dynamic(() => import("@/components/admin/CashbookTab"));
const PersonnelTab = dynamic(() => import("@/components/admin/PersonnelTab"));
const ShiftsStaffTab = dynamic(() => import("@/components/admin/ShiftsStaffTab"));
const CRMTab = dynamic(() => import("@/components/admin/CRMTab"));

import { useDashboardData } from "@/hooks/useDashboardData";
import { Package, PosCartItem, Session } from "@/types";

// Modals
const PosModal = dynamic(() => import("@/components/admin/modals/PosModal"));
const EndSessionModal = dynamic(() => import("@/components/admin/modals/EndSessionModal"));
const PauseSessionModal = dynamic(() => import("@/components/admin/modals/PauseSessionModal"));
const ReceiptModal = dynamic(() => import("@/components/admin/modals/ReceiptModal"));

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  
  const { 
    sessions, packages, menuItems, pendingOrdersCount, loading, refreshData 
  } = useDashboardData();

  const [sessionToEnd, setSessionToEnd] = useState<string | null>(null);
  
  // POS States
  const [isPosOpen, setIsPosOpen] = useState(false);
  const [posStep, setPosStep] = useState<number>(1);
  const [posSelectedPackage, setPosSelectedPackage] = useState<Package | null>(null);
  const [posCart, setPosCart] = useState<PosCartItem[]>([]);
  const [posLoading, setPosLoading] = useState(false);
  const [posPaymentStatus, setPosPaymentStatus] = useState<"PAID" | "UNPAID" | "QR">("PAID");
  const [receiptData, setReceiptData] = useState<Session | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<"ADMIN" | "STAFF" | null>(null);

  // Pause Session States
  const [sessionToPause, setSessionToPause] = useState<string | null>(null);
  const [pausePhone, setPausePhone] = useState("");
  const [isPausing, setIsPausing] = useState(false);

  // Use Saved Time States
  const [savedTimePhone, setSavedTimePhone] = useState("");
  const [savedTimeResult, setSavedTimeResult] = useState<{minutes: number, name?: string} | null>(null);
  const [isCheckingSavedTime, setIsCheckingSavedTime] = useState(false);

  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateSession = () => {
    setIsPosOpen(true);
    setPosStep(1);
    setPosCart([]);
    setPosSelectedPackage(null);
  };

  const confirmEndSession = async () => {
    if (!sessionToEnd) return;
    try {
      const res = await fetch(`/api/sessions/${sessionToEnd}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'end' })
      });
      if (res.ok) {
        refreshData();
        setSessionToEnd(null);
      } else {
        toast.error("Có lỗi khi kết thúc phiên!");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const confirmPauseSession = async () => {
    if (!sessionToPause || !pausePhone) return;
    setIsPausing(true);
    try {
      const res = await fetch(`/api/sessions/${sessionToPause}/pause`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: pausePhone })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Bảo lưu thành công ${data.savedMinutes} phút!`);
        setSessionToPause(null);
        refreshData();
      } else {
        toast.error(data.error || "Có lỗi xảy ra");
      }
    } catch (error) {
      toast.error("Lỗi hệ thống khi bảo lưu");
    } finally {
      setIsPausing(false);
    }
  };

  const handleCheckSavedTime = async () => {
    if (!savedTimePhone) return;
    setIsCheckingSavedTime(true);
    try {
      const res = await fetch(`/api/users/check-saved-time?phone=${savedTimePhone}`);
      const data = await res.json();
      if (res.ok) {
        setSavedTimeResult({ minutes: data.savedMinutes, name: data.name });
      } else {
        toast.error(data.error || "Có lỗi xảy ra");
      }
    } catch (e) {
      toast.error("Lỗi kiểm tra giờ bảo lưu");
    } finally {
      setIsCheckingSavedTime(false);
    }
  };

  const handleApproveSession = async (id: string) => {
    try {
      const res = await fetch(`/api/sessions/${id}/approve`, { method: "POST" });
      if (res.ok) {
        toast.success("Đã duyệt đơn và bắt đầu tính giờ!");
        refreshData();
      } else {
        toast.error("Có lỗi xảy ra khi duyệt");
      }
    } catch (e) {
      toast.error("Lỗi kết nối");
    }
  };

  const handleUseSavedTime = async () => {
    if (!savedTimePhone || !savedTimeResult || savedTimeResult.minutes <= 0) return;
    try {
      const res = await fetch(`/api/sessions/use-saved-time`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: savedTimePhone, minutesToUse: savedTimeResult.minutes })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Tạo phiên thành công bằng giờ bảo lưu! Mã truy cập: ${data.accessCode}`);
        setIsPosOpen(false);
        setSavedTimePhone("");
        setSavedTimeResult(null);
        refreshData();
      } else {
        toast.error(data.error || "Có lỗi xảy ra");
      }
    } catch (e) {
      toast.error("Lỗi khi tạo phiên bằng giờ bảo lưu");
    }
  };

  const handleCompleteOrder = async () => {
    setPosLoading(true);
    try {
      let drinkTotal = posCart.reduce((acc, item) => acc + item.price * item.quantity, 0);
      let modifiedOrderItems = [...posCart];
      if (posSelectedPackage?.includesDrink && posCart.length > 0) {
        drinkTotal -= posCart[0].price;
        modifiedOrderItems[0] = { ...modifiedOrderItems[0], price: 0 };
      }

      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: posSelectedPackage?.id,
          orderItems: modifiedOrderItems,
          orderTotal: drinkTotal,
          paymentStatus: posPaymentStatus === "QR" ? "PAID" : posPaymentStatus
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        setIsPosOpen(false);
        setPosSelectedPackage(null);
        setPosCart([]);
        setPosStep(1);
        setPosPaymentStatus("PAID");
        setReceiptData(data);
        refreshData();
      } else {
        toast.error("Có lỗi tạo phiên");
      }
    } catch(e) {
      console.error(e);
    }
    setPosLoading(false);
  };

  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Cập nhật mỗi phút
    
    // Fetch current user role
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data && data.role) {
          setCurrentUserRole(data.role);
        }
      })
      .catch(e => console.error("Error fetching user:", e));

    return () => clearInterval(interval);
  }, []);

  // Client-side fallback for auto-ending sessions
  useEffect(() => {
    const autoEndInterval = setInterval(() => {
      fetch('/api/cron/auto-end', {
        headers: { 'x-client-cron': 'true' }
      }).catch(() => {});
    }, 5 * 60 * 1000); // 5 phút

    // Chạy lần đầu khi load dashboard
    fetch('/api/cron/auto-end', {
      headers: { 'x-client-cron': 'true' }
    }).catch(() => {});

    return () => clearInterval(autoEndInterval);
  }, []);

  return (
    <div className="flex h-screen bg-[#0a0f0d] overflow-hidden text-stone-200">
      {/* Sidebar (Desktop only) */}
      <aside className="hidden md:flex w-64 glass border-r border-white/10 flex-col transition-all duration-300">
        <div className="h-16 flex items-center justify-center border-b border-white/10 px-2">
          <h1 className="text-lg text-center font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-amber-600">
            Hiro coffee and Study space
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setActiveTab("overview")} className={`w-full flex items-center gap-3 px-5 py-3 rounded-full transition-all duration-300 ${activeTab === "overview" ? "bg-emerald-500/20 text-emerald-400 font-bold premium-shadow border border-emerald-500/30" : "text-stone-400 hover:bg-white/5 hover:text-white hover:translate-x-1"}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            Tổng quan (POS)
          </button>
          
          {currentUserRole === 'ADMIN' && (
            <button onClick={() => setActiveTab("analytics")} className={`w-full flex items-center gap-3 px-5 py-3 rounded-full transition-all duration-300 ${activeTab === "analytics" ? "bg-emerald-500/20 text-emerald-400 font-bold premium-shadow border border-emerald-500/30" : "text-stone-400 hover:bg-white/5 hover:text-white hover:translate-x-1"}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
              Báo cáo doanh thu
            </button>
          )}

          <button onClick={() => setActiveTab("sessions")} className={`w-full flex items-center gap-3 px-5 py-3 rounded-full transition-all duration-300 ${activeTab === "sessions" ? "bg-emerald-500/20 text-emerald-400 font-bold premium-shadow border border-emerald-500/30" : "text-stone-400 hover:bg-white/5 hover:text-white hover:translate-x-1"}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            Phiên sử dụng
          </button>
          <button onClick={() => setActiveTab("activity")} className={`w-full flex items-center gap-3 px-5 py-3 rounded-full transition-all duration-300 ${activeTab === "activity" ? "bg-amber-600/20 text-amber-500 font-bold border border-amber-500/30 premium-shadow" : "text-stone-400 hover:bg-white/5 hover:text-white hover:translate-x-1"}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            Nhật ký Giao dịch
          </button>
          <button onClick={() => setActiveTab("orders")} className={`w-full flex justify-between items-center px-5 py-3 rounded-full transition-all duration-300 ${activeTab === "orders" ? "bg-emerald-600/20 text-emerald-500 font-bold border border-emerald-500/30 premium-shadow" : "text-stone-400 hover:bg-white/5 hover:text-white hover:translate-x-1"}`}>
            <div className="flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" y1="2" x2="6" y2="4"/><line x1="10" y1="2" x2="10" y2="4"/><line x1="14" y1="2" x2="14" y2="4"/></svg>
              <span>Đơn pha chế</span>
            </div>
            {pendingOrdersCount > 0 && (
              <span className="bg-emerald-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse">{pendingOrdersCount}</span>
            )}
          </button>
          <button onClick={() => setActiveTab("menu")} className={`w-full flex items-center gap-3 px-5 py-3 rounded-full transition-all duration-300 ${activeTab === "menu" ? "bg-emerald-500/20 text-emerald-400 font-bold premium-shadow border border-emerald-500/30" : "text-stone-400 hover:bg-white/5 hover:text-white hover:translate-x-1"}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
            Menu Đồ uống
          </button>
          
          {currentUserRole === 'ADMIN' && (
            <>
              <button onClick={() => setActiveTab("inventory")} className={`w-full flex items-center gap-3 px-5 py-3 rounded-full transition-all duration-300 ${activeTab === "inventory" ? "bg-rose-600/20 text-rose-500 font-bold border border-rose-500/30 premium-shadow" : "text-stone-400 hover:bg-white/5 hover:text-white hover:translate-x-1"}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
                Quản lý Kho
              </button>
              <button onClick={() => setActiveTab("packages")} className={`w-full flex items-center gap-3 px-5 py-3 rounded-full transition-all duration-300 ${activeTab === "packages" ? "bg-emerald-500/20 text-emerald-400 font-bold premium-shadow border border-emerald-500/30" : "text-stone-400 hover:bg-white/5 hover:text-white hover:translate-x-1"}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                Cài đặt Gói cước
              </button>
              <button onClick={() => setActiveTab("vouchers")} className={`w-full flex items-center gap-3 px-5 py-3 rounded-full transition-all duration-300 ${activeTab === "vouchers" ? "bg-purple-600/20 text-purple-400 font-bold border border-purple-500/30 premium-shadow" : "text-stone-400 hover:bg-white/5 hover:text-white hover:translate-x-1"}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21 16-4 4-4-4"/><path d="M17 20V4"/><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/></svg>
                <span>Khuyến Mãi</span>
              </button>
              <button onClick={() => setActiveTab("crm")} className={`w-full flex items-center gap-3 px-5 py-3 rounded-full transition-all duration-300 ${activeTab === "crm" ? "bg-pink-600/20 text-pink-500 font-bold border border-pink-500/30 premium-shadow" : "text-stone-400 hover:bg-white/5 hover:text-white hover:translate-x-1"}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                <span>Khách Hàng</span>
              </button>
              <button onClick={() => setActiveTab("cashbook")} className={`w-full flex items-center gap-3 px-5 py-3 rounded-full transition-all duration-300 ${activeTab === "cashbook" ? "bg-amber-500/20 text-amber-400 font-bold premium-shadow border border-amber-500/30" : "text-stone-400 hover:bg-white/5 hover:text-white hover:translate-x-1"}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                Sổ Quỹ Thu Chi
              </button>
              <button onClick={() => setActiveTab("personnel")} className={`w-full flex items-center gap-3 px-5 py-3 rounded-full transition-all duration-300 ${activeTab === "personnel" ? "bg-blue-600/20 text-blue-500 font-bold border border-blue-500/30 premium-shadow" : "text-stone-400 hover:bg-white/5 hover:text-white hover:translate-x-1"}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                Nhân Sự & Ca
              </button>
            </>
          )}

          {currentUserRole === 'STAFF' && (
            <button onClick={() => setActiveTab("personnel")} className={`w-full flex items-center gap-3 px-5 py-3 rounded-full transition-all duration-300 ${activeTab === "personnel" ? "bg-cyan-600/20 text-cyan-400 font-bold border border-cyan-500/30 premium-shadow" : "text-stone-400 hover:bg-white/5 hover:text-white hover:translate-x-1"}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              Chấm Công
            </button>
          )}

          <div className="pt-4 mt-2 border-t border-white/5 space-y-2">
            <button onClick={() => window.open("/checkin", "_blank")} className="w-full flex items-center justify-between px-5 py-3 rounded-full bg-purple-600/10 text-purple-400 font-bold border border-purple-500/20 hover:bg-purple-600/20 hover:border-purple-500/40 transition-all duration-300 group hover-glow">
              <div className="flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                <span>Màn hình Check-in</span>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </button>
            <button onClick={() => window.open("/kds", "_blank")} className="w-full flex items-center justify-between px-5 py-3 rounded-full bg-cyan-600/10 text-cyan-400 font-bold border border-cyan-500/20 hover:bg-cyan-600/20 hover:border-cyan-500/40 transition-all duration-300 group hover-glow">
              <div className="flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>
                <span>Màn hình KDS</span>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </button>
          </div>
        </nav>
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-green-700 to-emerald-600 flex items-center justify-center font-bold text-white shadow-lg">AD</div>
              <div>
                <p className="text-sm font-medium text-white">Admin</p>
                <p className="text-xs text-stone-400">Quản trị viên</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-stone-400 hover:text-red-400 transition-colors"
              title="Đăng xuất"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative w-full">
        <header className="sticky top-0 h-auto py-3 md:h-16 glass-panel border-b border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between px-4 md:px-6 z-30 relative gap-3 md:gap-0 backdrop-blur-xl">
          <div className="w-full md:w-auto flex justify-between items-center">
            <h2 className="text-xl font-bold text-white capitalize tracking-tight">{activeTab === "overview" ? "Tổng quan hoạt động" : activeTab === "settings" ? "Cài đặt & Khác" : activeTab}</h2>
            <button onClick={handleLogout} className="md:hidden p-2 bg-red-500/10 text-red-400 text-sm rounded-full font-medium">Đăng xuất</button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a href="/staff/check-in" target="_blank" rel="noreferrer" className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-stone-300 rounded-full text-xs md:text-sm font-medium transition-all flex items-center gap-2 hover-glow">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/></svg>
              <span className="hidden md:inline">Máy quét vé</span>
            </a>

            <button onClick={handleCreateSession} className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white rounded-full text-sm font-bold transition-all premium-shadow hover:-translate-y-0.5 ml-auto md:ml-2 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
              Tạo Phiên
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6 z-0 relative">
          {loading ? (
            <div className="flex justify-center items-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-600"></div></div>
          ) : (
            <>
            <div className={activeTab === "overview" ? "block" : "hidden"}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Overtime Alerts */}
              {(() => {
                const overtimeSessions = sessions.filter(s => {
                  if (s.status !== 'ACTIVE' && s.status !== 'PENDING') return false;
                  const baseDuration = s.savedMinutesUsed || s.package?.duration;
                  if (!baseDuration) return false;
                  const duration = baseDuration + (s.extraMinutes || 0);
                  const expireTime = new Date(s.startTime).getTime() + duration * 60000;
                  return expireTime <= currentTime.getTime();
                });
                
                if (overtimeSessions.length === 0) return null;
                
                return (
                  <div className="col-span-1 md:col-span-3 bg-red-500/10 border border-red-500/50 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between animate-pulse">
                    <div className="flex items-center gap-3 mb-2 md:mb-0">
                      <div className="w-10 h-10 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                      </div>
                      <div>
                        <h3 className="text-red-500 font-bold text-lg">Cảnh Báo Lố Giờ</h3>
                        <p className="text-stone-300 text-sm">Hiện có <span className="font-bold text-red-400">{overtimeSessions.length} phiên</span> đã hết thời gian sử dụng!</p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="glass-panel p-6 flex justify-between items-center hover-glow transition-all group">
                <div>
                  <h3 className="text-stone-400 text-sm font-bold uppercase tracking-wider mb-2 group-hover:text-emerald-400 transition-colors">Phiên đang hoạt động</h3>
                  <p className="text-4xl font-black text-white">{sessions.length} <span className="text-sm text-green-400 font-medium">người</span></p>
                </div>
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
              </div>
              <div className="glass-panel p-6 flex justify-between items-center hover-glow transition-all group">
                <div>
                  <h3 className="text-stone-400 text-sm font-bold uppercase tracking-wider mb-2 group-hover:text-blue-400 transition-colors">Gói cước khả dụng</h3>
                  <p className="text-4xl font-black text-white">{packages.length} <span className="text-sm text-blue-400 font-medium">gói</span></p>
                </div>
                <div className="w-14 h-14 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                </div>
              </div>
              <div className="glass-panel p-6 flex justify-between items-center hover-glow transition-all group">
                <div>
                  <h3 className="text-stone-400 text-sm font-bold uppercase tracking-wider mb-2 group-hover:text-amber-400 transition-colors">Doanh thu tạm tính</h3>
                  <p className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-amber-200 to-amber-500">
                    {sessions.reduce((acc, curr) => acc + (curr.package?.price || 0), 0).toLocaleString('vi-VN')}đ
                  </p>
                </div>
                <div className="w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
                </div>
              </div>

              <div className="col-span-1 md:col-span-3 glass-panel mt-4 overflow-hidden">
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                  <h3 className="text-lg font-medium text-white">Danh sách Phiên</h3>
                </div>
                
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/5 text-stone-400 text-sm border-b border-white/10">
                        <th className="p-4 font-medium">Mã truy cập</th>
                        <th className="p-4 font-medium">Gói cước</th>
                        <th className="p-4 font-medium">Bắt đầu</th>
                        <th className="p-4 font-medium">Thời gian</th>
                        <th className="p-4 font-medium">Link gọi món (Quét QR)</th>
                        <th className="p-4 font-medium">Cần thu (Tạm tính)</th>
                        <th className="p-4 font-medium text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {sessions.length === 0 ? (
                        <tr><td colSpan={6} className="p-4 text-center text-stone-500">Chưa có phiên nào hoạt động</td></tr>
                      ) : sessions.map((session) => {
                        const startTime = new Date(session.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                        
                        let timeStatus: React.ReactNode = "Không giới hạn";
                        let baseDuration = session.savedMinutesUsed || session.package?.duration;
                        const duration = baseDuration ? baseDuration + (session.extraMinutes || 0) : null;
                        
                        let canPause = false;
                        if (duration) {
                          const expireTime = new Date(session.startTime).getTime() + duration * 60000;
                          const remaining = expireTime - currentTime.getTime();
                          
                          if (remaining <= 0) {
                            timeStatus = <span className="text-red-500 font-bold bg-red-500/10 px-2 py-1 rounded">Đã hết giờ</span>;
                          } else {
                            canPause = true;
                            const hours = Math.floor(remaining / 3600000);
                            const minutes = Math.floor((remaining % 3600000) / 60000);
                            timeStatus = <span className="text-green-400">Còn {hours}h {minutes}m</span>;
                          }
                        }

                        const hasPendingExtension = session.orders?.find((o: any) => o.isExtension && o.status === 'PENDING');
                        if (hasPendingExtension) {
                          timeStatus = (
                            <div className="flex flex-col gap-1">
                              <div>{timeStatus}</div>
                              <span className="text-[10px] text-purple-400 font-bold bg-purple-500/20 px-2 py-0.5 rounded animate-pulse w-fit">
                                Xin gia hạn (+{hasPendingExtension.totalAmount.toLocaleString('vi-VN')}đ)
                              </span>
                            </div>
                          );
                        }

                        return (
                          <tr key={session.id} className={`border-b border-white/5 transition-colors group ${session.status === 'PENDING' ? 'bg-amber-900/10 hover:bg-amber-900/20' : 'hover:bg-white/5'}`}>
                            <td className="p-4 font-mono text-emerald-500 font-bold">
                              #{session.accessCode}
                              {session.user ? (
                                <div className="text-xs font-sans text-amber-400 mt-1 flex items-center gap-1">
                                  <span>👑</span> Hội viên: {session.user.name}
                                </div>
                              ) : (
                                <div className="text-xs font-sans text-stone-500 mt-1">
                                  Khách vãng lai
                                </div>
                              )}
                            </td>
                            <td className="p-4 text-stone-300">{session.package?.name || "Không rõ"}</td>
                            <td className="p-4 text-stone-400">{session.status === 'PENDING' ? '---' : startTime}</td>
                            <td className="p-4 font-medium">
                              {session.status === 'PENDING' ? <span className="text-amber-500 animate-pulse">Chờ duyệt</span> : timeStatus}
                            </td>
                            <td className="p-4 text-blue-400">
                              <div className="flex flex-col gap-2">
                                <a href={`/customer/${session.accessCode}`} target="_blank" rel="noreferrer" className="hover:underline text-sm">
                                  Mở Menu KH
                                </a>
                                <button onClick={() => setReceiptData(session)} className="text-left text-sm text-stone-400 hover:text-white transition-colors">
                                  🖨️ Xem/In Biên Lai
                                </button>
                              </div>
                            </td>
                            <td className="p-4 font-medium text-white">
                              <div className="flex flex-col gap-1">
                                <span>{(session.totalAmount || session.package?.price || 0).toLocaleString('vi-VN')}đ</span>
                                {session.paymentStatus === 'UNPAID' ? (
                                  <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded w-fit">Chưa thu</span>
                                ) : (
                                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded w-fit">Đã thu</span>
                                )}
                              </div>
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                {session.status === 'PENDING' ? (
                                  <button onClick={() => handleApproveSession(session.id)} className="text-sm px-3 py-1.5 rounded bg-emerald-500 hover:bg-emerald-400 text-white font-bold transition-colors shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                                    Đã nhận tiền & Bắt đầu
                                  </button>
                                ) : (
                                  <>
                                    {session.orders?.find((o: any) => o.isExtension && o.status === 'PENDING') && (
                                      <div className="flex gap-2">
                                        <button 
                                          onClick={async () => {
                                            const extOrder = session.orders?.find((o: any) => o.isExtension && o.status === 'PENDING');
                                            if (!extOrder) return;
                                            try {
                                              const res = await fetch(`/api/orders/${extOrder.id}/approve-extension`, { method: "POST" });
                                              if (res.ok) {
                                                toast.success("Đã duyệt gia hạn thành công!");
                                                refreshData();
                                              } else {
                                                toast.error("Có lỗi xảy ra");
                                              }
                                            } catch(e) {
                                              toast.error("Lỗi kết nối");
                                            }
                                          }} 
                                          className="text-sm px-3 py-1.5 rounded bg-purple-500 hover:bg-purple-400 text-white font-bold transition-colors shadow-[0_0_10px_rgba(168,85,247,0.4)] animate-pulse"
                                        >
                                          Duyệt gia hạn
                                        </button>
                                        <button 
                                          onClick={async () => {
                                            const extOrder = session.orders?.find((o: any) => o.isExtension && o.status === 'PENDING');
                                            if (!extOrder) return;
                                            if (!confirm("Bạn có chắc muốn từ chối yêu cầu gia hạn này?")) return;
                                            try {
                                              const res = await fetch(`/api/orders/${extOrder.id}`, { 
                                                method: "PUT",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify({ status: "CANCELLED" })
                                              });
                                              if (res.ok) {
                                                toast.success("Đã từ chối gia hạn!");
                                                refreshData();
                                              } else {
                                                toast.error("Có lỗi xảy ra");
                                              }
                                            } catch(e) {
                                              toast.error("Lỗi kết nối");
                                            }
                                          }} 
                                          className="text-sm px-3 py-1.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500/40 transition-colors"
                                        >
                                          Từ chối
                                        </button>
                                      </div>
                                    )}
                                    {canPause && (
                                      <button onClick={() => { setSessionToPause(session.id); setPausePhone(""); }} className="text-sm px-3 py-1.5 rounded bg-amber-500/20 text-amber-400 hover:bg-amber-500/40 transition-colors">
                                        Bảo lưu
                                      </button>
                                    )}
                                    <button onClick={() => setSessionToEnd(session.id)} className="text-sm px-3 py-1.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500/40 transition-colors">
                                      Kết thúc
                                    </button>
                                    {session.paymentStatus === 'UNPAID' && (
                                      <button 
                                        onClick={async () => {
                                          try {
                                            const res = await fetch(`/api/sessions/${session.id}`, {
                                              method: 'PUT',
                                              headers: { 'Content-Type': 'application/json' },
                                              body: JSON.stringify({ action: 'markPaid' })
                                            });
                                            if (res.ok) {
                                              toast.success("Đã ghi nhận thanh toán!");
                                              refreshData();
                                            }
                                          } catch(e) {
                                            toast.error("Lỗi kết nối");
                                          }
                                        }} 
                                        className="text-sm px-3 py-1.5 rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/40 transition-colors"
                                      >
                                        Đã Thu Tiền
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden flex flex-col gap-4 p-4">
                  {sessions.length === 0 ? (
                    <div className="text-center text-stone-500 p-4">Chưa có phiên nào hoạt động</div>
                  ) : sessions.map((session) => {
                    const startTime = new Date(session.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                        
                    let timeStatus: React.ReactNode = "Không giới hạn";
                    let baseDuration = session.savedMinutesUsed || session.package?.duration;
                    const duration = baseDuration ? baseDuration + (session.extraMinutes || 0) : null;
                    
                    let canPause = false;
                    if (duration) {
                      const expireTime = new Date(session.startTime).getTime() + duration * 60000;
                      const remaining = expireTime - currentTime.getTime();
                      
                      if (remaining <= 0) {
                        timeStatus = <span className="text-red-500 font-bold bg-red-500/10 px-2 py-1 rounded text-xs">Đã hết giờ</span>;
                      } else {
                        canPause = true;
                        const hours = Math.floor(remaining / 3600000);
                        const minutes = Math.floor((remaining % 3600000) / 60000);
                        timeStatus = <span className="text-green-400 text-xs">Còn {hours}h {minutes}m</span>;
                      }
                    }

                    const hasPendingExtension = session.orders?.find((o: any) => o.isExtension && o.status === 'PENDING');

                    return (
                      <div key={session.id} className="bg-[#141c16] border border-stone-800 rounded-2xl flex flex-col relative overflow-hidden premium-shadow">
                        {/* Top half */}
                        <div className="p-5 pb-6 bg-gradient-to-br from-stone-900 to-[#141c16] relative">
                          {session.status === 'PENDING' && (
                            <div className="absolute top-0 right-0 bg-amber-500 text-stone-900 text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-md">
                              Chờ duyệt
                            </div>
                          )}
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-mono text-emerald-500 font-black text-xl tracking-tight">#{session.accessCode}</span>
                                {hasPendingExtension && (
                                  <span className="text-[10px] text-purple-400 font-bold bg-purple-500/20 px-2 py-0.5 rounded animate-pulse border border-purple-500/30">
                                    +Xin gia hạn
                                  </span>
                                )}
                              </div>
                              <p className="text-sm font-bold text-stone-200">{session.package?.name || "Không rõ"}</p>
                              {session.user ? (
                                <p className="text-xs text-amber-400 mt-1 font-medium flex items-center gap-1">👑 Hội viên: {session.user.name}</p>
                              ) : (
                                <p className="text-xs text-stone-500 mt-1 flex items-center gap-1">Khách vãng lai</p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-stone-400 mb-1">{session.status === 'PENDING' ? '---' : startTime}</p>
                              <div className="font-medium bg-stone-950/50 px-2 py-1 rounded-lg inline-block border border-stone-800">{timeStatus}</div>
                            </div>
                          </div>
                        </div>

                        {/* Cutout Divider */}
                        <div className="relative flex items-center justify-center -my-3 z-10">
                           <div className="w-6 h-6 rounded-full bg-[#0a0f0d] absolute -left-3 border-r border-stone-800 shadow-[inset_-2px_0_4px_rgba(0,0,0,0.5)]"></div>
                           <div className="w-full border-t-2 border-dashed border-stone-700/50"></div>
                           <div className="w-6 h-6 rounded-full bg-[#0a0f0d] absolute -right-3 border-l border-stone-800 shadow-[inset_2px_0_4px_rgba(0,0,0,0.5)]"></div>
                        </div>

                        {/* Bottom half */}
                        <div className="p-5 pt-6 bg-[#141c16]">
                          <div className="flex justify-between items-end">
                            <div>
                              <p className="text-[10px] text-stone-500 font-bold mb-1 uppercase tracking-widest">Cần thu</p>
                              <div className="flex items-center gap-2">
                                <span className="font-black text-2xl text-white">{(session.totalAmount || session.package?.price || 0).toLocaleString('vi-VN')}đ</span>
                                {session.paymentStatus === 'UNPAID' ? (
                                  <span className="text-[10px] bg-red-500/20 text-red-400 font-bold px-2 py-1 rounded border border-red-500/20">Chưa thu</span>
                                ) : (
                                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-1 rounded border border-emerald-500/20">Đã thu</span>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <a href={`/customer/${session.accessCode}`} target="_blank" rel="noreferrer" className="w-10 h-10 flex items-center justify-center bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-xl transition-colors border border-blue-500/10" title="Mở Menu KH">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>
                              </a>
                              <button onClick={() => setReceiptData(session)} className="w-10 h-10 flex items-center justify-center bg-stone-800 text-stone-300 hover:bg-stone-700 hover:text-white rounded-xl transition-colors border border-stone-700" title="In Biên Lai">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
                              </button>
                              <button onClick={() => setSessionToEnd(session.id)} className="w-10 h-10 flex items-center justify-center bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-xl transition-colors border border-red-500/10" title="Kết thúc">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/></svg>
                              </button>
                            </div>
                          </div>
                        
                        {/* Mobile Action Buttons for Pending or Unpaid */}
                        {(session.status === 'PENDING' || session.paymentStatus === 'UNPAID' || hasPendingExtension) && (
                          <div className="flex flex-col gap-2 border-t border-white/5 pt-3 mt-1">
                            {session.status === 'PENDING' && (
                              <button onClick={() => handleApproveSession(session.id)} className="w-full py-2 rounded-lg bg-emerald-500 text-white font-bold text-sm">
                                Đã nhận tiền & Bắt đầu
                              </button>
                            )}
                            {hasPendingExtension && (
                              <div className="grid grid-cols-2 gap-2">
                                <button onClick={async () => {
                                  const extOrder = session.orders?.find((o: any) => o.isExtension && o.status === 'PENDING');
                                  if (!extOrder) return;
                                  try {
                                    const res = await fetch(`/api/orders/${extOrder.id}/approve-extension`, { method: "POST" });
                                    if (res.ok) refreshData();
                                  } catch(e) {}
                                }} className="py-2 rounded-lg bg-purple-500 text-white font-bold text-sm">
                                  Duyệt gia hạn
                                </button>
                                <button onClick={async () => {
                                  const extOrder = session.orders?.find((o: any) => o.isExtension && o.status === 'PENDING');
                                  if (!extOrder) return;
                                  if (!confirm("Từ chối gia hạn?")) return;
                                  try {
                                    const res = await fetch(`/api/orders/${extOrder.id}`, { 
                                      method: "PUT",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ status: "CANCELLED" })
                                    });
                                    if (res.ok) refreshData();
                                  } catch(e) {}
                                }} className="py-2 rounded-lg bg-stone-800 text-stone-300 font-bold text-sm border border-white/10">
                                  Từ chối
                                </button>
                              </div>
                            )}
                            {session.paymentStatus === 'UNPAID' && session.status !== 'PENDING' && (
                              <button onClick={async () => {
                                try {
                                  const res = await fetch(`/api/sessions/${session.id}`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ action: 'markPaid' })
                                  });
                                  if (res.ok) refreshData();
                                } catch(e) {}
                              }} className="w-full py-2 rounded-lg bg-blue-500/20 text-blue-400 font-bold text-sm border border-blue-500/30">
                                Xác nhận Đã Thu Tiền
                              </button>
                            )}
                          </div>
                        )}
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>
              </div>
            </div>
            
            <div className={activeTab === "analytics" ? "block" : "hidden"}>
              <AnalyticsTab />
            </div>
            <div className={activeTab === "sessions" ? "block" : "hidden"}>
              <HistoryTab />
            </div>
            <div className={activeTab === "activity" ? "block" : "hidden"}>
              <ActivityLogTab />
            </div>
            <div className={activeTab === "orders" ? "block" : "hidden"}>
              <OrdersTab />
            </div>
            <div className={activeTab === "menu" ? "block" : "hidden"}>
              <MenuTab role={currentUserRole} />
            </div>
            
            {currentUserRole === 'ADMIN' && (
              <>
                <div className={activeTab === "packages" ? "block" : "hidden"}>
                  <PackagesTab />
                </div>
                <div className={activeTab === "staff" ? "block" : "hidden"}>
                  <StaffTab />
                </div>
                <div className={activeTab === "vouchers" ? "block" : "hidden"}>
                  <VouchersTab />
                </div>
                <div className={activeTab === "crm" ? "block" : "hidden"}>
                  <CRMTab />
                </div>
                <div className={activeTab === "inventory" ? "block" : "hidden"}>
                  <InventoryTab />
                </div>
                <div className={activeTab === "cashbook" ? "block" : "hidden"}>
                  <CashbookTab />
                </div>
                <div className={activeTab === "personnel" ? "block" : "hidden"}>
                  {currentUserRole === 'ADMIN' ? <PersonnelTab /> : <ShiftsStaffTab />}
                </div>
              </>
            )}

            <div className={activeTab === "settings" ? "block" : "hidden"}>
              <div className="flex flex-col gap-4 max-w-md mx-auto w-full pt-4 pb-24">
              <h3 className="text-xl font-bold text-white mb-2">Cài đặt & Tính năng</h3>
              
              {currentUserRole === 'ADMIN' && (
                <button onClick={() => setActiveTab('analytics')} className="bg-stone-900 border border-white/10 p-5 rounded-2xl flex items-center justify-between text-left hover:bg-stone-800 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-lg">Báo cáo doanh thu</h4>
                      <p className="text-sm text-stone-400">Xem biểu đồ và thống kê</p>
                    </div>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-stone-500"><path d="m9 18 6-6-6-6"/></svg>
                </button>
              )}

              {currentUserRole === 'ADMIN' && (
                <button onClick={() => setActiveTab('inventory')} className="bg-stone-900 border border-white/10 p-5 rounded-2xl flex items-center justify-between text-left hover:bg-stone-800 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-lg">Quản lý Kho</h4>
                      <p className="text-sm text-stone-400">Nguyên liệu & Định mức</p>
                    </div>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-stone-500"><path d="m9 18 6-6-6-6"/></svg>
                </button>
              )}

              <button onClick={() => setActiveTab('activity')} className="bg-stone-900 border border-white/10 p-5 rounded-2xl flex items-center justify-between text-left hover:bg-stone-800 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-lg">Nhật ký Giao dịch</h4>
                    <p className="text-sm text-stone-400">Xem lịch sử hoạt động</p>
                  </div>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-stone-500"><path d="m9 18 6-6-6-6"/></svg>
              </button>

              {currentUserRole === 'ADMIN' && (
                <>
                  <button onClick={() => setActiveTab('packages')} className="bg-stone-900 border border-white/10 p-5 rounded-2xl flex items-center justify-between text-left hover:bg-stone-800 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-lg">Cài đặt Gói cước</h4>
                        <p className="text-sm text-stone-400">Quản lý các gói giờ</p>
                      </div>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-stone-500"><path d="m9 18 6-6-6-6"/></svg>
                  </button>

                  <button onClick={() => setActiveTab('personnel')} className="bg-stone-900 border border-white/10 p-5 rounded-2xl flex items-center justify-between text-left hover:bg-stone-800 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-lg">Nhân Sự & Ca Làm</h4>
                        <p className="text-sm text-stone-400">Tài khoản & Chấm công</p>
                      </div>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-stone-500"><path d="m9 18 6-6-6-6"/></svg>
                  </button>
                  
                  <button onClick={() => setActiveTab('crm')} className="bg-stone-900 border border-white/10 p-5 rounded-2xl flex items-center justify-between text-left hover:bg-stone-800 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-lg">Khách Hàng</h4>
                        <p className="text-sm text-stone-400">Quản lý CRM & Quyền lợi</p>
                      </div>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-stone-500"><path d="m9 18 6-6-6-6"/></svg>
                  </button>
                </>
              )}

              <a href="/checkin" target="_blank" rel="noreferrer" className="bg-emerald-900/20 border border-emerald-500/30 p-5 rounded-2xl flex items-center justify-between text-left hover:bg-emerald-900/40 transition-colors mt-2">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-emerald-400 text-lg">Màn hình Check-in</h4>
                    <p className="text-sm text-emerald-500/70">Mở trên thiết bị cho khách</p>
                  </div>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </a>
            </div>
            </div>
            </>
          )}
        </div>
      </main>

      <EndSessionModal 
        sessionToEnd={sessionToEnd} 
        onClose={() => setSessionToEnd(null)} 
        onConfirm={confirmEndSession} 
      />

      <PauseSessionModal 
        sessionToPause={sessionToPause} 
        pausePhone={pausePhone}
        setPausePhone={setPausePhone}
        isPausing={isPausing}
        onClose={() => setSessionToPause(null)} 
        onConfirm={confirmPauseSession} 
      />

      <PosModal 
        isPosOpen={isPosOpen}
        setIsPosOpen={setIsPosOpen}
        posStep={posStep}
        setPosStep={setPosStep}
        packages={packages}
        menuItems={menuItems}
        posSelectedPackage={posSelectedPackage}
        setPosSelectedPackage={setPosSelectedPackage}
        posCart={posCart}
        setPosCart={setPosCart}
        savedTimePhone={savedTimePhone}
        setSavedTimePhone={setSavedTimePhone}
        isCheckingSavedTime={isCheckingSavedTime}
        handleCheckSavedTime={handleCheckSavedTime}
        savedTimeResult={savedTimeResult}
        handleUseSavedTime={handleUseSavedTime}
        posLoading={posLoading}
        posPaymentStatus={posPaymentStatus}
        setPosPaymentStatus={setPosPaymentStatus}
        handleCompleteOrder={handleCompleteOrder}
      />

      <ReceiptModal 
        receiptData={receiptData}
        onClose={() => setReceiptData(null)}
        onApprove={(id) => {
          handleApproveSession(id);
          setReceiptData(null);
        }}
      />

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-6 left-4 right-4 z-50 pointer-events-none">
        <nav className="pointer-events-auto bg-stone-900/95 backdrop-blur-xl border border-stone-800 flex justify-around p-2 rounded-2xl mobile-nav-pill">
          <button onClick={() => setActiveTab("overview")} className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-all duration-300 ${activeTab === "overview" ? "bg-emerald-500/15 text-emerald-400" : "text-stone-500 hover:text-stone-400 hover:bg-white/5"}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`mb-0.5 ${activeTab === "overview" ? "scale-110" : ""}`}><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
            <span className="text-[9px] font-bold tracking-wider uppercase">POS</span>
          </button>
          <button onClick={() => setActiveTab("sessions")} className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-all duration-300 ${activeTab === "sessions" ? "bg-emerald-500/15 text-emerald-400" : "text-stone-500 hover:text-stone-400 hover:bg-white/5"}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`mb-0.5 ${activeTab === "sessions" ? "scale-110" : ""}`}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <span className="text-[9px] font-bold tracking-wider uppercase">Phiên</span>
          </button>
          <button onClick={() => setActiveTab("orders")} className={`relative flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-all duration-300 ${activeTab === "orders" ? "bg-emerald-500/15 text-emerald-400" : "text-stone-500 hover:text-stone-400 hover:bg-white/5"}`}>
            {pendingOrdersCount > 0 && (
              <span className="absolute top-0.5 right-1.5 w-4 h-4 bg-amber-500 text-stone-900 text-[10px] font-black flex items-center justify-center rounded-full animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.5)]">
                {pendingOrdersCount}
              </span>
            )}
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`mb-0.5 ${activeTab === "orders" ? "scale-110" : ""}`}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
            <span className="text-[9px] font-bold tracking-wider uppercase">Đơn Pha</span>
          </button>
          <button onClick={() => setActiveTab("menu")} className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-all duration-300 ${activeTab === "menu" ? "bg-emerald-500/15 text-emerald-400" : "text-stone-500 hover:text-stone-400 hover:bg-white/5"}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`mb-0.5 ${activeTab === "menu" ? "scale-110" : ""}`}><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" x2="6" y1="2" y2="4"/><line x1="10" x2="10" y1="2" y2="4"/><line x1="14" x2="14" y1="2" y2="4"/></svg>
            <span className="text-[9px] font-bold tracking-wider uppercase">Menu</span>
          </button>
          <button onClick={() => setActiveTab("settings")} className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-all duration-300 ${activeTab === "settings" ? "bg-emerald-500/15 text-emerald-400" : "text-stone-500 hover:text-stone-400 hover:bg-white/5"}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`mb-0.5 ${activeTab === "settings" ? "scale-110" : ""}`}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
            <span className="text-[9px] font-bold tracking-wider uppercase">Cài đặt</span>
          </button>
        </nav>
      </div>

    </div>
  );
}
