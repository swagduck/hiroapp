"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { QRCodeCanvas } from 'qrcode.react';

import HistoryTab from "@/components/admin/HistoryTab";
import MenuTab from "@/components/admin/MenuTab";
import PackagesTab from "@/components/admin/PackagesTab";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [sessions, setSessions] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionToEnd, setSessionToEnd] = useState<string | null>(null);
  
  // POS States
  const [isPosOpen, setIsPosOpen] = useState(false);
  const [posSelectedPackage, setPosSelectedPackage] = useState<any>(null);
  const [posCart, setPosCart] = useState<any[]>([]);
  const [posLoading, setPosLoading] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);

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
    // Tự động chọn gói đầu tiên nếu có
    if (packages.length > 0 && !posSelectedPackage) {
      setPosSelectedPackage(packages[0]);
    }
  };

  const handleEndSession = (sessionId: string) => {
    setSessionToEnd(sessionId);
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

  return (
    <div className="flex h-screen overflow-hidden pb-16 md:pb-0">
      {/* Sidebar (Desktop only) */}
      <aside className="hidden md:flex w-64 glass border-r border-white/10 flex-col transition-all duration-300">
        <div className="h-16 flex items-center justify-center border-b border-white/10">
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-amber-600">
            SpaceManager
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setActiveTab("overview")} className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === "overview" ? "bg-white/10 text-white font-medium" : "text-stone-400 hover:bg-white/5 hover:text-white"}`}>Tổng quan (POS)</button>
          <button onClick={() => setActiveTab("sessions")} className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === "sessions" ? "bg-white/10 text-white font-medium" : "text-stone-400 hover:bg-white/5 hover:text-white"}`}>Phiên sử dụng</button>
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
                        <th className="p-4 font-medium">Tạm tính</th>
                        <th className="p-4 font-medium text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {sessions.length === 0 ? (
                        <tr><td colSpan={6} className="p-4 text-center text-stone-500">Chưa có phiên nào hoạt động</td></tr>
                      ) : sessions.map((session) => {
                        const startTime = new Date(session.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                        
                        let timeStatus: React.ReactNode = "Không giới hạn";
                        if (session.package?.duration) {
                          const expireTime = new Date(session.startTime).getTime() + session.package.duration * 60000;
                          const remaining = expireTime - now.getTime();
                          
                          if (remaining <= 0) {
                            timeStatus = <span className="text-red-500 font-bold bg-red-500/10 px-2 py-1 rounded">Đã hết giờ</span>;
                          } else {
                            const hours = Math.floor(remaining / 3600000);
                            const minutes = Math.floor((remaining % 3600000) / 60000);
                            timeStatus = <span className="text-green-400">Còn {hours}h {minutes}m</span>;
                          }
                        }

                        return (
                          <tr key={session.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                            <td className="p-4 font-mono text-emerald-500 font-bold">#{session.accessCode}</td>
                            <td className="p-4 text-stone-300">{session.package?.name || "Không rõ"}</td>
                            <td className="p-4 text-stone-400">{startTime}</td>
                            <td className="p-4 font-medium">{timeStatus}</td>
                            <td className="p-4 text-blue-400">
                              <a href={`/customer/${session.accessCode}`} target="_blank" rel="noreferrer" className="hover:underline">
                                Mở Menu KH
                              </a>
                            </td>
                            <td className="p-4 font-medium text-white">{(session.package?.price || 0).toLocaleString('vi-VN')}đ</td>
                            <td className="p-4 text-right">
                              <button onClick={() => handleEndSession(session.id)} className="text-sm px-3 py-1.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500/40 transition-colors opacity-0 group-hover:opacity-100">
                                Kết thúc
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : activeTab === "sessions" ? (
            <HistoryTab />
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

      {/* POS Modal */}
      {isPosOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#141c16]/80 backdrop-blur-sm p-2 md:p-4 pb-20 md:pb-4">
          <div className="bg-stone-950 border border-white/10 rounded-2xl w-full max-w-6xl h-full md:h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-page-transition">
            {/* Header */}
            <div className="h-14 md:h-16 border-b border-white/10 flex items-center justify-between px-4 md:px-6 bg-white/5">
              <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                Tạo Đơn (POS)
              </h2>
              <button onClick={() => setIsPosOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-stone-300 transition-colors">✕</button>
            </div>
            
            {/* Body */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              {/* Left Column: Packages */}
              <div className="w-full md:w-1/4 h-32 md:h-auto border-b md:border-b-0 md:border-r border-white/10 p-3 md:p-6 overflow-y-auto bg-[#141c16]/20 shrink-0">
                <h3 className="text-xs md:text-sm font-medium text-stone-400 mb-2 md:mb-4 uppercase tracking-wider">1. Gói Thời Gian (*)</h3>
                <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
                  {packages.map(pkg => (
                    <div 
                      key={pkg.id} 
                      onClick={() => setPosSelectedPackage(pkg)}
                      className={`p-3 md:p-4 min-w-[140px] md:min-w-0 rounded-xl cursor-pointer border transition-all ${posSelectedPackage?.id === pkg.id ? 'border-emerald-600 bg-emerald-600/20 shadow-[0_0_15px_rgba(5,150,105,0.2)]' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
                    >
                      <h4 className="font-medium text-white text-sm md:text-base">{pkg.name}</h4>
                      <p className="text-emerald-500 font-bold mt-1 text-sm md:text-base">{pkg.price.toLocaleString('vi-VN')}đ</p>
                    </div>
                  ))}
                  {packages.length === 0 && <p className="text-stone-500 text-sm">Chưa có gói cước nào.</p>}
                </div>
              </div>
              
              {/* Middle Column: Menu */}
              <div className="flex-1 p-3 md:p-6 overflow-y-auto">
                <h3 className="text-sm font-medium text-stone-400 mb-4 uppercase tracking-wider">2. Nước uống gọi thêm</h3>
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
                      className="glass-card p-4 cursor-pointer hover:scale-105 active:scale-95 transition-all text-center flex flex-col items-center justify-center aspect-square"
                    >
                      <div className="text-5xl mb-3 drop-shadow-xl">{item.imageUrl || "🍹"}</div>
                      <h4 className="font-medium text-sm text-gray-200 line-clamp-2">{item.name}</h4>
                      <p className="text-emerald-500 font-bold text-sm mt-1">{item.price.toLocaleString('vi-VN')}đ</p>
                    </div>
                  ))}
                  {menuItems.length === 0 && <p className="text-stone-500 text-sm">Chưa có đồ uống nào.</p>}
                </div>
              </div>

              {/* Right Column: Cart & Checkout */}
              <div className="w-full md:w-80 h-1/3 md:h-auto bg-[#141c16]/40 p-4 md:p-6 flex flex-col border-t md:border-t-0 md:border-l border-white/10 shrink-0">
                <h3 className="text-xs md:text-sm font-medium text-stone-400 mb-2 md:mb-4 uppercase tracking-wider">Hóa Đơn</h3>
                
                <div className="flex-1 overflow-y-auto space-y-2 md:space-y-4 pr-2 custom-scrollbar">
                  {posSelectedPackage ? (
                    <div className="flex justify-between items-start pb-4 border-b border-white/10">
                      <div>
                        <p className="font-medium text-green-400">{posSelectedPackage.name}</p>
                        <p className="text-xs text-stone-500">Gói thời gian {posSelectedPackage.includesDrink && "(Kèm 1 ly nước)"}</p>
                      </div>
                      <p className="font-bold text-white">{posSelectedPackage.price.toLocaleString('vi-VN')}đ</p>
                    </div>
                  ) : (
                    <p className="text-red-400 text-sm mb-4">Vui lòng chọn 1 Gói thời gian!</p>
                  )}

                  {posCart.map((item, index) => {
                    const isFreeDrink = posSelectedPackage?.includesDrink && index === 0;
                    return (
                    <div key={item.id} className="flex flex-col gap-2 pb-3 border-b border-white/5">
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-medium text-gray-200">{item.name}</p>
                        <p className="text-sm font-bold text-white">
                          {isFreeDrink 
                            ? (item.price * (item.quantity - 1)).toLocaleString('vi-VN') + "đ" 
                            : (item.price * item.quantity).toLocaleString('vi-VN') + "đ"
                          }
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-emerald-500">
                          {isFreeDrink && item.quantity === 1 ? "Miễn phí (Combo)" : item.price.toLocaleString('vi-VN') + "đ/ly"}
                        </p>
                        <div className="flex items-center gap-3 bg-white/5 rounded-lg px-2 py-1">
                          <button onClick={() => {
                             if (item.quantity > 1) {
                               setPosCart(posCart.map(c => c.id === item.id ? { ...c, quantity: c.quantity - 1 } : c));
                             } else {
                               setPosCart(posCart.filter(c => c.id !== item.id));
                             }
                          }} className="w-5 h-5 flex items-center justify-center text-stone-400 hover:text-white">-</button>
                          <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                          <button onClick={() => setPosCart(posCart.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c))} className="w-5 h-5 flex items-center justify-center text-stone-400 hover:text-white">+</button>
                        </div>
                      </div>
                    </div>
                  )})}
                </div>

                <div className="pt-2 md:pt-6 mt-2 md:mt-4">
                  <div className="flex justify-between items-end mb-3 md:mb-6 bg-white/5 p-3 md:p-4 rounded-xl border border-white/10">
                    <span className="text-stone-400 font-medium text-sm md:text-base">Tổng thanh toán</span>
                    <span className="text-xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-amber-500">
                      {(() => {
                        let drinkTotal = posCart.reduce((acc, item) => acc + item.price * item.quantity, 0);
                        if (posSelectedPackage?.includesDrink && posCart.length > 0) {
                          drinkTotal -= posCart[0].price; // Giảm giá 1 ly đầu tiên
                        }
                        return ((posSelectedPackage?.price || 0) + drinkTotal).toLocaleString('vi-VN');
                      })()}đ
                    </span>
                  </div>
                  
                  <div className="flex gap-3">
                    <button 
                      onClick={() => {
                        setPosCart([]);
                        setPosSelectedPackage(null);
                      }}
                      className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors"
                    >
                      Hủy
                    </button>
                    <button 
                      disabled={!posSelectedPackage || posLoading}
                      onClick={async () => {
                        setPosLoading(true);
                        try {
                          // Nếu có Combo, tính lại tổng bill
                          let drinkTotal = posCart.reduce((acc, item) => acc + item.price * item.quantity, 0);
                          let modifiedOrderItems = [...posCart];
                          if (posSelectedPackage?.includesDrink && posCart.length > 0) {
                            drinkTotal -= posCart[0].price;
                            // Đổi giá trị ly đầu tiên để lưu xuống DB là 0đ cho ly đó
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
                            setReceiptData(data); // Hiện biên lai QR
                            fetchData();
                          } else {
                            alert("Có lỗi tạo phiên");
                          }
                        } catch(e) {}
                        setPosLoading(false);
                      }}
                      className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-700 to-amber-600 text-white font-bold shadow-[0_0_15px_rgba(5,150,105,0.4)] disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-all active:scale-95"
                    >
                      {posLoading ? "Đang xử lý..." : "Bắt Đầu & In Mã"}
                    </button>
                  </div>
                </div>
              </div>
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
              
              <div className="mt-6 flex justify-center">
                <div className="p-2 border-2 border-black rounded-xl inline-block">
                  <QRCodeCanvas 
                    value={`http://localhost:9999/customer/${receiptData.accessCode}`} 
                    size={200}
                    level={"H"}
                  />
                </div>
              </div>
              <p className="text-xs text-stone-500 mt-3 font-medium">Quét mã để gọi nước tại bàn</p>
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
