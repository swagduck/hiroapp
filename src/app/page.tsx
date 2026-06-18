"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import HistoryTab from "@/components/admin/HistoryTab";
import MenuTab from "@/components/admin/MenuTab";
import PackagesTab from "@/components/admin/PackagesTab";
import OrdersTab from "@/components/admin/OrdersTab";
import AnalyticsTab from "@/components/AnalyticsTab";

import { useDashboardData } from "@/hooks/useDashboardData";
import { Package, PosCartItem, Session } from "@/types";

// Modals
import PosModal from "@/components/admin/modals/PosModal";
import EndSessionModal from "@/components/admin/modals/EndSessionModal";
import PauseSessionModal from "@/components/admin/modals/PauseSessionModal";
import ReceiptModal from "@/components/admin/modals/ReceiptModal";

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
  const [receiptData, setReceiptData] = useState<Session | null>(null);

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
          orderTotal: drinkTotal
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        setIsPosOpen(false);
        setPosSelectedPackage(null);
        setPosCart([]);
        setPosStep(1);
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
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex h-screen bg-[#0a0f0d] overflow-hidden text-stone-200">
      {/* Sidebar (Desktop only) */}
      <aside className="hidden md:flex w-64 glass border-r border-white/10 flex-col transition-all duration-300">
        <div className="h-16 flex items-center justify-center border-b border-white/10">
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-amber-600">
            SpaceManager
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setActiveTab("overview")} className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === "overview" ? "bg-white/10 text-white font-medium" : "text-stone-400 hover:bg-white/5 hover:text-white"}`}>Tổng quan (POS)</button>
          <button onClick={() => setActiveTab("analytics")} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === "analytics" ? "bg-blue-600/20 text-blue-400 font-bold border border-blue-500/30" : "text-stone-400 hover:bg-white/5 hover:text-white"}`}>
            Báo cáo doanh thu
          </button>
          <button onClick={() => setActiveTab("sessions")} className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === "sessions" ? "bg-white/10 text-white font-medium" : "text-stone-400 hover:bg-white/5 hover:text-white"}`}>Phiên sử dụng</button>
          <button onClick={() => setActiveTab("orders")} className={`w-full flex justify-between items-center px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === "orders" ? "bg-emerald-600/20 text-emerald-500 font-bold border border-emerald-500/30" : "text-stone-400 hover:bg-white/5 hover:text-white"}`}>
            <span>Đơn pha chế</span>
            {pendingOrdersCount > 0 && (
              <span className="bg-amber-500 text-stone-900 text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                {pendingOrdersCount}
              </span>
            )}
          </button>
          <button onClick={() => setActiveTab("menu")} className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === "menu" ? "bg-white/10 text-white font-medium" : "text-stone-400 hover:bg-white/5 hover:text-white"}`}>Menu Đồ uống</button>
          <button onClick={() => setActiveTab("settings")} className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === "settings" ? "bg-white/10 text-white font-medium" : "text-stone-400 hover:bg-white/5 hover:text-white"}`}>Cài đặt Gói cước</button>
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
        <header className="h-auto py-3 md:h-16 glass border-b border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between px-4 md:px-6 z-10 relative gap-3 md:gap-0">
          <div className="w-full md:w-auto flex justify-between items-center">
            <h2 className="text-lg font-semibold text-white capitalize">{activeTab === "overview" ? "Tổng quan hoạt động" : activeTab}</h2>
            <button onClick={handleLogout} className="md:hidden text-red-400 text-sm">Đăng xuất</button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <a href="/staff/check-in" target="_blank" rel="noreferrer" className="px-3 md:px-4 py-2 bg-stone-900 border border-white/10 hover:bg-stone-800 text-stone-300 rounded-lg text-xs md:text-sm font-medium transition-colors flex items-center gap-1 md:gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/></svg>
              <span className="hidden md:inline">Máy quét vé</span>
              <span className="md:hidden">Quét vé</span>
            </a>
            <a href="/customer" target="_blank" rel="noreferrer" className="px-3 md:px-4 py-2 bg-stone-900 border border-white/10 hover:bg-stone-800 text-stone-300 rounded-lg text-xs md:text-sm font-medium transition-colors flex items-center gap-1 md:gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>
              <span className="hidden md:inline">App Khách hàng</span>
              <span className="md:hidden">Khách</span>
            </a>
            <button onClick={handleCreateSession} className="px-3 md:px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs md:text-sm font-medium transition-colors shadow-[0_0_15px_rgba(4,120,87,0.4)] ml-auto md:ml-2">
              + Tạo Phiên
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6 z-0 relative">
          {loading ? (
            <div className="flex justify-center items-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-600"></div></div>
          ) : activeTab === "overview" ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-card p-6">
                <h3 className="text-stone-400 text-sm font-medium mb-1">Phiên đang hoạt động</h3>
                <p className="text-3xl font-bold text-white">{sessions.length} <span className="text-sm text-green-400 font-normal">người</span></p>
              </div>
              <div className="glass-card p-6">
                <h3 className="text-stone-400 text-sm font-medium mb-1">Gói cước khả dụng</h3>
                <p className="text-3xl font-bold text-white">{packages.length} <span className="text-sm text-stone-500 font-normal">gói</span></p>
              </div>
              <div className="glass-card p-6">
                <h3 className="text-stone-400 text-sm font-medium mb-1">Doanh thu tạm tính</h3>
                <p className="text-3xl font-bold text-white">
                  {sessions.reduce((acc, curr) => acc + (curr.package?.price || 0), 0).toLocaleString('vi-VN')}đ
                </p>
              </div>

              <div className="col-span-1 md:col-span-3 glass-card mt-4 overflow-hidden">
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                  <h3 className="text-lg font-medium text-white">Danh sách Phiên</h3>
                </div>
                <div className="overflow-x-auto">
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
                        const duration = session.savedMinutesUsed || session.package?.duration;
                        
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
                            <td className="p-4 font-medium text-white">{(session.totalAmount || session.package?.price || 0).toLocaleString('vi-VN')}đ</td>
                            <td className="p-4 text-right">
                              <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                {session.status === 'PENDING' ? (
                                  <button onClick={() => handleApproveSession(session.id)} className="text-sm px-3 py-1.5 rounded bg-emerald-500 hover:bg-emerald-400 text-white font-bold transition-colors shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                                    Đã nhận tiền & Bắt đầu
                                  </button>
                                ) : (
                                  <>
                                    {canPause && (
                                      <button onClick={() => { setSessionToPause(session.id); setPausePhone(""); }} className="text-sm px-3 py-1.5 rounded bg-amber-500/20 text-amber-400 hover:bg-amber-500/40 transition-colors">
                                        Bảo lưu
                                      </button>
                                    )}
                                    <button onClick={() => setSessionToEnd(session.id)} className="text-sm px-3 py-1.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500/40 transition-colors">
                                      Kết thúc
                                    </button>
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
              </div>
            </div>
          ) : activeTab === "analytics" ? (
            <AnalyticsTab />
          ) : activeTab === "sessions" ? (
            <HistoryTab />
          ) : activeTab === "orders" ? (
            <OrdersTab />
          ) : activeTab === "menu" ? (
            <MenuTab />
          ) : activeTab === "settings" ? (
            <PackagesTab />
          ) : null}
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
      <nav className="md:hidden fixed bottom-0 w-full glass border-t border-white/10 flex justify-around p-2 z-50 pb-6 bg-stone-950/90 backdrop-blur-md">
        <button onClick={() => setActiveTab("overview")} className={`flex flex-col items-center p-2 transition-colors ${activeTab === "overview" ? "text-emerald-500" : "text-stone-500 hover:text-stone-400"}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-1"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
          <span className="text-[10px] font-bold tracking-wide uppercase">POS</span>
        </button>
        <button onClick={() => setActiveTab("sessions")} className={`flex flex-col items-center p-2 transition-colors ${activeTab === "sessions" ? "text-emerald-500" : "text-stone-500 hover:text-stone-400"}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-1"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          <span className="text-[10px] font-bold tracking-wide uppercase">Phiên</span>
        </button>
        <button onClick={() => setActiveTab("orders")} className={`relative flex flex-col items-center p-2 transition-colors ${activeTab === "orders" ? "text-emerald-500 font-bold" : "text-stone-500 hover:text-stone-400"}`}>
          {pendingOrdersCount > 0 && (
            <span className="absolute top-0 right-1 w-4 h-4 bg-amber-500 text-stone-900 text-[10px] font-bold flex items-center justify-center rounded-full animate-pulse border border-[#0a0f0d]">
              {pendingOrdersCount}
            </span>
          )}
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-1"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
          <span className="text-[10px] font-bold tracking-wide uppercase">Đơn Pha</span>
        </button>
        <button onClick={() => setActiveTab("menu")} className={`flex flex-col items-center p-2 transition-colors ${activeTab === "menu" ? "text-emerald-500" : "text-stone-500 hover:text-stone-400"}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-1"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" x2="6" y1="2" y2="4"/><line x1="10" x2="10" y1="2" y2="4"/><line x1="14" x2="14" y1="2" y2="4"/></svg>
          <span className="text-[10px] font-bold tracking-wide uppercase">Menu</span>
        </button>
        <button onClick={() => setActiveTab("settings")} className={`flex flex-col items-center p-2 transition-colors ${activeTab === "settings" ? "text-emerald-500" : "text-stone-500 hover:text-stone-400"}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-1"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
          <span className="text-[10px] font-bold tracking-wide uppercase">Cài đặt</span>
        </button>
      </nav>

    </div>
  );
}
