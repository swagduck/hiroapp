import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

export default function OrdersTab() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const prevPendingCount = useRef(0);

  const playDing = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(1046.50, audioCtx.currentTime); // C6
      oscillator.frequency.setValueAtTime(1318.51, audioCtx.currentTime + 0.1); // E6
      gainNode.gain.setValueAtTime(1.0, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch(`/api/orders?t=${new Date().getTime()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        const newPendingCount = data.filter((o: any) => o.status === "PENDING").length;
        
        if (newPendingCount > prevPendingCount.current && prevPendingCount.current !== -1) {
          // Prevent alerting on initial load
          if (orders.length > 0) {
            toast.success(`Có ${newPendingCount - prevPendingCount.current} đơn pha chế mới!`);
            playDing();
          }
        }
        prevPendingCount.current = newPendingCount;
        setOrders(data);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000); // 10s auto refresh
    return () => clearInterval(interval);
  }, []);

  const updateOrderStatus = async (id: string, status: string) => {
    // Optimistic update
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchOrders(); // Refresh instantly
      }
    } catch (error) {
      console.error("Error updating order:", error);
      fetchOrders(); // Rollback if error
    }
  };

  const pendingOrders = orders.filter(o => o.status === "PENDING");
  const completedOrders = orders.filter(o => o.status === "SERVED" || o.status === "CANCELLED");

  if (loading) {
    return <div className="p-6 text-white text-center">Đang tải đơn hàng...</div>;
  }

  return (
    <div className="h-full flex flex-col p-4 md:p-6 animate-fade-in overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-amber-500">
            Bảng Đơn Pha Chế
          </h2>
          <p className="text-sm text-stone-400 mt-1">
            Tự động làm mới mỗi 10 giây. Đang chờ: <span className="text-emerald-500 font-bold">{pendingOrders.length}</span> đơn.
          </p>
        </div>
        <button 
          onClick={fetchOrders}
          className="p-2 bg-stone-900 border border-white/10 hover:bg-stone-800 text-white rounded-lg transition-colors flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 2v6h6"/></svg>
          <span className="hidden md:inline text-sm">Làm mới</span>
        </button>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden">
        {/* Cột Chờ Xử Lý */}
        <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl flex flex-col overflow-hidden">
          <div className="h-12 bg-amber-500/20 border-b border-white/10 flex items-center justify-between px-4">
            <h3 className="font-semibold text-amber-500 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              ĐANG CHỜ PHA CHẾ
            </h3>
            <span className="bg-amber-500 text-stone-950 font-bold px-2 py-0.5 rounded-full text-xs">
              {pendingOrders.length}
            </span>
          </div>
          <div className="flex-1 p-4 overflow-y-auto custom-scrollbar space-y-4">
            {pendingOrders.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-stone-500">
                <p>Chưa có đơn mới.</p>
              </div>
            ) : (
              pendingOrders.map(order => (
                <div key={order.id} className="bg-stone-900 border-l-4 border-l-amber-500 border border-white/10 rounded-xl p-4 shadow-lg relative overflow-hidden animate-slide-up">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="bg-stone-800 text-stone-300 text-xs px-2 py-1 rounded font-mono">Phiên/Mã: {order.session?.accessCode || "Không rõ"}</span>
                      <p className="text-xs text-stone-500 mt-1">{new Date(order.createdAt).toLocaleTimeString('vi-VN')}</p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          if (confirm("Xác nhận hủy đơn nước này?")) {
                            updateOrderStatus(order.id, "CANCELLED");
                          }
                        }}
                        className="bg-red-500/20 hover:bg-red-500/40 text-red-400 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        Hủy
                      </button>
                      <button 
                        onClick={() => updateOrderStatus(order.id, "SERVED")}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-[0_0_15px_rgba(5,150,105,0.3)]"
                      >
                        ✓ Hoàn thành
                      </button>
                    </div>
                  </div>
                  <ul className="space-y-2 mt-4">
                    {order.items.map((item: any) => (
                      <li key={item.id} className="flex justify-between items-center text-white bg-white/5 p-2 rounded-lg">
                        <span className="flex items-center gap-2">
                          <span className="w-6 h-6 flex items-center justify-center bg-stone-800 rounded font-bold text-emerald-400 text-xs">{item.quantity}x</span>
                          {item.menuItem.name}
                        </span>
                        <span className="text-stone-400 text-xs">{item.price.toLocaleString('vi-VN')}đ</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Cột Đã Hoàn Thành */}
        <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl flex flex-col overflow-hidden opacity-80 hover:opacity-100 transition-opacity">
          <div className="h-12 bg-emerald-500/10 border-b border-white/10 flex items-center px-4">
            <h3 className="font-semibold text-emerald-500 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              LỊCH SỬ GẦN ĐÂY
            </h3>
          </div>
          <div className="flex-1 p-4 overflow-y-auto custom-scrollbar space-y-3">
            {completedOrders.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-stone-500">
                <p>Trống.</p>
              </div>
            ) : (
              completedOrders.map(order => (
                <div key={order.id} className="bg-stone-900/50 border border-white/5 rounded-xl p-3 flex justify-between items-center">
                  <div>
                    <span className="text-stone-300 font-medium text-sm">Phiên: {order.session?.accessCode || "Không rõ"}</span>
                    <p className="text-xs text-stone-500">{new Date(order.updatedAt).toLocaleTimeString('vi-VN')}</p>
                    <div className="text-xs text-stone-400 mt-1">
                      {order.items.map((i: any) => `${i.quantity}x ${i.menuItem.name}`).join(', ')}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded font-medium ${order.status === 'SERVED' ? 'text-emerald-500 bg-emerald-500/10' : 'text-red-500 bg-red-500/10'}`}>
                    {order.status === 'SERVED' ? 'Đã xong' : 'Đã hủy'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
