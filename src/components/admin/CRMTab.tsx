"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface Customer {
  id: string;
  name: string;
  phone: string;
  dob: string | null;
  customerCode: string | null;
  points: number;
  savedMinutes: number;
  freeDrinkTokens: number;
  totalSpent: number;
  createdAt: string;
}

export default function CRMTab() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Edit state
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editForm, setEditForm] = useState({
    points: 0,
    savedMinutes: 0,
    freeDrinkTokens: 0
  });

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/crm');
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
      } else {
        toast.error("Lỗi lấy dữ liệu khách hàng");
      }
    } catch (error) {
      toast.error("Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleEditClick = (c: Customer) => {
    setEditingCustomer(c);
    setEditForm({
      points: c.points,
      savedMinutes: c.savedMinutes,
      freeDrinkTokens: c.freeDrinkTokens
    });
  };

  const handleSaveEdit = async () => {
    if (!editingCustomer) return;
    
    try {
      const res = await fetch(`/api/admin/crm/${editingCustomer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      
      if (res.ok) {
        toast.success("Cập nhật thành công!");
        setEditingCustomer(null);
        fetchCustomers();
      } else {
        toast.error("Lỗi cập nhật");
      }
    } catch (error) {
      toast.error("Lỗi kết nối");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">Khách Hàng (CRM)</h2>
          <p className="text-stone-400 mt-1">Quản lý khách hàng thành viên, điểm thưởng và thời gian bảo lưu.</p>
        </div>
        <button onClick={fetchCustomers} className="flex items-center gap-2 px-4 py-2 bg-stone-900 border border-white/10 rounded-xl text-stone-300 hover:text-white hover:bg-stone-800 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
          Làm mới
        </button>
      </div>

      <div className="bg-stone-900 border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-stone-300">
            <thead className="text-xs uppercase bg-stone-950 text-stone-400 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 font-bold">Khách Hàng</th>
                <th className="px-6 py-4 font-bold">Liên Hệ</th>
                <th className="px-6 py-4 font-bold text-center">Mã Thành Viên</th>
                <th className="px-6 py-4 font-bold text-right">Tổng Chi Tiêu</th>
                <th className="px-6 py-4 font-bold text-center">Điểm</th>
                <th className="px-6 py-4 font-bold text-center">Phút Bảo Lưu</th>
                <th className="px-6 py-4 font-bold text-center">Ly Nước Free</th>
                <th className="px-6 py-4 font-bold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="px-6 py-10 text-center text-stone-500">Đang tải dữ liệu...</td></tr>
              ) : customers.length === 0 ? (
                <tr><td colSpan={8} className="px-6 py-10 text-center text-stone-500">Chưa có khách hàng thành viên nào.</td></tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-medium text-white">{c.name}</td>
                    <td className="px-6 py-4">{c.phone}</td>
                    <td className="px-6 py-4 text-center font-mono text-purple-400">{c.customerCode || "-"}</td>
                    <td className="px-6 py-4 text-right font-medium text-emerald-400">{c.totalSpent.toLocaleString()}đ</td>
                    <td className="px-6 py-4 text-center font-bold text-amber-500">{c.points}</td>
                    <td className="px-6 py-4 text-center text-cyan-400">{c.savedMinutes}p</td>
                    <td className="px-6 py-4 text-center text-rose-400">{c.freeDrinkTokens} ly</td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleEditClick(c)}
                        className="p-2 bg-stone-800 text-stone-400 rounded-lg hover:text-white hover:bg-stone-700 transition-colors"
                        title="Chỉnh sửa điểm/phút"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingCustomer && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-stone-900 border border-white/10 rounded-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-stone-950">
              <h3 className="font-bold text-xl text-white">Chỉnh Sửa Quyền Lợi</h3>
              <button onClick={() => setEditingCustomer(null)} className="text-stone-400 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-stone-400 mb-1">Khách Hàng</p>
                <p className="font-bold text-white text-lg">{editingCustomer.name} - {editingCustomer.phone}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-stone-400 mb-2">Điểm Thưởng (Points)</label>
                <input 
                  type="number" 
                  value={editForm.points}
                  onChange={(e) => setEditForm({...editForm, points: Number(e.target.value)})}
                  className="w-full bg-stone-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-400 mb-2">Phút Bảo Lưu</label>
                <input 
                  type="number" 
                  value={editForm.savedMinutes}
                  onChange={(e) => setEditForm({...editForm, savedMinutes: Number(e.target.value)})}
                  className="w-full bg-stone-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-400 mb-2">Ly Nước Miễn Phí (Tokens)</label>
                <input 
                  type="number" 
                  value={editForm.freeDrinkTokens}
                  onChange={(e) => setEditForm({...editForm, freeDrinkTokens: Number(e.target.value)})}
                  className="w-full bg-stone-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div className="p-6 border-t border-white/10 flex gap-3">
              <button 
                onClick={() => setEditingCustomer(null)}
                className="flex-1 px-4 py-3 font-bold rounded-xl bg-stone-800 text-white hover:bg-stone-700 transition-colors"
              >
                Hủy
              </button>
              <button 
                onClick={handleSaveEdit}
                className="flex-1 px-4 py-3 font-bold rounded-xl bg-purple-600 text-white hover:bg-purple-500 transition-colors shadow-[0_0_15px_rgba(147,51,234,0.3)]"
              >
                Lưu Thay Đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
