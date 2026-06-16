"use client";

import { useState, useEffect } from "react";

export default function AnalyticsTab() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchData();
  }, [date]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics?date=${date}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Báo cáo Doanh thu</h2>
          <p className="text-stone-400 text-sm mt-1">Thống kê hoạt động kinh doanh trong ngày</p>
        </div>
        <div>
          <input 
            type="date" 
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-stone-900 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-emerald-900/40 to-stone-900/40 border border-emerald-500/20 p-6 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <p className="text-stone-400 text-sm font-medium mb-1">Tổng doanh thu</p>
          <h3 className="text-3xl font-black text-emerald-400">{formatPrice(data.metrics.totalRevenue)}</h3>
        </div>

        <div className="bg-stone-900/40 border border-white/5 p-6 rounded-2xl relative overflow-hidden">
          <p className="text-stone-400 text-sm font-medium mb-1">Doanh thu Gói cước</p>
          <h3 className="text-2xl font-bold text-white">{formatPrice(data.metrics.packageRevenue)}</h3>
          <p className="text-xs text-stone-500 mt-2">Từ {data.metrics.activeSessions + data.metrics.completedSessions} lượt khách</p>
        </div>

        <div className="bg-stone-900/40 border border-white/5 p-6 rounded-2xl relative overflow-hidden">
          <p className="text-stone-400 text-sm font-medium mb-1">Doanh thu Nước uống</p>
          <h3 className="text-2xl font-bold text-white">{formatPrice(data.metrics.orderRevenue)}</h3>
          <p className="text-xs text-stone-500 mt-2">Từ {data.metrics.totalOrders} đơn hàng</p>
        </div>

        <div className="bg-stone-900/40 border border-white/5 p-6 rounded-2xl relative overflow-hidden flex flex-col justify-center">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-stone-400 text-sm font-medium mb-1">Đang phục vụ</p>
              <h3 className="text-2xl font-bold text-amber-400">{data.metrics.activeSessions} <span className="text-sm font-normal text-stone-500">khách</span></h3>
            </div>
            <div className="text-right">
              <p className="text-stone-400 text-sm font-medium mb-1">Đã hoàn thành</p>
              <h3 className="text-2xl font-bold text-stone-300">{data.metrics.completedSessions} <span className="text-sm font-normal text-stone-500">khách</span></h3>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Drinks */}
        <div className="bg-stone-900/40 border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Top đồ uống bán chạy</h3>
          
          {data.topDrinks.length === 0 ? (
            <div className="text-center py-8 text-stone-500">Chưa có dữ liệu bán nước uống</div>
          ) : (
            <div className="space-y-4">
              {data.topDrinks.map((drink: any, index: number) => (
                <div key={index} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center text-xs font-bold text-stone-400 group-hover:bg-emerald-900 group-hover:text-emerald-400 transition-colors">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-stone-200">{drink.name}</p>
                      <p className="text-xs text-stone-500">{drink.quantity} ly đã bán</p>
                    </div>
                  </div>
                  <div className="font-bold text-emerald-400/80">
                    {formatPrice(drink.revenue)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Helper Note */}
        <div className="bg-stone-900/40 border border-white/10 rounded-2xl p-6 flex items-center justify-center">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 bg-blue-900/20 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Ghi chú Báo cáo</h3>
            <p className="text-stone-400 text-sm">
              Doanh thu Gói cước được tính dựa trên thời điểm khách Bắt đầu sử dụng. Doanh thu Nước uống chỉ tính các đơn hàng đã phục vụ hoặc đang chờ (không tính đơn đã hủy).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
