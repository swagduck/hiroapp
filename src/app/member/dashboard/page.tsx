"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "sonner";

export default function MemberDashboard() {
  const router = useRouter();
  const [member, setMember] = useState<any>(null);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [historySessions, setHistorySessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());

  // Notification States
  const [notificationPermission, setNotificationPermission] = useState("default");
  const [hasNotifiedWarning, setHasNotifiedWarning] = useState(false);
  const [hasNotifiedExpired, setHasNotifiedExpired] = useState(false);

  const [activeTab, setActiveTab] = useState<"menu" | "cart" | "history" | "profile" | "prebook">("menu");
  const [dobInput, setDobInput] = useState("");
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [simulatingPayment, setSimulatingPayment] = useState<string | null>(null);

  // Extend
  const [isExtending, setIsExtending] = useState(false);
  const [extendPkg, setExtendPkg] = useState<string | null>(null);
  const [extending, setExtending] = useState(false);

  // Mua hàng
  const [packages, setPackages] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [selectedPkg, setSelectedPkg] = useState<string | null>(null);
  const [cart, setCart] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [useFreeDrink, setUseFreeDrink] = useState(false);

  useEffect(() => {
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) return;
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    if (permission === "granted") {
      new Notification("HiroApp", { body: "Thông báo đã bật. Bạn sẽ nhận được cảnh báo khi sắp hết giờ!" });
    }
  };

  const playAlert = (title: string, body: string, isUrgent: boolean) => {
    // 1. Vibrate
    if ("vibrate" in navigator) {
      navigator.vibrate(isUrgent ? [500, 200, 500, 200, 1000] : [200, 100, 200]);
    }
    
    // 2. Sound (Web Audio API)
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const playBeep = (freq: number, startTime: number) => {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(freq, startTime);
        gainNode.gain.setValueAtTime(1.0, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
        oscillator.start(startTime);
        oscillator.stop(startTime + 0.4);
      };
      
      for (let i = 0; i < 10; i++) {
        playBeep(isUrgent ? 880 : 600, audioCtx.currentTime + i * 0.5);
      }
    } catch(e) {
      console.error("Audio play failed", e);
    }
    
    // 3. OS Notification
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body, icon: "/favicon.ico" });
    }
  };

  const fetchData = async () => {
    try {
      const [meRes, sessionRes, historyRes, pkgRes, menuRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/member/orders"),
        fetch("/api/member/orders?history=true"),
        fetch("/api/packages"),
        fetch("/api/menu")
      ]);

      if (meRes.ok) {
        const userData = await meRes.json();
        setMember(userData);
        if (userData.dob) setDobInput(userData.dob);
      } else {
        const errorData = await meRes.json().catch(() => null);
        if (errorData?.error) {
          toast.error(errorData.error);
        } else {
          toast.error("Phiên đăng nhập không hợp lệ");
        }
        router.push("/login");
        return;
      }

      if (sessionRes.ok) {
        const s = await sessionRes.json();
        if (s && (s.status === "ACTIVE" || s.status === "PENDING" || s.status === "PRE_BOOKED" || s.status === "PENDING_PAYMENT")) {
          setActiveSession(s);
          
          // Chủ động truy vấn ZaloPay nếu đang chờ thanh toán
          if (s.status === "PENDING_PAYMENT" && s.transId) {
            fetch("/api/member/check-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ transId: s.transId })
            }).then(r => r.json()).then(data => {
              if (data.status === "PRE_BOOKED" || data.status === "CANCELLED") {
                // Fetch lại toàn bộ data nếu trạng thái thay đổi
                fetchData();
              }
            }).catch(console.error);
          }
        } else {
          setActiveSession(null);
        }
      }

      if (historyRes.ok) {
        const hs = await historyRes.json();
        setHistorySessions(Array.isArray(hs) ? hs : []);
      }
      
      if (pkgRes.ok) {
        const p = await pkgRes.json();
        setPackages(p.filter((x: any) => x.isActive));
      }

      if (menuRes.ok) {
        const m = await menuRes.json();
        setMenuItems(m.filter((x: any) => x.isAvailable));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData();
    }, 10000); // Auto-refresh every 10 seconds
    const timerInterval = setInterval(() => setNow(new Date()), 30000);
    return () => {
      clearInterval(interval);
      clearInterval(timerInterval);
    };
  }, [router]);

  const addToCart = (item: any) => {
    const existing = cart.find(c => c.id === item.id);
    if (existing) {
      setCart(cart.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const submitOrder = async () => {
    if (activeSession) {
      if (cart.length === 0) {
        toast.error("Vui lòng chọn đồ uống!");
        return;
      }
      setSubmitting(true);
      let totalAmount = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0) * 0.9;
      const orderItems = cart.map(item => ({
        menuItemId: item.id,
        quantity: item.quantity,
        price: item.price * 0.9
      }));

      try {
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: activeSession.id,
            totalAmount,
            items: orderItems,
            updateFreeDrink: false
          })
        });

        if (res.ok) {
          toast.success("Order thành công! Nhân viên sẽ mang nước ra cho bạn.");
          setCart([]);
          setActiveTab("history");
          fetchData();
        } else {
          toast.error("Lỗi tạo đơn");
        }
      } catch (e) {
        toast.error("Lỗi kết nối");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (!selectedPkg) {
      toast.error("Vui lòng chọn 1 Gói giờ!");
      return;
    }
    
    const pkg = packages.find(p => p.id === selectedPkg);

    if (pkg?.includesDrink && cart.length === 0) {
      toast.error("Gói này được tặng 1 ly nước! Vui lòng chọn nước trước khi thanh toán.");
      setActiveTab("menu");
      return;
    }

    setSubmitting(true);
    const totalAmount = getCartTotal();

    let updateFreeDrink = false;
    const orderItems = cart.map(item => ({
      id: item.id,
      quantity: item.quantity,
      price: item.price * 0.9 // Member discount recorded in DB
    }));

    if (pkg?.includesDrink && cart.length > 0) {
      orderItems[0].price = 0;
    } else if (useFreeDrink && cart.length > 0) {
      orderItems[0].price = 0;
      updateFreeDrink = true;
    }

    try {
      const res = await fetch("/api/member/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: selectedPkg,
          orderItems,
          orderTotal: totalAmount,
          updateFreeDrink
        })
      });

      if (res.ok) {
        toast.success("Gửi đơn thành công! Vui lòng ra quầy hoặc đợi thu ngân duyệt.");
        setTimeout(() => window.location.reload(), 1500);
      } else {
        toast.error("Lỗi tạo đơn");
      }
    } catch (e) {
      toast.error("Lỗi kết nối");
    } finally {
      setSubmitting(false);
    }
  };

  const getCartTotal = () => {
    if (activeSession) {
      return cart.reduce((acc, item) => acc + (item.price * item.quantity), 0) * 0.9;
    }

    const pkg = packages.find(p => p.id === selectedPkg);
    let totalDrinks = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    let pkgPrice = pkg ? pkg.price : 0;

    // Apply 10% member discount on drinks
    totalDrinks = totalDrinks * 0.9;

    let firstDrinkPrice = cart.length > 0 ? cart[0].price * 0.9 : 0;
    
    if (pkg?.includesDrink && cart.length > 0) {
      totalDrinks -= firstDrinkPrice;
    } else if (useFreeDrink && cart.length > 0) {
      totalDrinks -= firstDrinkPrice;
    }

    return pkgPrice + Math.max(0, totalDrinks);
  };

  const getDiscountAmount = () => {
    let totalDrinksOriginal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    return totalDrinksOriginal * 0.1;
  };

  const handleCancelPayment = async () => {
    try {
      const res = await fetch("/api/member/cancel-payment", {
        method: "POST"
      });
      if (res.ok) {
        toast.success("Đã hủy giao dịch");
        fetchData();
      } else {
        toast.error("Lỗi khi hủy");
      }
    } catch (e) {
      toast.error("Lỗi kết nối");
    }
  };

  const handlePreBook = async (pkgId: string) => {
    try {
      setExtending(true);
      const res = await fetch("/api/member/prebook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: pkgId })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.orderurl) {
          window.location.href = data.orderurl;
        } else {
          toast.error("Không nhận được URL thanh toán");
          setExtending(false);
          setSimulatingPayment(null);
        }
      } else {
        toast.error("Lỗi đặt chỗ");
        setExtending(false);
        setSimulatingPayment(null);
      }
    } catch (e) {
      toast.error("Lỗi kết nối");
    } finally {
      setExtendPkg(null);
    }
  };

  const handleExtend = async () => {
    if (!extendPkg) return toast.error("Vui lòng chọn 1 gói!");
    setExtending(true);
    try {
      const res = await fetch(`/api/sessions/${activeSession.accessCode}/extend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: extendPkg })
      });
      if (res.ok) {
        toast.success("Đã gửi yêu cầu gia hạn! Vui lòng ra quầy hoặc đợi thu ngân duyệt.");
        setIsExtending(false);
        setExtendPkg(null);
        fetchData();
      } else {
        toast.error("Có lỗi xảy ra");
      }
    } catch(e) {
      toast.error("Lỗi kết nối");
    } finally {
      setExtending(false);
    }
  };

  const baseDuration = activeSession?.savedMinutesUsed || activeSession?.package?.duration;
  const duration = baseDuration ? baseDuration + (activeSession?.extraMinutes || 0) : null;
  const expireTime = duration ? new Date(activeSession.startTime).getTime() + duration * 60000 : null;
  const remainingMs = expireTime ? expireTime - now.getTime() : null;
  const remainingMinutes = remainingMs ? Math.ceil(remainingMs / 60000) : null;
  const showWarning = remainingMinutes !== null && remainingMinutes <= 15 && remainingMinutes > 0;
  const isExpired = remainingMinutes !== null && remainingMinutes <= 0;

  useEffect(() => {
    if (remainingMinutes === null) return;
    
    if (remainingMinutes <= 15 && remainingMinutes > 0 && !hasNotifiedWarning) {
      playAlert("Sắp hết giờ!", "Bạn còn chưa tới 15 phút, vui lòng chú ý thời gian nhé!", false);
      setHasNotifiedWarning(true);
    }
    
    if (remainingMinutes <= 0 && !hasNotifiedExpired) {
      playAlert("Đã hết giờ!", "Thời gian sử dụng của bạn đã hết. Vui lòng gia hạn nếu muốn sử dụng tiếp.", true);
      setHasNotifiedExpired(true);
    }
  }, [remainingMinutes, hasNotifiedWarning, hasNotifiedExpired]);

  if (loading) return <div className="min-h-screen bg-stone-950 flex justify-center items-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-emerald-500"></div></div>;

  return (
    <div className="min-h-screen bg-slate-950 flex justify-center pb-24">
      <div className="w-full max-w-md bg-stone-950 min-h-screen border-x border-white/5 text-white relative">
        
        {/* Banner xin quyền thông báo */}
        {notificationPermission === "default" && (
          <div className="bg-amber-500/10 border-b border-amber-500/30 p-3 flex justify-between items-center px-4 animate-slide-down">
            <span className="text-amber-400 text-xs font-medium pr-2">Bật thông báo để nhận cảnh báo khi sắp hết giờ</span>
            <button onClick={requestNotificationPermission} className="bg-amber-500 text-stone-900 text-xs font-bold px-3 py-2 rounded-lg shadow-[0_0_10px_rgba(245,158,11,0.3)] shrink-0">
              Cho phép
            </button>
          </div>
        )}

        {/* Nút Test Thông Báo */}
        <div className="bg-indigo-500/10 border-b border-indigo-500/30 p-2 flex justify-between items-center px-4">
          <span className="text-indigo-400 text-xs font-medium">Bấm để thử nghiệm âm thanh & thông báo 👉</span>
          <button 
            onClick={() => playAlert("Sắp hết giờ (Thử nghiệm)!", "Đây là cách thông báo sẽ hiện ra khi bạn sắp hết thời gian.", false)} 
            className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/50 text-xs font-bold px-3 py-1.5 rounded-lg shrink-0 active:bg-indigo-500/40 transition-colors"
          >
            Test Thử
          </button>
        </div>

        {/* Header User */}
        <div className="p-5 bg-gradient-to-b from-emerald-900/40 to-transparent border-b border-white/5 sticky top-0 z-10 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center font-bold text-xl shadow-[0_0_15px_rgba(16,185,129,0.5)]">
              {member?.name?.charAt(0) || "U"}
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-lg">{member?.name}</h2>
              <div className="flex items-center gap-2 text-sm text-emerald-400 flex-wrap">
                <span className="font-mono bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                  {member?.customerCode || "KH MỚI"}
                </span>
                <span className="text-stone-400">|</span>
                <span>Bảo lưu: {member?.savedMinutes || 0}p</span>
                <span className="text-stone-400">|</span>
                <span className="text-amber-400">Điểm: {member?.points || 0}</span>
                <button 
                  disabled={!member || member.points < 100}
                  onClick={async () => {
                    if (!confirm("Đổi 100 điểm lấy 60 phút bảo lưu?")) return;
                    try {
                      const res = await fetch("/api/users/redeem-points", { method: "POST" });
                      if (res.ok) {
                        toast.success("Đổi điểm thành công!");
                        fetchData();
                      } else {
                        toast.error("Lỗi đổi điểm!");
                      }
                    } catch (e) {
                      toast.error("Lỗi kết nối");
                    }
                  }}
                  className={`ml-1 px-2 py-0.5 rounded text-xs font-bold transition-colors ${member?.points >= 100 ? 'bg-amber-500/20 border border-amber-500/50 text-amber-400 hover:bg-amber-500/40' : 'bg-stone-800 border border-stone-700 text-stone-500 cursor-not-allowed'}`}
                >
                  Đổi 1h
                </button>
              </div>
            </div>
            <button
              onClick={async () => {
                toast("Đang đăng xuất...", { duration: 1500 });
                await fetch("/api/auth/logout", { method: "POST" });
                router.push("/customer");
              }}
              className="px-3 py-1.5 text-xs font-bold bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors"
            >
              Đăng xuất
            </button>
          </div>
        </div>

        {/* Navigation Bar */}
        <div className="flex bg-black/40 p-2 overflow-x-auto whitespace-nowrap hide-scrollbar border-b border-white/5">
          <button onClick={() => setActiveTab("menu")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "menu" ? 'bg-white/10 text-white' : 'text-stone-400 hover:text-white'}`}>Phục Vụ</button>
          {!activeSession && (
            <button onClick={() => setActiveTab("prebook")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === "prebook" ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30' : 'text-stone-400 hover:text-white'}`}>
              <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span></span>
              Đặt Chỗ
            </button>
          )}
          <button onClick={() => setActiveTab("cart")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "cart" ? 'bg-white/10 text-white' : 'text-stone-400 hover:text-white'}`}>Giỏ Hàng {cart.length > 0 && `(${cart.length})`}</button>
          <button onClick={() => setActiveTab("history")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "history" ? 'bg-white/10 text-white' : 'text-stone-400 hover:text-white'}`}>Lịch Sử</button>
          <button onClick={() => setActiveTab("profile")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "profile" ? 'bg-white/10 text-white' : 'text-stone-400 hover:text-white'}`}>Cá Nhân</button>
        </div>

        {/* Content based on Tab */}
        <div key={activeTab} className="p-4 animate-tab-enter">
          {activeTab === "menu" && (
            <div className="space-y-6">
              {/* Active Session Banner */}
              {showWarning && (
                <div className="bg-red-500/20 border border-red-500/50 text-red-300 p-3 mb-4 rounded-xl flex items-center shadow-lg animate-pulse">
                  <span className="mr-2 text-lg">⚠️</span>
                  <span className="text-sm font-medium">Phiên của bạn sẽ kết thúc trong vòng {remainingMinutes} phút nữa!</span>
                </div>
              )}

              {activeSession && (
                <div className={`p-4 rounded-2xl border ${activeSession.status === 'PENDING' ? 'bg-amber-900/20 border-amber-500/30' : 'bg-emerald-900/20 border-emerald-500/30'}`}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-sm text-stone-300">Phiên {activeSession.status === 'PENDING' ? 'đang chờ duyệt' : 'hiện tại'}</h3>
                      <p className="text-xs text-emerald-400 mt-1">Bạn có thể gọi thêm nước tại đây.</p>
                    </div>
                    <div className="text-right">
                      {activeSession.status === 'ACTIVE' && (
                        <>
                          <p className="text-xs text-stone-400 mb-0.5">Thời gian</p>
                          {(() => {
                            if (remainingMs === null) return <p className="font-medium text-sm">Không giới hạn</p>;
                            if (isExpired) return <p className="font-bold text-red-500 text-sm animate-pulse">Đã hết giờ!</p>;
                            const hours = Math.floor(remainingMs / 3600000);
                            const minutes = Math.floor((remainingMs % 3600000) / 60000);
                            return <p className="font-bold text-emerald-400 text-sm">{hours}h {minutes}m</p>;
                          })()}
                        </>
                      )}
                    </div>
                  </div>

                  {activeSession.status === 'ACTIVE' && (
                    <div className="mt-2 border-t border-white/5 pt-3">
                      {(() => {
                        const pendingExtension = activeSession.orders?.find((o: any) => o.isExtension && o.status === 'PENDING');
                        if (pendingExtension) {
                          return (
                            <div className="mt-2 flex flex-col items-center bg-white p-3 rounded-xl mx-auto border border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                              <p className="text-stone-900 font-bold mb-2 text-center text-xs">Thanh toán gia hạn</p>
                              <img 
                                src={`https://img.vietqr.io/image/MB-123456789-compact2.png?amount=${pendingExtension.totalAmount || 0}&addInfo=${activeSession.accessCode}&accountName=SPACE CAFE`} 
                                alt="VietQR" 
                                className="w-[120px] h-[140px] object-contain rounded shadow-sm border border-stone-200" 
                              />
                              <div className="text-stone-600 text-xs mt-2 text-center space-y-1">
                                <p>Số tiền: <strong className="text-emerald-600">{(pendingExtension.totalAmount || 0).toLocaleString('vi-VN')}đ</strong></p>
                              </div>
                              <p className="text-amber-500 font-bold mt-1 text-[10px] text-center animate-pulse">Đang chờ thu ngân duyệt...</p>
                            </div>
                          );
                        }
                        
                        return duration && (
                          <div className="flex flex-col gap-2">
                            <button 
                              onClick={() => setIsExtending(!isExtending)}
                              className="w-full bg-purple-600/20 border border-purple-500 hover:bg-purple-600/30 text-purple-400 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
                            >
                              <span>{isExtending ? "Đóng" : "⏳ Gia Hạn Thêm Giờ"}</span>
                            </button>

                            {isExtending && (
                              <div className="p-4 border border-purple-500/30 bg-purple-900/10 rounded-xl animate-slide-down">
                                <h5 className="font-bold text-sm text-purple-300 mb-3">Chọn gói gia hạn:</h5>
                                <div className="space-y-2 mb-4">
                                  {packages.map(pkg => (
                                    <div 
                                      key={pkg.id} 
                                      onClick={() => setExtendPkg(pkg.id)}
                                      className={`p-3 rounded-lg border cursor-pointer transition-all ${extendPkg === pkg.id ? 'bg-purple-900/40 border-purple-500' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                                    >
                                      <div className="flex justify-between items-center text-sm">
                                        <span>{pkg.name}</span>
                                        <span className="font-bold text-purple-400">{pkg.price.toLocaleString('vi-VN')}đ</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                <button 
                                  onClick={handleExtend}
                                  disabled={extending || !extendPkg}
                                  className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded-lg transition-colors disabled:opacity-50 text-sm shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                                >
                                  {extending ? "Đang xử lý..." : "Xác nhận Gia hạn"}
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}

              {!activeSession && (
                <div>
                  <h3 className="font-bold text-lg mb-4 text-emerald-400">1. Chọn Gói Thời Gian</h3>
                  <div className="space-y-3">
                    {packages.map(pkg => (
                      <div 
                        key={pkg.id} 
                        onClick={() => setSelectedPkg(pkg.id)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedPkg === pkg.id ? 'bg-emerald-900/40 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{pkg.name}</span>
                          <span className="text-emerald-400 font-bold">{pkg.price.toLocaleString('vi-VN')}đ</span>
                        </div>
                        {pkg.includesDrink && <p className="text-xs text-amber-400 mt-1">✨ Tặng 1 ly nước bất kỳ</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="font-bold text-lg mb-4 text-emerald-400">{activeSession ? "Menu Đồ Uống" : "2. Chọn Đồ Uống (Tùy chọn)"}</h3>
                <div className="grid grid-cols-2 gap-3">
                  {menuItems.map(item => (
                    <div key={item.id} onClick={() => addToCart(item)} className="bg-white/5 p-4 rounded-xl border border-white/10 flex flex-col items-center text-center cursor-pointer hover:bg-white/10 hover:border-emerald-500/50 active:scale-95 transition-all group">
                      <div className="text-4xl mb-3 group-active:scale-110 transition-transform">{item.imageUrl || "🍹"}</div>
                      <span className="text-sm font-medium mb-1 line-clamp-2 min-h-[40px]">{item.name}</span>
                      <span className="text-xs text-emerald-400 font-bold">{item.price.toLocaleString('vi-VN')}đ</span>
                      <div className="mt-2 w-full bg-emerald-600/20 text-emerald-400 py-1.5 rounded-lg text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">Thêm</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "prebook" && !activeSession && (
            <div className="space-y-6 animate-page-transition">
              <div>
                <h3 className="font-bold text-xl text-purple-400 mb-2 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  Đặt Chỗ & Mua Gói Trước
                </h3>
                <p className="text-stone-400 text-sm mb-4">Mua gói trực tuyến, giữ chỗ và chỉ bắt đầu tính giờ khi bạn đến quán check-in.</p>
              </div>

              <div className="space-y-4">
                {packages.map(pkg => (
                  <div key={pkg.id} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/50 transition-colors">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-lg text-white">{pkg.name}</span>
                      <span className="text-purple-400 font-bold">{pkg.price.toLocaleString('vi-VN')}đ</span>
                    </div>
                    {pkg.includesDrink && <p className="text-xs text-amber-400 mb-4">✨ Tặng kèm 1 ly nước tự chọn</p>}
                    
                    <div className="bg-black/30 p-4 rounded-lg mt-3 flex flex-col items-center">
                      <p className="text-xs text-stone-400 mb-2 font-medium">Thanh toán an toàn qua ZaloPay</p>
                      
                      <button 
                        onClick={() => handlePreBook(pkg.id)}
                        disabled={extending}
                        className="mt-2 w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-colors shadow-[0_0_15px_rgba(37,99,235,0.4)] disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {extending ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Đang kết nối ZaloPay...
                          </>
                        ) : (
                          "Thanh toán ZaloPay"
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "cart" && (
            <div className="space-y-6">
              <h3 className="font-bold text-2xl text-white mb-2">Giỏ hàng của bạn</h3>
              
              <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-4">
                {!activeSession && (
                  <div className="pb-4 border-b border-white/10">
                    <h4 className="text-sm text-stone-400 font-medium mb-2">Gói thời gian</h4>
                    {selectedPkg ? (
                      <div className="flex justify-between items-center text-emerald-400 font-bold">
                        <span>{packages.find(p => p.id === selectedPkg)?.name}</span>
                        <span>{packages.find(p => p.id === selectedPkg)?.price.toLocaleString('vi-VN')}đ</span>
                      </div>
                    ) : (
                      <p className="text-stone-500 text-sm italic">Chưa chọn gói</p>
                    )}
                  </div>
                )}

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm text-stone-400 font-medium">Đồ uống</h4>
                    <button onClick={() => setCart([])} className="text-xs text-stone-500 hover:text-white">Xóa tất cả</button>
                  </div>
                  {cart.length > 0 ? (
                    <div className="space-y-3 mt-3">
                      {cart.map((c, i) => (
                        <div key={i} className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 bg-stone-800 text-xs flex items-center justify-center rounded text-stone-300">{c.quantity}x</span>
                            <span className="text-sm text-stone-200">{c.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-stone-300">{(c.price * c.quantity).toLocaleString('vi-VN')}đ</span>
                            <button onClick={() => setCart(cart.filter(x => x.id !== c.id))} className="text-red-400/50 hover:text-red-400">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-stone-500 text-sm italic">Chưa chọn đồ uống</p>
                  )}
                </div>
              </div>

              {getDiscountAmount() > 0 && (
                <div className="bg-emerald-900/10 text-emerald-400 text-xs p-3 rounded-lg border border-emerald-500/20 flex items-center gap-2">
                  <span>💎</span>
                  <span>Đã giảm 10% tiền nước (Đặc quyền Hội viên)</span>
                </div>
              )}

              {member?.freeDrinkTokens > 0 && !activeSession && !packages.find(p => p.id === selectedPkg)?.includesDrink && cart.length > 0 && (
                <div className="bg-pink-900/20 text-pink-400 text-xs p-3 rounded-lg border border-pink-500/30 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span>🎂</span>
                    <span>Bạn có {member.freeDrinkTokens} quà sinh nhật!</span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={useFreeDrink} 
                      onChange={(e) => setUseFreeDrink(e.target.checked)}
                      className="accent-pink-500 w-4 h-4"
                    />
                    <span className="font-bold">Dùng ngay</span>
                  </label>
                </div>
              )}

              {!activeSession && packages.find(p => p.id === selectedPkg)?.includesDrink && cart.length > 0 && (
                <div className="bg-emerald-900/20 text-emerald-400 text-xs p-3 rounded-lg border border-emerald-500/30 flex items-center gap-2">
                  <span>🎁</span>
                  <span>Đã trừ tiền 1 ly nước (Áp dụng theo gói Combo)</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-4">
                <span className="text-stone-400">Tổng thanh toán:</span>
                <span className="text-2xl font-black text-emerald-400">{getCartTotal().toLocaleString('vi-VN')}đ</span>
              </div>

              <button 
                onClick={submitOrder}
                disabled={submitting || (!activeSession && !selectedPkg) || (activeSession && cart.length === 0)}
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:opacity-50 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all mt-4"
              >
                {activeSession ? (submitting ? "Đang xử lý..." : "Xác nhận Gọi Nước") : (submitting ? "Đang xử lý..." : "Gửi Đơn Order")}
              </button>
            </div>
          )}

          {activeTab === "history" && (
            <div className="space-y-6 animate-page-transition">
              <h3 className="font-bold text-2xl text-white mb-4">Lịch sử & Hoạt động</h3>
              
              {activeSession && activeSession.orders && activeSession.orders.filter((o: any) => !o.isExtension).length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-widest mb-3">Đơn nước đang phục vụ</h4>
                  {activeSession.orders.filter((o: any) => !o.isExtension).map((order: any, idx: number) => (
                    <div key={idx} className="bg-emerald-900/10 p-4 rounded-xl border border-emerald-500/20">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-stone-400">Đơn #{idx + 1}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${order.status === 'SERVED' ? 'bg-emerald-500/20 text-emerald-400' : order.status === 'CANCELLED' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                          {order.status === 'SERVED' ? 'ĐÃ XONG' : order.status === 'CANCELLED' ? 'ĐÃ HỦY' : 'ĐANG CHỜ'}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {order.items.map((item: any, i: number) => (
                          <div key={i} className="flex justify-between text-sm text-stone-300">
                            <span>{item.quantity}x {item.menuItem?.name}</span>
                            <span>{(item.price * item.quantity).toLocaleString('vi-VN')}đ</span>
                          </div>
                        ))}
                      </div>
                      {order.status === 'PENDING' && (
                        <div className="mt-3 pt-3 border-t border-emerald-500/20 flex flex-col items-center bg-black/20 rounded-lg pb-3">
                          <p className="text-xs mt-3 mb-2 text-amber-400">Quét mã thanh toán đơn này</p>
                          <img 
                            src={`https://img.vietqr.io/image/MB-123456789-compact2.png?amount=${order.totalAmount || 0}&addInfo=${activeSession.accessCode}&accountName=SPACE CAFE`} 
                            className="w-32 h-32 mx-auto rounded border border-white/10" 
                            alt="QR Thanh toán"
                          />
                          <p className="text-sm font-bold text-emerald-400 mt-2">{(order.totalAmount || 0).toLocaleString('vi-VN')}đ</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {activeSession && (
                <div className={`p-5 rounded-2xl border mb-6 ${activeSession.status === 'PENDING' ? 'bg-amber-900/20 border-amber-500' : 'bg-emerald-900/20 border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.1)]'}`}>
                  <h4 className="font-bold text-lg mb-1 flex items-center gap-2">
                    Phiên hiện tại 
                    <span className="flex h-3 w-3 relative">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${activeSession.status === 'PENDING' ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
                      <span className={`relative inline-flex rounded-full h-3 w-3 ${activeSession.status === 'PENDING' ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                    </span>
                  </h4>
                  <p className="text-sm text-stone-300 mb-4">Gói: <span className="text-white font-medium">{activeSession.package?.name}</span></p>
                  
                  {activeSession.status === 'PENDING' && activeSession.paymentStatus === 'UNPAID' && (
                    <div className="mt-4 flex flex-col items-center bg-white p-4 rounded-xl mx-auto">
                      <p className="text-stone-900 font-bold mb-2 text-center text-sm">Mã QR Thanh Toán</p>
                      <img 
                        src={`https://img.vietqr.io/image/MB-123456789-compact2.png?amount=${activeSession.totalAmount || 0}&addInfo=${activeSession.accessCode}&accountName=SPACE CAFE`} 
                        alt="VietQR" 
                        className="w-[160px] h-[180px] object-contain rounded shadow-sm border border-stone-200" 
                      />
                      <div className="text-stone-600 text-xs mt-3 text-center space-y-1">
                        <p>Số tiền: <strong className="text-emerald-600 text-sm">{(activeSession.totalAmount || 0).toLocaleString('vi-VN')}đ</strong></p>
                        <p>Mã phiên: <strong className="text-stone-900">{activeSession.accessCode}</strong></p>
                      </div>
                    </div>
                  )}

                  {activeSession.status === 'PENDING_PAYMENT' && (
                    <div className="bg-white text-black p-6 rounded-2xl w-full max-w-sm mx-auto shadow-2xl relative overflow-hidden flex flex-col items-center justify-center">
                      <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                      <p className="font-bold text-center text-blue-600 mb-2">Đang chờ xác nhận thanh toán</p>
                      <p className="text-sm text-center text-stone-500 mb-4">Hệ thống đang đồng bộ với ZaloPay. Nếu bạn đã thanh toán thành công, vui lòng chờ giây lát...</p>
                      
                      <button 
                        onClick={handleCancelPayment}
                        className="text-red-500 font-medium text-sm hover:underline"
                      >
                        Hủy giao dịch
                      </button>
                    </div>
                  )}

                  {activeSession.status === 'PRE_BOOKED' && (
                    <div className="bg-white text-black p-6 rounded-2xl w-full max-w-sm mx-auto shadow-2xl relative overflow-hidden">
                      <div className="flex items-center gap-2 mb-2 text-purple-600 font-bold">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                        Mã Check-in Tự Động
                      </div>
                      <div className="flex justify-center my-4">
                        <QRCodeCanvas 
                          value={activeSession.accessCode} 
                          size={180} 
                          level={"H"} 
                          includeMargin={true}
                          fgColor={"#000000"} 
                          bgColor={"#ffffff"} 
                        />
                      </div>
                      <p className="text-stone-500 font-mono text-xl tracking-widest text-center">{activeSession.accessCode}</p>
                      <p className="text-[10px] text-stone-400 mt-2 text-center leading-tight">Đưa mã này vào máy quét tại quầy để kích hoạt giờ</p>
                    </div>
                  )}

                  {activeSession.status === 'ACTIVE' && (
                    <div className="mt-4 flex flex-col items-center bg-white p-4 rounded-xl mx-auto max-w-[220px]">
                      <p className="text-stone-900 font-bold mb-2 text-center text-sm">Mã QR Lên Lầu</p>
                      <QRCodeCanvas 
                        value={activeSession.accessCode} 
                        size={180} 
                        level={"H"} 
                        includeMargin={true}
                        fgColor={"#000000"} 
                        bgColor={"#ffffff"} 
                      />
                      <p className="text-stone-500 font-mono mt-2 text-xs text-center">{activeSession.accessCode}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-3">
                <h4 className="text-sm font-bold text-stone-400 uppercase tracking-widest mb-3">Lịch sử giao dịch</h4>
                {historySessions.length === 0 ? (
                  <p className="text-stone-500 text-sm italic text-center py-8">Chưa có giao dịch nào</p>
                ) : (
                  historySessions.filter(s => s.status === 'COMPLETED' || s.status === 'CANCELLED').map(s => (
                    <div key={s.id} className="bg-white/5 p-4 rounded-xl border border-white/10 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-sm text-stone-200">{s.package?.name || "Gói thời gian"}</p>
                        <p className="text-xs text-stone-500 mt-1">{new Date(s.createdAt).toLocaleDateString('vi-VN')} - {new Date(s.createdAt).toLocaleTimeString('vi-VN')}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-400">{(s.totalAmount || 0).toLocaleString('vi-VN')}đ</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${s.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                          {s.status === 'COMPLETED' ? 'HOÀN THÀNH' : 'ĐÃ HỦY'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === "profile" && (
            <div className="space-y-6 animate-page-transition">
              
              {/* Thẻ Điểm & Quà */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/30 p-4 rounded-2xl flex flex-col items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.1)] relative">
                  <span className="text-3xl mb-1">🌟</span>
                  <span className="text-2xl font-bold text-amber-400">{member?.points || 0}</span>
                  <span className="text-[10px] text-amber-500/80 font-bold uppercase tracking-widest mt-1">Điểm Tích Lũy</span>
                  <button 
                    disabled={!member || member.points < 100}
                    onClick={async () => {
                      if (!confirm("Đổi 100 điểm lấy 60 phút bảo lưu?")) return;
                      try {
                        const res = await fetch("/api/users/redeem-points", { method: "POST" });
                        if (res.ok) {
                          toast.success("Đổi điểm thành công!");
                          fetchData();
                        } else {
                          toast.error("Lỗi đổi điểm!");
                        }
                      } catch (e) {
                        toast.error("Lỗi kết nối");
                      }
                    }}
                    className={`mt-3 px-3 py-1.5 rounded-lg text-[10px] font-bold w-full transition-all ${member?.points >= 100 ? 'bg-amber-500 hover:bg-amber-400 text-stone-900 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-black/40 text-stone-500 cursor-not-allowed'}`}
                  >
                    ĐỔI 1 GIỜ BẢO LƯU (100đ)
                  </button>
                </div>
                <div className="bg-gradient-to-br from-pink-500/20 to-rose-600/20 border border-pink-500/30 p-4 rounded-2xl flex flex-col items-center justify-center shadow-[0_0_15px_rgba(236,72,153,0.1)]">
                  <span className="text-3xl mb-1">🥤</span>
                  <span className="text-2xl font-bold text-pink-400">{member?.freeDrinkTokens || 0}</span>
                  <span className="text-[10px] text-pink-500/80 font-bold uppercase tracking-widest mt-1">Nước Tặng Kèm</span>
                </div>
              </div>
              
              <div className="bg-emerald-900/10 border border-emerald-500/20 rounded-xl p-4 text-xs text-stone-300 space-y-2">
                <p className="flex items-start gap-2">
                  <span className="text-amber-400">💡</span> 
                  <span><strong>Điểm Tích Lũy:</strong> Mỗi 10.000đ chi tiêu (tiền giờ, tiền nước, gia hạn) bạn sẽ nhận được 1 điểm. Khi đạt <strong>100 điểm</strong>, hệ thống sẽ hiện nút để bạn có thể quy đổi thành <strong>1 giờ ngồi miễn phí</strong> (cộng vào số dư Bảo lưu).</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-pink-400">🎁</span> 
                  <span><strong>Nước Tặng Kèm:</strong> Bạn sẽ được tặng ly nước miễn phí vào tháng sinh nhật (Nhớ cập nhật ngày sinh bên dưới nhé). Nước sẽ tự động trừ tiền khi bạn gọi món.</span>
                </p>
              </div>

              <h3 className="font-bold text-lg text-emerald-400">Thông tin Cá nhân</h3>
              
              <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-400 mb-1">Tên hiển thị</label>
                  <input type="text" value={member?.name || ""} disabled className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-stone-500 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-400 mb-1">Email</label>
                  <input type="email" value={member?.email || ""} disabled className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-stone-500 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-400 mb-1">Ngày sinh (Để nhận quà sinh nhật)</label>
                  <input 
                    type="text" 
                    placeholder="DD/MM/YYYY (Ví dụ: 25/12/1999)"
                    value={dobInput} 
                    onChange={(e) => setDobInput(e.target.value)}
                    className="w-full bg-black/20 border border-emerald-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50" 
                  />
                  <p className="text-xs text-stone-500 mt-2">Nhập đúng định dạng DD/MM/YYYY. Ngày sinh chỉ được nhập một lần hoặc phải liên hệ nhân viên để đổi lại nhằm tránh gian lận.</p>
                </div>

                <button 
                  disabled={updatingProfile}
                  onClick={async () => {
                    setUpdatingProfile(true);
                    try {
                      const res = await fetch("/api/auth/me", {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ dob: dobInput })
                      });
                      if (res.ok) {
                        toast.success("Cập nhật thành công!");
                        fetchData();
                      } else {
                        const err = await res.json();
                        toast.error(err.error || "Lỗi cập nhật");
                      }
                    } catch(e) {
                      toast.error("Lỗi kết nối");
                    }
                    setUpdatingProfile(false);
                  }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold transition-all active:scale-95 disabled:opacity-50"
                >
                  {updatingProfile ? "Đang lưu..." : "Lưu Thay Đổi"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-stone-950/80 backdrop-blur-xl border-t border-white/10 z-50">
          <div className="flex justify-around items-center px-2 py-3">
            <button 
              onClick={() => setActiveTab("menu")}
              className={`flex flex-col items-center gap-1 p-2 flex-1 rounded-xl transition-all ${activeTab === 'menu' ? 'text-emerald-400' : 'text-stone-500 hover:text-stone-300'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>
              <span className="text-[10px] font-bold uppercase tracking-wider">Menu</span>
            </button>
            <button 
              onClick={() => setActiveTab("cart")}
              className={`flex flex-col items-center gap-1 p-2 flex-1 rounded-xl transition-all relative ${activeTab === 'cart' ? 'text-emerald-400' : 'text-stone-500 hover:text-stone-300'}`}
            >
              <div className="relative">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                {(cart.reduce((acc, item) => acc + item.quantity, 0) + (selectedPkg ? 1 : 0)) > 0 && (
                  <span className="absolute -top-2 -right-2 bg-amber-500 text-stone-900 text-[10px] font-black w-4 h-4 flex items-center justify-center rounded-full animate-bounce">
                    {cart.reduce((acc, item) => acc + item.quantity, 0) + (selectedPkg ? 1 : 0)}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider">Giỏ Hàng</span>
            </button>
            <button 
              onClick={() => setActiveTab("history")}
              className={`flex flex-col items-center gap-1 p-2 flex-1 rounded-xl transition-all ${activeTab === 'history' ? 'text-emerald-400' : 'text-stone-500 hover:text-stone-300'}`}
            >
              <div className="relative">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><path d="M12 7v5l4 2"/></svg>
                {activeSession && activeTab !== 'history' && (
                  <span className="absolute 0 top-0 right-0 w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
                )}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider">Lịch sử</span>
            </button>
            <button 
              onClick={() => setActiveTab("profile")}
              className={`flex flex-col items-center gap-1 p-2 flex-1 rounded-xl transition-all ${activeTab === 'profile' ? 'text-emerald-400' : 'text-stone-500 hover:text-stone-300'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              <span className="text-[10px] font-bold uppercase tracking-wider">Cá Nhân</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
