"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { QRCodeCanvas } from 'qrcode.react';

import HistoryTab from "@/components/admin/HistoryTab";
import MenuTab from "@/components/admin/MenuTab";
import PackagesTab from "@/components/admin/PackagesTab";
import OrdersTab from "@/components/admin/OrdersTab";
import AnalyticsTab from "@/components/AnalyticsTab";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [sessions, setSessions] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionToEnd, setSessionToEnd] = useState<string | null>(null);
  
  // POS States
  const [isPosOpen, setIsPosOpen] = useState(false);
  const [posStep, setPosStep] = useState<number>(1);
  const [posSelectedPackage, setPosSelectedPackage] = useState<any>(null);
  const [posCart, setPosCart] = useState<any[]>([]);
  const [posLoading, setPosLoading] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);

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

  const fetchData = async () => {
    try {
      const [resSessions, resPackages, resMenu] = await Promise.all([
        fetch('/api/sessions'),
        fetch('/api/packages'),
        fetch('/api/menu')
      ]);
      const dataSessions = await resSessions.json();
      const dataPackages = await resPackages.json();
      const dataMenu = await resMenu.json();
      
      setSessions(dataSessions);
      setPackages(dataPackages);
      setMenuItems(dataMenu);
    } catch (error) {
      console.error("Lỗi lấy dữ liệu:", error);
    } finally {
      setLoading(false);
    }
  };

  const [now, setNow] = useState(new Date());

  useEffect(() => {
    fetchData();
    // Refresh mỗi 30s
    const interval = setInterval(() => {
      fetchData();
      setNow(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateSession = () => {
    setIsPosOpen(true);
    setPosStep(1);
    setPosCart([]);
    setPosSelectedPackage(null);
  };

  const handleEndSession = (id: string) => {
    setSessionToEnd(id);
  };

  const handlePauseSession = (id: string) => {
    setSessionToPause(id);
    setPausePhone("");
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
        fetchData();
        setSessionToEnd(null);
      } else {
        alert("Có lỗi khi kết thúc phiên!");
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
        alert(`Bảo lưu thành công ${data.savedMinutes} phút!`);
        setSessionToPause(null);
        fetchData();
      } else {
        alert(data.error || "Có lỗi xảy ra");
      }
    } catch (error) {
      alert("Lỗi hệ thống khi bảo lưu");
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
        alert(data.error || "Có lỗi xảy ra");
      }
    } catch (e) {
      alert("Lỗi kiểm tra giờ bảo lưu");
    } finally {
      setIsCheckingSavedTime(false);
    }
  };

  const handleApproveSession = async (id: string) => {
    try {
      const res = await fetch(`/api/sessions/${id}/approve`, { method: "POST" });
      if (res.ok) {
        alert("Đã duyệt đơn và bắt đầu tính giờ!");
        fetchData();
      } else {
        alert("Có lỗi xảy ra khi duyệt");
      }
    } catch (e) {
      alert("Lỗi kết nối");
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
        alert(`Tạo phiên thành công bằng giờ bảo lưu! Mã truy cập: ${data.accessCode}`);
        setIsPosOpen(false);
        setSavedTimePhone("");
        setSavedTimeResult(null);
        fetchData();
      } else {
        alert(data.error || "Có lỗi xảy ra");
      }
    } catch (e) {
      alert("Lỗi khi tạo phiên bằng giờ bảo lưu");
    }
  };

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
            Đơn pha chế
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
                          const remaining = expireTime - now.getTime();
                          
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
                              {session.user && <div className="text-xs font-sans text-amber-400 mt-1">KH: {session.user.name}</div>}
                            </td>
                            <td className="p-4 text-stone-300">{session.package?.name || "Không rõ"}</td>
                            <td className="p-4 text-stone-400">{session.status === 'PENDING' ? '---' : startTime}</td>
                            <td className="p-4 font-medium">
                              {session.status === 'PENDING' ? <span className="text-amber-500 animate-pulse">Chờ duyệt</span> : timeStatus}
                            </td>
                            <td className="p-4 text-blue-400">
                              <a href={`/customer/${session.accessCode}`} target="_blank" rel="noreferrer" className="hover:underline">
                                Mở Menu KH
                              </a>
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
                                      <button onClick={() => handlePauseSession(session.id)} className="text-sm px-3 py-1.5 rounded bg-amber-500/20 text-amber-400 hover:bg-amber-500/40 transition-colors">
                                        Bảo lưu
                                      </button>
                                    )}
                                    <button onClick={() => handleEndSession(session.id)} className="text-sm px-3 py-1.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500/40 transition-colors">
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

      {/* Confirmation Modal */}
      {sessionToEnd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#141c16]/60 backdrop-blur-sm">
          <div className="bg-stone-950 border border-white/10 rounded-2xl p-6 w-[400px] shadow-2xl transform transition-all animate-page-transition">
            <h3 className="text-xl font-bold text-white mb-2">Kết thúc phiên</h3>
            <p className="text-stone-400 mb-6">Bạn có chắc chắn muốn kết thúc phiên sử dụng này không? Khách hàng sẽ không thể truy cập mã này nữa.</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setSessionToEnd(null)} 
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={confirmEndSession} 
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold shadow-[0_0_15px_rgba(225,29,72,0.4)] transition-colors"
              >
                Xác nhận Kết thúc
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pause Session Modal */}
      {sessionToPause && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#141c16]/60 backdrop-blur-sm">
          <div className="bg-stone-950 border border-amber-500/30 rounded-2xl p-6 w-[400px] shadow-2xl transform transition-all animate-page-transition">
            <h3 className="text-xl font-bold text-amber-500 mb-2 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              Bảo lưu thời gian
            </h3>
            <p className="text-stone-400 mb-4 text-sm">Nhập số điện thoại của khách hàng để lưu lại số phút chưa sử dụng. Phiên hiện tại sẽ được kết thúc ngay lập tức.</p>
            
            <input 
              type="tel"
              placeholder="Nhập SĐT (VD: 0901234567)"
              value={pausePhone}
              onChange={e => setPausePhone(e.target.value)}
              className="w-full bg-stone-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 mb-6"
              autoFocus
            />

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setSessionToPause(null)} 
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors"
                disabled={isPausing}
              >
                Hủy bỏ
              </button>
              <button 
                onClick={confirmPauseSession} 
                disabled={!pausePhone || isPausing}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white font-bold shadow-[0_0_15px_rgba(217,119,6,0.4)] transition-colors disabled:opacity-50"
              >
                {isPausing ? "Đang xử lý..." : "Bảo lưu & Kết thúc"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POS Modal */}
      {isPosOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#141c16]/90 backdrop-blur-md p-2 md:p-6 pb-20 md:pb-6">
          <div className="bg-stone-950 border border-white/10 rounded-2xl w-full max-w-6xl h-full flex flex-col shadow-2xl overflow-hidden animate-page-transition">
            {/* Header */}
            <div className="h-14 md:h-16 border-b border-white/10 flex items-center justify-between px-4 md:px-6 bg-white/5">
              <div className="flex items-center gap-4">
                <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                  Tạo Đơn (POS)
                </h2>
                {posStep > 1 && (
                  <div className="hidden md:flex items-center gap-2 text-sm">
                    <span className={`px-2 py-1 rounded ${posStep >= 1 ? 'bg-emerald-500/20 text-emerald-400' : 'text-stone-500'}`}>1. Chọn gói</span>
                    <span className="text-stone-600">→</span>
                    <span className={`px-2 py-1 rounded ${posStep >= 2 ? 'bg-emerald-500/20 text-emerald-400' : 'text-stone-500'}`}>2. Menu Nước</span>
                    <span className="text-stone-600">→</span>
                    <span className={`px-2 py-1 rounded ${posStep >= 3 ? 'bg-emerald-500/20 text-emerald-400' : 'text-stone-500'}`}>3. Thanh toán</span>
                  </div>
                )}
              </div>
              <button onClick={() => setIsPosOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-stone-300 transition-colors">✕</button>
            </div>
            
            {/* Body */}
            <div className="flex-1 flex flex-col overflow-hidden relative bg-[#141c16]/20">
              
              {/* STEP 1: CHỌN GÓI CƯỚC */}
              {posStep === 1 && (
                <div className="p-6 h-full overflow-y-auto animate-fade-in flex flex-col">
                  
                  {/* Khu vực Sử dụng Giờ bảo lưu */}
                  <div className="max-w-5xl mx-auto w-full mb-8 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6">
                    <h4 className="text-amber-500 font-bold mb-4 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      Tra cứu & Sử dụng Giờ bảo lưu
                    </h4>
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
                      <div className="flex-1 w-full">
                        <label className="block text-xs text-stone-400 mb-1">Số điện thoại khách hàng</label>
                        <div className="flex gap-2">
                          <input 
                            type="tel"
                            placeholder="Nhập SĐT..."
                            value={savedTimePhone}
                            onChange={e => setSavedTimePhone(e.target.value)}
                            className="flex-1 bg-stone-900 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-amber-500"
                          />
                          <button 
                            onClick={handleCheckSavedTime}
                            disabled={!savedTimePhone || isCheckingSavedTime}
                            className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-white rounded-xl transition-colors disabled:opacity-50 whitespace-nowrap"
                          >
                            {isCheckingSavedTime ? "Đang tra..." : "Kiểm tra"}
                          </button>
                        </div>
                      </div>
                      
                      {savedTimeResult && (
                        <div className="flex-1 w-full bg-stone-950 rounded-xl p-3 border border-white/5 flex items-center justify-between">
                          <div>
                            <p className="text-xs text-stone-400">Kết quả tra cứu</p>
                            <p className="text-sm">
                              Khách có: <span className="text-amber-500 font-bold text-lg">{savedTimeResult.minutes} phút</span>
                            </p>
                          </div>
                          {savedTimeResult.minutes > 0 ? (
                            <button 
                              onClick={handleUseSavedTime}
                              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg transition-colors text-sm shadow-[0_0_10px_rgba(217,119,6,0.3)]"
                            >
                              Tạo phiên ngay
                            </button>
                          ) : (
                            <span className="text-xs text-stone-500 italic">Không khả dụng</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-4 mb-8">
                    <div className="h-px bg-white/10 flex-1 max-w-xs"></div>
                    <h3 className="text-xl font-bold text-stone-300">Hoặc chọn Mua gói cước mới</h3>
                    <div className="h-px bg-white/10 flex-1 max-w-xs"></div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-5xl mx-auto w-full">
                    {packages.map(pkg => (
                      <div 
                        key={pkg.id} 
                        onClick={() => {
                          setPosSelectedPackage(pkg);
                          setPosStep(2); // Đi tới Bước 2 (Menu)
                        }}
                        className="glass-card p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:scale-105 active:scale-95 transition-all aspect-square border-2 border-transparent hover:border-emerald-500/50"
                      >
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={pkg.includesDrink ? "text-amber-400" : "text-emerald-500"}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        </div>
                        <h4 className="font-bold text-white text-lg mb-2">{pkg.name}</h4>
                        <p className="text-emerald-400 font-black text-xl mb-2">{pkg.price.toLocaleString('vi-VN')}đ</p>
                        {pkg.includesDrink ? (
                          <span className="text-xs bg-amber-500/20 text-amber-400 px-3 py-1.5 rounded-full font-medium mt-auto">
                            🎁 Kèm 1 phần nước
                          </span>
                        ) : (
                          <span className="text-xs bg-stone-500/20 text-stone-400 px-3 py-1.5 rounded-full font-medium mt-auto">
                            Chỉ chỗ ngồi
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  {packages.length === 0 && <p className="text-stone-500 text-center mt-10">Chưa có gói cước nào.</p>}
                </div>
              )}

              {/* STEP 2: CHỌN NƯỚC */}
              {posStep === 2 && (
                <div className="flex flex-col h-full animate-slide-up">
                  <div className="p-4 bg-emerald-900/30 border-b border-emerald-500/20 flex flex-col md:flex-row justify-between items-start md:items-center px-6 shrink-0 gap-4">
                    <div>
                      <p className="text-sm text-emerald-400">Gói đã chọn: <span className="font-bold text-white">{posSelectedPackage?.name}</span></p>
                      {posSelectedPackage?.includesDrink && (
                        <p className="text-xs text-amber-400 mt-1">🎁 Khách được tặng 1 ly nước miễn phí trong Menu!</p>
                      )}
                    </div>
                    <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                      <button onClick={() => setPosStep(1)} className="text-stone-400 hover:text-white text-sm">← Đổi gói khác</button>
                      <button onClick={() => setPosStep(3)} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-[0_0_15px_rgba(5,150,105,0.4)] transition-colors">
                        {posCart.length > 0 ? `Tiếp tục (${posCart.length} món) →` : "Bỏ qua gọi nước →"}
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 max-w-6xl mx-auto">
                      {menuItems.map(item => (
                        <div 
                          key={item.id} 
                          onClick={() => {
                            const exist = posCart.find(c => c.id === item.id);
                            if (exist) {
                              setPosCart(posCart.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
                            } else {
                              setPosCart([...posCart, { ...item, quantity: 1 }]);
                            }
                          }}
                          className="glass-card p-4 cursor-pointer hover:scale-105 active:scale-95 transition-all text-center flex flex-col items-center justify-center aspect-square relative"
                        >
                          <div className="text-5xl mb-3 drop-shadow-xl">{item.imageUrl || "🍹"}</div>
                          <h4 className="font-medium text-sm text-gray-200 line-clamp-2">{item.name}</h4>
                          <p className="text-emerald-500 font-bold text-sm mt-1">{item.price.toLocaleString('vi-VN')}đ</p>
                          
                          {posCart.find(c => c.id === item.id) && (
                            <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-sm shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-bounce-short">
                              {posCart.find(c => c.id === item.id)?.quantity}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: THANH TOÁN */}
              {posStep === 3 && (
                <div className="flex flex-col h-full animate-slide-up max-w-3xl mx-auto w-full p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <button onClick={() => setPosStep(2)} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">←</button>
                    <h3 className="text-2xl font-bold text-white">Xác nhận & Thanh toán</h3>
                  </div>

                  <div className="flex-1 bg-[#141c16]/40 rounded-2xl border border-white/10 p-6 overflow-y-auto">
                    {/* Bill Header */}
                    <div className="flex justify-between items-start pb-4 border-b border-white/10 mb-4">
                      <div>
                        <p className="font-bold text-lg text-green-400">{posSelectedPackage?.name}</p>
                        <p className="text-sm text-stone-500">Gói cước thời gian</p>
                      </div>
                      <p className="font-bold text-lg text-white">{(posSelectedPackage?.price || 0).toLocaleString('vi-VN')}đ</p>
                    </div>

                    {/* Drink Items */}
                    <div className="space-y-4">
                      {posCart.length === 0 ? (
                        <p className="text-stone-500 text-center py-8 italic">Không kèm nước uống</p>
                      ) : posCart.map((item, index) => {
                        const isFreeDrink = posSelectedPackage?.includesDrink && index === 0;
                        return (
                        <div key={item.id} className="flex flex-col gap-1 pb-2 border-b border-white/5">
                          <div className="flex justify-between items-start">
                            <p className="font-medium text-gray-200">
                              <span className="text-emerald-500 font-bold mr-2">{item.quantity}x</span>
                              {item.name}
                            </p>
                            <p className="font-bold text-white">
                              {isFreeDrink 
                                ? (item.price * (item.quantity - 1)).toLocaleString('vi-VN') + "đ" 
                                : (item.price * item.quantity).toLocaleString('vi-VN') + "đ"
                              }
                            </p>
                          </div>
                          <div className="flex justify-between items-center">
                            {isFreeDrink ? (
                              <p className="text-xs text-amber-500 font-medium bg-amber-500/10 px-2 py-0.5 rounded inline-block">🎁 Tặng kèm gói Combo (1 ly)</p>
                            ) : (
                              <p className="text-xs text-stone-500">{item.price.toLocaleString('vi-VN')}đ/ly</p>
                            )}
                            
                            <div className="flex items-center gap-3 bg-white/5 rounded-lg px-2 py-1 mt-1">
                              <button onClick={() => {
                                 if (item.quantity > 1) {
                                   setPosCart(posCart.map(c => c.id === item.id ? { ...c, quantity: c.quantity - 1 } : c));
                                 } else {
                                   setPosCart(posCart.filter(c => c.id !== item.id));
                                 }
                              }} className="w-6 h-6 flex items-center justify-center text-stone-400 hover:text-white bg-white/5 rounded">-</button>
                              <button onClick={() => setPosCart(posCart.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c))} className="w-6 h-6 flex items-center justify-center text-stone-400 hover:text-white bg-white/5 rounded">+</button>
                            </div>
                          </div>
                        </div>
                      )})}
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="flex justify-between items-end mb-6 bg-emerald-900/20 p-5 rounded-2xl border border-emerald-500/30">
                      <span className="text-emerald-400 font-medium text-lg uppercase tracking-wider">Tổng Thu</span>
                      <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-amber-400 drop-shadow-sm">
                        {(() => {
                          let drinkTotal = posCart.reduce((acc, item) => acc + item.price * item.quantity, 0);
                          if (posSelectedPackage?.includesDrink && posCart.length > 0) {
                            drinkTotal -= posCart[0].price; // Giảm giá 1 ly đầu tiên
                          }
                          return ((posSelectedPackage?.price || 0) + drinkTotal).toLocaleString('vi-VN');
                        })()}đ
                      </span>
                    </div>
                    
                    <button 
                      disabled={posLoading}
                      onClick={async () => {
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
                              packageId: posSelectedPackage.id,
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
                            fetchData();
                          } else {
                            alert("Có lỗi tạo phiên");
                          }
                        } catch(e) {
                          console.error(e);
                        }
                        setPosLoading(false);
                      }}
                      className="w-full py-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-amber-500 text-white font-bold text-xl shadow-[0_0_30px_rgba(5,150,105,0.4)] disabled:opacity-50 hover:opacity-90 transition-all active:scale-95 flex justify-center items-center gap-3"
                    >
                      {posLoading ? (
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 17h2a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h2"/><path d="M17 9V5a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v4"/><path d="M7 15h10v6H7z"/></svg>
                          HOÀN TẤT & IN MÃ KHÁCH
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Biên lai & QR Code Modal */}
      {receiptData && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#141c16]/80 backdrop-blur-md p-4 animate-page-transition">
          <div className="bg-white text-black w-full max-w-sm rounded-xl overflow-hidden shadow-2xl">
            <div className="p-6 text-center border-b border-stone-200 border-dashed">
              <h2 className="text-2xl font-black tracking-tighter">HIRO COFFEE</h2>
              <p className="text-sm text-stone-500 uppercase tracking-widest mt-1">Study Space</p>
              
              <div className="mt-6 flex flex-wrap justify-center gap-6">
                <div className="text-center">
                  <div className="p-2 border-2 border-black rounded-xl inline-block bg-white">
                    <QRCodeCanvas 
                      value={`http://localhost:9999/customer/${receiptData.accessCode}`} 
                      size={140}
                      level={"H"}
                    />
                  </div>
                  <p className="text-xs text-stone-500 mt-2 font-bold">Quét QR tại cổng</p>
                </div>

                <div className="text-center">
                  <div className="p-2 border-2 border-black rounded-xl inline-block bg-white">
                    <img 
                      src={`https://img.vietqr.io/image/MB-123456789-compact2.png?amount=${receiptData.totalAmount || receiptData.package?.price || 0}&addInfo=${receiptData.accessCode}&accountName=SPACE CAFE`} 
                      alt="VietQR" 
                      className="w-[160px] h-[180px] object-contain" 
                    />
                  </div>
                  <p className="text-xs text-stone-500 mt-2 font-bold">Quét VietQR Thanh toán</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-[#f3f0e8]">
              <div className="flex justify-between items-center mb-3">
                <span className="text-stone-500 text-sm">Gói cước:</span>
                <span className="font-bold">{receiptData.package?.name}</span>
              </div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-stone-500 text-sm">Mã vào cổng:</span>
                <span className="font-mono font-bold text-lg px-2 py-1 bg-stone-300 rounded">{receiptData.accessCode}</span>
              </div>
              <div className="flex justify-between items-center mb-6">
                <span className="text-stone-500 text-sm">Giờ vào:</span>
                <span className="font-medium">{new Date(receiptData.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>

              <button 
                onClick={() => setReceiptData(null)}
                className="w-full py-3 rounded-lg bg-[#141c16] text-white font-bold hover:bg-gray-800 transition-colors"
              >
                In Biên Lai & Đóng
              </button>
            </div>
          </div>
        </div>
      )}

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
        <button onClick={() => setActiveTab("orders")} className={`flex flex-col items-center p-2 transition-colors ${activeTab === "orders" ? "text-emerald-500 font-bold" : "text-stone-500 hover:text-stone-400"}`}>
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
