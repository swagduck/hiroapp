"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

export default function CustomerOrderPage() {
  const params = useParams();
  const sessionCode = params.sessionCode as string;
  const [activeTab, setActiveTab] = useState("menu");
  
  const [session, setSession] = useState<any>(null);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());

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
        const [resSession, resMenu] = await Promise.all([
          fetch(`/api/sessions/${sessionCode}?t=${new Date().getTime()}`, { cache: 'no-store' }),
          fetch(`/api/menu`)
        ]);
        
        if (resSession.ok) {
          const dataSession = await resSession.json();
          setSession(dataSession);
        }
        
        if (resMenu.ok) {
          const dataMenu = await resMenu.json();
          setMenuItems(dataMenu);
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
    
    let totalAmount = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const orderItems = cart.map(item => ({
      menuItemId: item.id,
      quantity: item.quantity,
      price: item.price
    }));

    const isComboAvailable = session?.package?.includesDrink && !session?.freeDrinkClaimed;
    if (isComboAvailable && cart.length > 0) {
      totalAmount -= cart[0].price;
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
        alert("Order thành công! Nhân viên sẽ mang nước ra cho bạn.");
        setCart([]);
        setActiveTab("account");
        // refresh session to see orders
        const resSession = await fetch(`/api/sessions/${sessionCode}`);
        if (resSession.ok) setSession(await resSession.json());
      } else {
        alert("Có lỗi xảy ra, vui lòng thử lại.");
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-stone-950 flex justify-center items-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-emerald-600"></div></div>;
  }

  if (!session) {
    return <div className="min-h-screen bg-stone-950 text-white flex flex-col justify-center items-center"><p>Phiên không tồn tại hoặc đã kết thúc.</p></div>;
  }

  const expireTime = session?.package?.duration ? new Date(session.startTime).getTime() + session.package.duration * 60000 : null;
  const remainingMs = expireTime ? expireTime - now.getTime() : null;
  const remainingMinutes = remainingMs ? Math.ceil(remainingMs / 60000) : null;
  const showWarning = remainingMinutes !== null && remainingMinutes <= 15 && remainingMinutes > 0;
  const isExpired = remainingMinutes !== null && remainingMinutes <= 0;

  return (
    <div className="min-h-screen bg-slate-950 flex justify-center overflow-x-hidden">
      <div className="w-full max-w-md flex flex-col min-h-screen bg-stone-950 text-white pb-20 shadow-2xl border-x border-white/5 relative">
      {/* Header */}
      <header className="glass sticky top-0 z-10 px-4 py-4 border-b border-white/10 shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-amber-500">Space Menu</h1>
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
          <span className="text-sm font-bold">Đã hết thời gian. Vui lòng đến quầy gia hạn nếu muốn ngồi thêm!</span>
        </div>
      )}

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
                <p className="text-sm font-medium text-purple-300">🎁 Bạn được tặng 1 ly nước theo gói Combo! (Miễn phí món đầu tiên)</p>
              </div>
            )}

            {cart.length === 0 ? (
              <p className="text-center text-stone-500 py-10">Giỏ hàng trống.</p>
            ) : (
              <div className="space-y-4">
                {cart.map((item, idx) => {
                  const isFree = session?.package?.includesDrink && !session?.freeDrinkClaimed && idx === 0;
                  return (
                  <div key={idx} className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/10">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-emerald-500">
                        {isFree && item.quantity === 1 ? "Miễn phí" : item.price.toLocaleString('vi-VN') + "đ x " + item.quantity}
                      </p>
                    </div>
                    <div className="font-bold">
                      {isFree 
                        ? (item.price * (item.quantity - 1)).toLocaleString('vi-VN') + "đ" 
                        : (item.price * item.quantity).toLocaleString('vi-VN') + "đ"
                      }
                    </div>
                  </div>
                )})}
                <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                  <span className="font-medium">Tổng cộng:</span>
                  <span className="text-xl font-bold text-emerald-500">
                    {(() => {
                      let total = cart.reduce((a, b) => a + b.price * b.quantity, 0);
                      if (session?.package?.includesDrink && !session?.freeDrinkClaimed && cart.length > 0) {
                        total -= cart[0].price;
                      }
                      return total.toLocaleString('vi-VN');
                    })()}đ
                  </span>
                </div>
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
