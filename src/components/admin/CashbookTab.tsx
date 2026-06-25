"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface CashTransaction {
  id: string;
  type: "IN" | "OUT";
  amount: number;
  category: string;
  description: string | null;
  createdAt: string;
  user: { name: string | null; phone: string | null } | null;
}

export default function CashbookTab() {
  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ totalIn: 0, totalOut: 0, netProfit: 0 });
  const [filterType, setFilterType] = useState<"ALL" | "IN" | "OUT">("ALL");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [formType, setFormType] = useState<"IN" | "OUT">("IN");
  const [formAmount, setFormAmount] = useState("");
  const [formCategory, setFormCategory] = useState("BÁN_HÀNG");
  const [formDescription, setFormDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = {
    IN: ["BÁN_HÀNG", "CHUYỂN_KHOẢN", "KHÁC"],
    OUT: ["NHẬP_KHO", "ĐIỆN_NƯỚC", "MẶT_BẰNG", "LƯƠNG", "MARKETING", "KHÁC"]
  };

  const fetchCashbook = async () => {
    try {
      setLoading(true);
      let url = '/api/admin/cashbook';
      if (filterType !== "ALL") {
        url += `?type=${filterType}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setTransactions(data.data);
        setSummary(data.summary);
      }
    } catch (error) {
      console.error(error);
      toast.error("Lỗi tải sổ quỹ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCashbook();
  }, [filterType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAmount || !formCategory) return;

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/admin/cashbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: formType,
          amount: parseFloat(formAmount),
          category: formCategory,
          description: formDescription
        })
      });

      if (res.ok) {
        toast.success(formType === "IN" ? "Tạo phiếu thu thành công" : "Tạo phiếu chi thành công");
        setShowModal(false);
        setFormAmount("");
        setFormDescription("");
        fetchCashbook();
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Có lỗi xảy ra");
      }
    } catch (error) {
      console.error(error);
      toast.error("Lỗi kết nối");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            Sổ Quỹ Thu Chi
          </h2>
          <p className="text-stone-400 text-sm mt-1">Quản lý dòng tiền, lợi nhuận ròng và các khoản chi phí.</p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={() => { setFormType("OUT"); setFormCategory("NHẬP_KHO"); setShowModal(true); }}
            className="px-4 py-2 bg-rose-500/20 text-rose-400 font-medium rounded-xl hover:bg-rose-500/30 transition-colors flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>
            Tạo Phiếu Chi
          </button>
          <button 
            onClick={() => { setFormType("IN"); setFormCategory("BÁN_HÀNG"); setShowModal(true); }}
            className="px-4 py-2 bg-emerald-500/20 text-emerald-400 font-medium rounded-xl hover:bg-emerald-500/30 transition-colors flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></svg>
            Tạo Phiếu Thu
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-stone-900 border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <p className="text-stone-400 text-sm font-medium mb-1">Tổng Thu (IN)</p>
          <p className="text-3xl font-black text-emerald-400">{summary.totalIn.toLocaleString('vi-VN')}đ</p>
        </div>
        
        <div className="bg-stone-900 border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity text-rose-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <p className="text-stone-400 text-sm font-medium mb-1">Tổng Chi (OUT)</p>
          <p className="text-3xl font-black text-rose-400">{summary.totalOut.toLocaleString('vi-VN')}đ</p>
        </div>

        <div className="bg-stone-900 border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity text-amber-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <p className="text-stone-400 text-sm font-medium mb-1">Lợi Nhuận Ròng (Net Profit)</p>
          <p className={`text-3xl font-black ${summary.netProfit >= 0 ? 'text-amber-400' : 'text-rose-500'}`}>
            {summary.netProfit.toLocaleString('vi-VN')}đ
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {["ALL", "IN", "OUT"].map(type => (
          <button 
            key={type}
            onClick={() => setFilterType(type as any)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filterType === type ? 'bg-white text-black' : 'bg-stone-800 text-stone-400 hover:bg-stone-700'}`}
          >
            {type === "ALL" ? "Tất cả" : type === "IN" ? "Khoản Thu" : "Khoản Chi"}
          </button>
        ))}
      </div>

      {/* Transactions Table */}
      <div className="bg-stone-900/50 rounded-2xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-900/80 text-stone-400 text-sm border-b border-white/5">
                <th className="p-4 font-medium whitespace-nowrap">Thời Gian</th>
                <th className="p-4 font-medium whitespace-nowrap">Loại</th>
                <th className="p-4 font-medium whitespace-nowrap">Số Tiền</th>
                <th className="p-4 font-medium whitespace-nowrap">Danh Mục</th>
                <th className="p-4 font-medium min-w-[200px]">Diễn Giải</th>
                <th className="p-4 font-medium whitespace-nowrap">Người Tạo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-stone-500">Đang tải dữ liệu...</td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-stone-500">Chưa có giao dịch nào</td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-white/5 transition-colors group">
                    <td className="p-4 whitespace-nowrap text-stone-300 text-sm">
                      {new Date(tx.createdAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      {tx.type === "IN" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-xs font-bold">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></svg>
                          THU
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-500/10 text-rose-400 text-xs font-bold">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>
                          CHI
                        </span>
                      )}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span className={`font-bold ${tx.type === "IN" ? "text-emerald-400" : "text-rose-400"}`}>
                        {tx.type === "IN" ? "+" : "-"}{tx.amount.toLocaleString('vi-VN')}đ
                      </span>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span className="text-stone-300 text-sm bg-stone-800 px-2.5 py-1 rounded-md">
                        {tx.category.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-stone-400 text-sm">
                      {tx.description || "-"}
                    </td>
                    <td className="p-4 whitespace-nowrap text-stone-400 text-sm">
                      {tx.user ? tx.user.name || tx.user.phone : "Hệ thống"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-stone-900 border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-slide-up">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-stone-950">
              <h3 className="text-xl font-bold text-white">
                {formType === "IN" ? "Tạo Phiếu Thu" : "Tạo Phiếu Chi"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-stone-500 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-400 mb-1.5">Loại phiếu</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    type="button"
                    onClick={() => { setFormType("IN"); setFormCategory(categories.IN[0]); }}
                    className={`py-2 rounded-xl text-sm font-bold border transition-colors ${formType === "IN" ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400" : "bg-stone-800 border-white/5 text-stone-500"}`}
                  >
                    THU (IN)
                  </button>
                  <button 
                    type="button"
                    onClick={() => { setFormType("OUT"); setFormCategory(categories.OUT[0]); }}
                    className={`py-2 rounded-xl text-sm font-bold border transition-colors ${formType === "OUT" ? "bg-rose-500/20 border-rose-500/50 text-rose-400" : "bg-stone-800 border-white/5 text-stone-500"}`}
                  >
                    CHI (OUT)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-400 mb-1.5">Số tiền (VNĐ) *</label>
                <input 
                  type="number" 
                  required 
                  min="0"
                  step="1000"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  className="w-full bg-stone-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  placeholder="VD: 500000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-400 mb-1.5">Danh mục *</label>
                <select 
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full bg-stone-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none"
                >
                  {categories[formType].map(cat => (
                    <option key={cat} value={cat}>{cat.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-400 mb-1.5">Diễn giải</label>
                <textarea 
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-stone-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
                  placeholder="Nhập lý do thu/chi..."
                  rows={3}
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-xl bg-stone-800 text-white font-bold hover:bg-stone-700 transition-colors"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex-1 py-3 rounded-xl text-white font-bold transition-all ${formType === "IN" ? "bg-emerald-600 hover:bg-emerald-500" : "bg-rose-600 hover:bg-rose-500"} disabled:opacity-50`}
                >
                  {isSubmitting ? "Đang lưu..." : "Xác nhận"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
