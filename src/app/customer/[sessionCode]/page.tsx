"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

export default function CustomerOrderPage() {
  const params = useParams();
  const router = useRouter();
  const sessionCode = params.sessionCode as string;
  const [activeTab, setActiveTab] = useState("menu");
  
  const [session, setSession] = useState<any>(null);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());

  // Extend States
  const [isExtending, setIsExtending] = useState(false);
  const [extendPkg, setExtendPkg] = useState<string | null>(null);
  const [extending, setExtending] = useState(false);

  // Notification States
  const [notificationPermission, setNotificationPermission] = useState("default");
  const [hasNotifiedWarning, setHasNotifiedWarning] = useState(false);
  const [hasNotifiedExpired, setHasNotifiedExpired] = useState(false);

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
      new Notification("SpaceManager", { body: "Thông báo đã bật. Bạn sẽ nhận được cảnh báo khi sắp hết giờ!" });
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
        // Dùng sóng square để âm thanh to và gắt hơn
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(freq, startTime);
        // Tăng âm lượng lên mức tối đa (1.0)
        gainNode.gain.setValueAtTime(1.0, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
        oscillator.start(startTime);
        oscillator.stop(startTime + 0.4);
      };
      
      // Lặp lại mỗi 0.5 giây, tổng cộng 10 lần (5 giây)
      for (let i = 0; i < 10; i++) {
        playBeep(isUrgent ? 880 : 600, audioCtx.currentTime + i * 0.5);
      }
    } catch(e) {
      console.error("Audio play failed", e);
    }
    
    // 3. OS Notification
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body, icon: "/favicon.ico" }); // Optional icon
    }
  };

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchSession = async () => {
    try {
      const res = await fetch(`/api/sessions/${sessionCode}?t=${new Date().getTime()}`, { cache: 'no-store' });
      if (res.ok) {
        setSession(await res.json());
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [resSession, resMenu, resPackages] = await Promise.all([
          fetch(`/api/sessions/${sessionCode}?t=${new Date().getTime()}`, { cache: 'no-store' }),
          fetch(`/api/menu`),
          fetch(`/api/packages`)
        ]);
        
        if (resSession.ok) {
          const dataSession = await resSession.json();
          setSession(dataSession);
        }
        
        if (resMenu.ok) {
          const dataMenu = await resMenu.json();
          setMenuItems(dataMenu);
        }

        if (resPackages.ok) {
          const dataPackages = await resPackages.json();
          setPackages(dataPackages.filter((p: any) => p.isActive));
        }
      } catch (error) {
        console.error("Lỗi lấy dữ liệu:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialData();
    const intervalId = setInterval(fetchSession, 10000); // Auto refresh orders status every 10s
    return () => clearInterval(intervalId);
  }, [sessionCode]);

  const addToCart = (item: any) => {
    const existing = cart.find(c => c.id === item.id);
    if (existing) {
      setCart(cart.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const submitOrder = async () => {
    if (cart.length === 0 || !session) return;
    
    const isMember = !!session.userId;
    let totalAmount = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    
    if (isMember) {
      totalAmount = totalAmount * 0.9;
    }

    const orderItems = cart.map(item => ({
      menuItemId: item.id,
      quantity: item.quantity,
      price: isMember ? item.price * 0.9 : item.price
    }));

    const isComboAvailable = session?.package?.includesDrink && !session?.freeDrinkClaimed;
    if (isComboAvailable && cart.length > 0) {
      const firstDrinkPrice = isMember ? cart[0].price * 0.9 : cart[0].price;
      totalAmount -= firstDrinkPrice;
      orderItems[0].price = 0;
    }

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          totalAmount,
          items: orderItems,
          updateFreeDrink: isComboAvailable
        })
      });

      if (res.ok) {
        toast.success("Order thành công! Nhân viên sẽ mang nước ra cho bạn.");
        setCart([]);
        setActiveTab("account");
        // refresh session to see orders
        const resSession = await fetch(`/api/sessions/${sessionCode}`);
        if (resSession.ok) setSession(await resSession.json());
      } else {
        toast.error("Có lỗi xảy ra, vui lòng thử lại.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Lỗi kết nối");
    }
  };

  const handleExtend = async () => {
    if (!extendPkg) return toast.error("Vui lòng chọn 1 gói!");
    setExtending(true);
    try {
      const res = await fetch(`/api/sessions/${sessionCode}/extend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: extendPkg })
      });
      if (res.ok) {
        toast.success("Đã gửi yêu cầu gia hạn! Nhân viên sẽ ra hỗ trợ bạn thanh toán.");
        setIsExtending(false);
        setExtendPkg(null);
        fetchSession();
      } else {
        toast.error("Có lỗi xảy ra");
      }
    } catch(e) {
      toast.error("Lỗi kết nối");
    } finally {
      setExtending(false);
    }
  };

  const baseDuration = session?.savedMinutesUsed || session?.package?.duration;
  const duration = baseDuration ? baseDuration + (session?.extraMinutes || 0) : null;
  const expireTime = duration ? new Date(session.startTime).getTime() + duration * 60000 : null;
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
      playAlert("Đã hết giờ!", "Thời gian sử dụng của bạn đã hết. Vui lòng đến quầy nếu muốn gia hạn.", true);
      setHasNotifiedExpired(true);
    }
  }, [remainingMinutes, hasNotifiedWarning, hasNotifiedExpired]);

  if (loading) {
    return <div className="min-h-screen bg-stone-950 flex justify-center items-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-emerald-600"></div></div>;
  }

  if (!session) {
    return <div className="min-h-screen bg-stone-950 text-white flex flex-col justify-center items-center"><p>Phiên không tồn tại hoặc đã kết thúc.</p></div>;
  }



  return (
    <div className="min-h-screen bg-slate-950 flex justify-center overflow-x-hidden">
      <div className="w-full max-w-md flex flex-col min-h-screen bg-stone-950 text-white pb-20 shadow-2xl border-x border-white/5 relative">
      
      {/* Banner xin quyền thông báo */}
      {notificationPermission === "default" && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 p-3 flex justify-between items-center px-4 animate-slide-down">
          <span className="text-amber-400 text-xs font-medium pr-2">Bật thông báo để nhận cảnh báo khi sắp hết giờ</span>
          <button onClick={requestNotificationPermission} className="bg-amber-500 text-stone-900 text-xs font-bold px-3 py-2 rounded-lg shadow-[0_0_10px_rgba(245,158,11,0.3)] shrink-0">
            Cho phép
          </button>
        </div>
      )}

      {/* Nút Test Thông Báo (Chỉ để trải nghiệm thử) */}
      <div className="bg-indigo-500/10 border-b border-indigo-500/30 p-2 flex justify-between items-center px-4">
        <span className="text-indigo-400 text-xs font-medium">Bấm để thử nghiệm âm thanh & thông báo 👉</span>
        <button 
          onClick={() => playAlert("Sắp hết giờ (Thử nghiệm)!", "Đây là cách thông báo sẽ hiện ra khi bạn sắp hết thời gian.", false)} 
          className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/50 text-xs font-bold px-3 py-1.5 rounded-lg shrink-0 active:bg-indigo-500/40 transition-colors"
        >
          Test Thử
        </button>
      </div>

      <header className="glass sticky top-0 z-10 px-4 py-4 border-b border-white/10 shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            {!!session.userId && (
              <button 
                onClick={() => {
                  toast("Đang chuyển trang...", { duration: 1500 });
                  router.push('/member/dashboard');
                }} 
                className="w-8 h-8 flex items-center justify-center -ml-2 rounded-lg bg-white/5 hover:bg-white/10 text-stone-400 hover:text-white transition-colors"
                title="Quay lại Dashboard"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              </button>
            )}
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-amber-500">Space Menu</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 rounded bg-emerald-600/20 text-purple-300 font-mono text-sm font-bold border border-emerald-600/30">
              #{sessionCode.toUpperCase()}
            </span>
          </div>
        </div>
        
        <div className="p-3 rounded-xl bg-gradient-to-r from-slate-800 to-slate-800/50 border border-white/5 flex justify-between items-center">
          <div>
            <p className="text-xs text-stone-400">Gói sử dụng</p>
            <p className="text-sm font-bold text-green-400">{session.package?.name}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-stone-400">Thời gian</p>
            {(() => {
              if (remainingMs === null) return <p className="font-medium">Không giới hạn</p>;
              if (isExpired) return <p className="font-bold text-red-500">Đã hết giờ!</p>;
              const hours = Math.floor(remainingMs / 3600000);
              const minutes = Math.floor((remainingMs % 3600000) / 60000);
              return <p className="font-medium text-white">{hours}h {minutes}m</p>;
            })()}
          </div>
        </div>
      </header>

      {/* Cảnh báo sắp hết giờ */}
      {showWarning && (
        <div className="bg-red-500/20 border border-red-500/50 text-red-300 p-3 mx-4 mt-4 rounded-xl flex items-center shadow-lg animate-pulse">
          <span className="mr-2 text-lg">⚠️</span>
          <span className="text-sm font-medium">Phiên của bạn sẽ kết thúc trong vòng {remainingMinutes} phút nữa!</span>
        </div>
      )}

      {isExpired && (
        <div className="bg-red-600/30 border border-red-500 text-red-200 p-3 mx-4 mt-4 rounded-xl flex items-center shadow-lg">
          <span className="mr-2 text-lg">⏰</span>
          <span className="text-sm font-bold">Đã hết thời gian. Vui lòng gia hạn nếu muốn ngồi thêm!</span>
        </div>
      )}

      {/* EXTEND UI */}
      <div className="mx-4 mt-4">
        {(() => {
          const pendingExtension = session?.orders?.find((o: any) => o.isExtension && o.status === 'PENDING');
          if (pendingExtension) {
            return (
              <div className="mt-4 flex flex-col items-center bg-white p-4 rounded-xl mx-auto border border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                <p className="text-stone-900 font-bold mb-2 text-center text-sm">Quét mã để thanh toán gia hạn</p>
                <img 
                  src={`https://img.vietqr.io/image/MB-123456789-compact2.png?amount=${pendingExtension.totalAmount || 0}&addInfo=${session.accessCode}&accountName=SPACE CAFE`} 
                  alt="VietQR" 
                  className="w-[160px] h-[180px] object-contain rounded shadow-sm border border-stone-200" 
                />
                <div className="text-stone-600 text-xs mt-3 text-center space-y-1">
                  <p>Số tiền: <strong className="text-emerald-600 text-sm">{(pendingExtension.totalAmount || 0).toLocaleString('vi-VN')}đ</strong></p>
                  <p>Mã chuyển khoản: <strong className="text-stone-900">{session.accessCode}</strong></p>
                </div>
                <p className="text-amber-500 font-bold mt-2 text-xs text-center animate-pulse">Đang chờ thu ngân duyệt...</p>
              </div>
            );
          }
          
          return duration && (
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => setIsExtending(!isExtending)}
                className="w-full bg-purple-600/20 border border-purple-500 hover:bg-purple-600/30 text-purple-400 py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
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
                    className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded-lg transition-colors disabled:opacity-50 shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                  >
                    {extending ? "Đang xử lý..." : "Xác nhận Gia hạn"}
                  </button>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 relative overflow-hidden">
        {activeTab === "menu" ? (
          <div key="menu" className="animate-page-transition">
            <div className="grid grid-cols-2 gap-4">
              {menuItems.map((item) => (
                <div key={item.id} onClick={() => addToCart(item)} className="glass-card flex flex-col overflow-hidden relative group cursor-pointer transition-transform hover:scale-105 active:scale-95">
                  <div className="h-32 bg-slate-800 flex items-center justify-center text-5xl">
                    {item.imageUrl || "🍹"}
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-sm mb-1 truncate">{item.name}</h3>
                    <p className="text-emerald-500 font-bold text-sm">{item.price.toLocaleString('vi-VN')}đ</p>
                  </div>
                  <button className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center text-white shadow-lg pointer-events-none">
                    +
                  </button>
                </div>
              ))}
            </div>
            {menuItems.length === 0 && <p className="text-center text-stone-500 mt-10">Chưa có món nào trong Menu.</p>}
          </div>
        ) : activeTab === "cart" ? (
          <div key="cart" className="py-4 animate-page-transition">
            <h2 className="text-lg font-medium mb-4">Giỏ hàng của bạn</h2>
            
            {session?.package?.includesDrink && !session?.freeDrinkClaimed && (
              <div className="mb-4 p-3 bg-gradient-to-r from-emerald-700/20 to-amber-600/20 border border-emerald-600/30 rounded-xl">
                <p className="text-sm font-medium text-purple-300">🎁 Bạn được tặng 1 ly nước vì đã mua gói Combo!</p>
              </div>
            )}

            {cart.length === 0 ? (
              <p className="text-center text-stone-500 py-10">Giỏ hàng trống.</p>
            ) : (
              <div className="space-y-4">
                {cart.map((item, idx) => {
                  const isFree = session?.package?.includesDrink && !session?.freeDrinkClaimed && idx === 0;
                  return (
                  <div key={idx} className="flex flex-col bg-white/5 p-3 rounded-lg border border-white/10 gap-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-emerald-500">
                          {isFree && item.quantity === 1 ? "Tặng kèm (Gói Combo)" : item.price.toLocaleString('vi-VN') + "đ/ly"}
                        </p>
                      </div>
                      <div className="font-bold text-lg">
                        {isFree 
                          ? (item.price * (item.quantity - 1)).toLocaleString('vi-VN') + "đ" 
                          : (item.price * item.quantity).toLocaleString('vi-VN') + "đ"
                        }
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      {isFree ? (
                        <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded">Tặng kèm (1 ly)</span>
                      ) : (
                        <span></span>
                      )}
                      <div className="flex items-center gap-3 bg-stone-900 rounded-lg px-2 py-1 border border-white/5">
                        <button onClick={() => {
                            if (item.quantity > 1) {
                              setCart(cart.map(c => c.id === item.id ? { ...c, quantity: c.quantity - 1 } : c));
                            } else {
                              setCart(cart.filter(c => c.id !== item.id));
                            }
                        }} className="w-6 h-6 flex items-center justify-center text-stone-400 hover:text-white hover:bg-white/10 rounded transition-colors">-</button>
                        <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                        <button onClick={() => setCart(cart.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c))} className="w-6 h-6 flex items-center justify-center text-stone-400 hover:text-white hover:bg-white/10 rounded transition-colors">+</button>
                      </div>
                    </div>
                  </div>
                )})}
                <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                  <span className="font-medium">Tổng cộng:</span>
                  <span className="text-xl font-bold text-emerald-500">
                    {(() => {
                      const isMember = !!session?.userId;
                      let total = cart.reduce((a, b) => a + b.price * b.quantity, 0);
                      if (isMember) total = total * 0.9;
                      
                      if (session?.package?.includesDrink && !session?.freeDrinkClaimed && cart.length > 0) {
                        const firstPrice = isMember ? cart[0].price * 0.9 : cart[0].price;
                        total -= firstPrice;
                      }
                      return total.toLocaleString('vi-VN');
                    })()}đ
                  </span>
                </div>
                {!!session?.userId && cart.length > 0 && (
                  <div className="bg-emerald-900/10 text-emerald-400 text-xs p-3 rounded-lg border border-emerald-500/20 flex items-center gap-2 mt-2">
                    <span>💎</span>
                    <span>Đã giảm 10% tiền nước (Đặc quyền Hội viên)</span>
                  </div>
                )}
                <button onClick={submitOrder} className="w-full mt-6 py-3 rounded-xl bg-gradient-to-r from-emerald-700 to-amber-600 text-white font-bold shadow-lg active:scale-95 transition-transform">
                  Xác nhận Order
                </button>
              </div>
            )}
          </div>
        ) : (
          <div key="account" className="py-4 animate-page-transition">
            <h2 className="text-lg font-medium mb-4">Đơn hàng đã gọi</h2>
            {(!session.orders || session.orders.length === 0) ? (
              <p className="text-center text-stone-500 py-10">Bạn chưa order món nào.</p>
            ) : (
              <div className="space-y-4">
                {session.orders.map((order: any, idx: number) => (
                  <div key={idx} className="bg-white/5 p-4 rounded-lg border border-white/10">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-stone-400">Đơn #{idx+1}</span>
                      <span className={`text-xs px-2 py-1 rounded ${order.status === 'SERVED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                        {order.status === 'SERVED' ? 'ĐÃ XONG' : order.status}
                      </span>
                    </div>
                    {order.items.map((oi: any, i: number) => (
                      <div key={i} className="flex justify-between text-sm py-1">
                        <span>{oi.quantity}x {oi.menuItem?.name}</span>
                        <span>{(oi.price * oi.quantity).toLocaleString('vi-VN')}đ</span>
                      </div>
                    ))}
                    
                    {order.status === 'PENDING' && !order.isExtension && (
                      <div className="mt-3 pt-3 border-t border-white/10 flex flex-col items-center">
                        <p className="text-xs mb-2 text-amber-400">Quét mã thanh toán đơn nước này</p>
                        <img 
                          src={`https://img.vietqr.io/image/MB-123456789-compact2.png?amount=${order.totalAmount || 0}&addInfo=${session.accessCode}&accountName=SPACE CAFE`} 
                          className="w-24 h-24 mx-auto rounded border border-white/10" 
                          alt="QR Thanh toán"
                        />
                        <p className="text-xs font-bold text-emerald-400 mt-2">{(order.totalAmount || 0).toLocaleString('vi-VN')}đ</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 w-full max-w-md bg-stone-950/80 backdrop-blur-xl border-t border-white/10 p-2 px-6 flex justify-around pb-6 z-50 rounded-b-lg">
        <button onClick={() => setActiveTab("menu")} className={`flex flex-col items-center justify-center p-2 transition-colors ${activeTab === "menu" ? "text-emerald-500 drop-shadow-[0_0_8px_rgba(192,132,252,0.8)]" : "text-stone-500 hover:text-stone-400"}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-1"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
          <span className="text-[10px] font-bold tracking-wide uppercase">Menu</span>
        </button>

        <button onClick={() => setActiveTab("cart")} className={`flex flex-col items-center justify-center p-2 relative transition-all ${activeTab === "cart" ? "text-emerald-500 drop-shadow-[0_0_8px_rgba(192,132,252,0.8)] scale-110" : "text-stone-500 hover:text-stone-400"}`}>
          <div className="relative">
            <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-1"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            {cart.length > 0 && <span className="absolute -top-1 -right-2 bg-gradient-to-tr from-amber-600 to-rose-400 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold shadow-[0_0_10px_rgba(225,29,72,0.8)] animate-bounce">{cart.length}</span>}
          </div>
          <span className="text-[10px] font-bold tracking-wide uppercase">Giỏ hàng</span>
        </button>

        <button onClick={() => setActiveTab("account")} className={`flex flex-col items-center justify-center p-2 transition-all ${activeTab === "account" ? "text-emerald-500 drop-shadow-[0_0_8px_rgba(192,132,252,0.8)]" : "text-stone-500 hover:text-stone-400"}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-1"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          <span className="text-[10px] font-bold tracking-wide uppercase">Lịch sử</span>
        </button>
      </nav>
      </div>
    </div>
  );
}
