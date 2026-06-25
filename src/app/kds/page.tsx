"use client";

import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { pusherClient } from "@/lib/pusherClient";

interface OrderItem {
  id: string;
  quantity: number;
  status: "PENDING" | "PREPARING" | "SERVED" | "CANCELLED";
  menuItem: {
    name: string;
  };
}

interface Order {
  id: string;
  createdAt: string;
  status: "PENDING" | "PREPARING" | "SERVED" | "CANCELLED";
  items: OrderItem[];
  user?: { name: string; phone: string };
  session?: {
    user?: { name: string; phone: string };
  };
}

export default function KDSPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const previousOrdersCount = useRef<number>(0);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/staff/kds', { cache: 'no-store' });
      if (res.ok) {
        const data: Order[] = await res.json();
        setOrders(data);
        
        // Play beep sound if new order arrives
        if (data.length > previousOrdersCount.current && previousOrdersCount.current !== 0) {
          playBeep();
        }
        previousOrdersCount.current = data.length;
      }
    } catch (error) {
      console.error("KDS Fetch Error", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000); // 5s fallback polling
    
    if (!pusherClient) return;

    const channel = pusherClient.subscribe('orders-channel');
    channel.bind('new-order', () => {
      fetchOrders();
    });
    channel.bind('order-updated', () => {
      fetchOrders();
    });

    return () => {
      clearInterval(interval);
      channel.unbind('new-order');
      channel.unbind('order-updated');
      pusherClient.unsubscribe('orders-channel');
    };
  }, []);

  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, audioCtx.currentTime); 
      oscillator.frequency.setValueAtTime(1200, audioCtx.currentTime + 0.1); 
      gainNode.gain.setValueAtTime(1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.3);
    } catch (e) {
      // Ignore
    }
  };

  const updateItemStatus = async (itemId: string, newStatus: string) => {
    try {
      // Optimistic UI update
      setOrders(prev => prev.map(o => ({
        ...o,
        items: o.items.map(i => i.id === itemId ? { ...i, status: newStatus as any } : i)
      })));

      const res = await fetch('/api/staff/kds/item', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, status: newStatus })
      });
      if (!res.ok) {
        toast.error("Lỗi cập nhật trạng thái");
        fetchOrders(); // revert
      }
    } catch (error) {
      toast.error("Mất kết nối");
    }
  };

  const getWaitTime = (createdAt: string) => {
    const diff = new Date().getTime() - new Date(createdAt).getTime();
    const mins = Math.floor(diff / 60000);
    return mins;
  };

  if (loading && orders.length === 0) {
    return <div className="min-h-screen bg-stone-950 flex items-center justify-center text-stone-400">Đang tải KDS...</div>;
  }

  return (
    <div className="min-h-screen bg-stone-950 text-white p-4 font-sans flex flex-col h-screen overflow-hidden">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10 shrink-0">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-amber-500">MÀN HÌNH PHA CHẾ (KDS)</h1>
          <p className="text-stone-400 text-sm mt-1">Dành cho Barista - Cập nhật trạng thái từng món nước</p>
        </div>
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2 text-stone-400 text-sm">
            <span className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse"></span>
            Chờ lâu (&gt;10p)
          </div>
          <button onClick={fetchOrders} className="ml-4 p-2 bg-stone-900 border border-white/10 rounded-lg hover:bg-stone-800 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-stone-400"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 2v6h6"/></svg>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-4 h-full pb-4 items-start w-max">
          {orders.map(order => {
            const customerName = order.user?.name || order.session?.user?.name || "Khách Lẻ";
            const waitTime = getWaitTime(order.createdAt);
            const isUrgent = waitTime >= 10;
            
            // Only show items that are not SERVED/CANCELLED
            const activeItems = order.items.filter(i => i.status === "PENDING" || i.status === "PREPARING");
            
            if (activeItems.length === 0) return null; // All done

            return (
              <div 
                key={order.id} 
                className={`w-[320px] h-full flex flex-col rounded-2xl border-2 shadow-2xl transition-all duration-500 bg-stone-900 ${isUrgent ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'border-white/10'} shrink-0 animate-slide-up`}
              >
                {/* Header */}
                <div className={`p-4 rounded-t-xl border-b flex justify-between items-start ${isUrgent ? 'bg-red-500/20 border-red-500/50' : 'bg-stone-950 border-white/10'}`}>
                  <div>
                    <h3 className="font-bold text-lg text-white">#{order.id.slice(-4).toUpperCase()}</h3>
                    <p className="text-stone-300 text-sm mt-0.5">{customerName}</p>
                  </div>
                  <div className="text-right">
                    <div className={`font-mono font-bold text-lg ${isUrgent ? 'text-red-400' : 'text-stone-400'}`}>{waitTime}m</div>
                    <p className="text-[10px] text-stone-500">{new Date(order.createdAt).toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'})}</p>
                  </div>
                </div>

                {/* Items */}
                <div className="p-4 flex-1 overflow-y-auto space-y-4 custom-scrollbar">
                  {activeItems.map((item, index) => (
                    <div 
                      key={item.id} 
                      className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                        item.status === "PREPARING" 
                          ? 'bg-amber-500/10 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]' 
                          : 'bg-stone-950 border-white/10'
                      }`}
                    >
                      <div className="flex gap-3 items-center mb-3">
                        <div className={`flex items-center justify-center min-w-[2.5rem] px-2 h-8 rounded-lg font-bold text-lg border ${
                          item.status === "PREPARING" ? 'bg-amber-500 text-stone-950 border-amber-500' : 'bg-stone-800 text-white border-white/20'
                        }`}>
                          {item.quantity}<span className="text-xs ml-0.5 opacity-70">x</span>
                        </div>
                        <span className={`font-medium text-lg leading-tight flex-1 ${item.status === "PREPARING" ? "text-amber-400" : "text-white"}`}>
                          {item.menuItem.name}
                        </span>
                      </div>

                      {/* Explicit Status Buttons */}
                      <div className="grid grid-cols-3 gap-2">
                        <button 
                          onClick={() => updateItemStatus(item.id, "PENDING")}
                          className={`py-2 px-1 text-xs font-bold rounded-lg transition-colors border ${
                            item.status === "PENDING" ? 'bg-stone-700 text-white border-stone-500' : 'bg-transparent text-stone-500 border-white/10 hover:bg-white/5'
                          }`}
                        >
                          Chờ
                        </button>
                        <button 
                          onClick={() => updateItemStatus(item.id, "PREPARING")}
                          className={`py-2 px-1 text-xs font-bold rounded-lg transition-colors border ${
                            item.status === "PREPARING" ? 'bg-amber-500 text-stone-950 border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.4)]' : 'bg-transparent text-stone-500 border-white/10 hover:bg-white/5'
                          }`}
                        >
                          Đang làm
                        </button>
                        <button 
                          onClick={() => updateItemStatus(item.id, "SERVED")}
                          className="py-2 px-1 text-xs font-bold rounded-lg transition-colors border bg-transparent text-stone-500 border-white/10 hover:bg-emerald-500/20 hover:text-emerald-400 hover:border-emerald-500/50"
                        >
                          Xong ✓
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          
          {orders.filter(o => o.items.some(i => i.status === "PENDING" || i.status === "PREPARING")).length === 0 && (
            <div className="w-full flex items-center justify-center text-stone-500 font-medium text-xl mt-32">
              Không có đơn hàng nào đang chờ.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
