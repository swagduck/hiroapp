"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  hourlyWage: number;
  isActive: boolean;
}

interface ShiftRecord {
  id: string;
  user: { name: string | null; phone: string | null };
  shift: Shift;
  checkIn: string;
  checkOut: string | null;
  totalHours: number | null;
  totalSalary: number | null;
  status: string;
}

export default function ShiftsAdminTab() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [records, setRecords] = useState<ShiftRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  
  // Form State
  const [name, setName] = useState("");
  const [startTime, setStartTime] = useState("07:00");
  const [endTime, setEndTime] = useState("15:00");
  const [hourlyWage, setHourlyWage] = useState("25000");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resShifts, resRecords] = await Promise.all([
        fetch('/api/admin/shifts'),
        fetch('/api/staff/shifts?all=true')
      ]);
      const dataShifts = await resShifts.json();
      const dataRecords = await resRecords.json();
      
      if (resShifts.ok) setShifts(dataShifts);
      if (resRecords.ok) setRecords(dataRecords.records || []);
    } catch (error) {
      toast.error("Lỗi tải dữ liệu ca làm việc");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    setEditingShift(null);
    setName("");
    setStartTime("07:00");
    setEndTime("15:00");
    setHourlyWage("25000");
    setShowModal(true);
  };

  const openEditModal = (shift: Shift) => {
    setEditingShift(shift);
    setName(shift.name);
    setStartTime(shift.startTime);
    setEndTime(shift.endTime);
    setHourlyWage(shift.hourlyWage.toString());
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingShift ? `/api/admin/shifts/${editingShift.id}` : '/api/admin/shifts';
      const method = editingShift ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, startTime, endTime, hourlyWage })
      });

      if (res.ok) {
        toast.success(editingShift ? "Cập nhật thành công" : "Thêm mới thành công");
        setShowModal(false);
        fetchData();
      } else {
        const error = await res.json();
        toast.error(error.error || "Lỗi hệ thống");
      }
    } catch (error) {
      toast.error("Lỗi kết nối");
    }
  };

  const toggleActive = async (shift: Shift) => {
    try {
      const res = await fetch(`/api/admin/shifts/${shift.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !shift.isActive })
      });
      if (res.ok) {
        toast.success("Cập nhật trạng thái thành công");
        fetchData();
      }
    } catch (error) {
      toast.error("Lỗi kết nối");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            Quản Lý Ca Làm Việc
          </h2>
          <p className="text-stone-400 text-sm mt-1">Cài đặt các ca và theo dõi chấm công nhân viên.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="px-4 py-2 bg-blue-600/20 text-blue-400 font-medium rounded-xl hover:bg-blue-600/30 transition-colors flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          Thêm Ca Mới
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Shifts List */}
        <div className="bg-stone-900 border border-white/5 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Danh Sách Ca Làm Việc</h3>
          <div className="space-y-3">
            {shifts.map(shift => (
              <div key={shift.id} className="flex items-center justify-between p-4 bg-stone-950 rounded-xl border border-white/5">
                <div>
                  <h4 className="font-bold text-white flex items-center gap-2">
                    {shift.name}
                    {!shift.isActive && <span className="px-2 py-0.5 text-[10px] bg-rose-500/20 text-rose-400 rounded">Tạm ẩn</span>}
                  </h4>
                  <p className="text-stone-400 text-sm mt-1">{shift.startTime} - {shift.endTime} • {shift.hourlyWage.toLocaleString('vi-VN')}đ/giờ</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => toggleActive(shift)}
                    className="p-2 text-stone-500 hover:text-white bg-stone-800 rounded-lg transition-colors"
                  >
                    {shift.isActive ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-.722-3.25"/><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
                    )}
                  </button>
                  <button 
                    onClick={() => openEditModal(shift)}
                    className="p-2 text-stone-500 hover:text-blue-400 bg-stone-800 rounded-lg transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22h6a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v10"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10.4 12.6a2 2 0 1 1 3 3L8 21l-4 1 1-4Z"/></svg>
                  </button>
                </div>
              </div>
            ))}
            {shifts.length === 0 && !loading && (
              <p className="text-stone-500 text-center py-4">Chưa có ca làm việc nào.</p>
            )}
          </div>
        </div>

        {/* Shift Records */}
        <div className="bg-stone-900 border border-white/5 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Lịch Sử Chấm Công</h3>
          <div className="space-y-3">
            {records.map(record => (
              <div key={record.id} className="p-4 bg-stone-950 rounded-xl border border-white/5">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-bold text-emerald-400">{record.user?.name || record.user?.phone}</h4>
                    <p className="text-xs text-stone-500">{record.shift.name} ({record.shift.startTime} - {record.shift.endTime})</p>
                  </div>
                  {record.status === "ACTIVE" ? (
                    <span className="px-2 py-1 text-xs font-bold bg-amber-500/20 text-amber-400 rounded-md">Đang làm</span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-bold bg-green-500/20 text-green-400 rounded-md">Hoàn tất</span>
                  )}
                </div>
                
                <div className="flex gap-4 text-sm text-stone-400">
                  <div>
                    <span className="block text-xs text-stone-500">Check-in</span>
                    <span className="font-medium text-white">{new Date(record.checkIn).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                  {record.checkOut && (
                    <>
                      <div>
                        <span className="block text-xs text-stone-500">Check-out</span>
                        <span className="font-medium text-white">{new Date(record.checkOut).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                      <div className="ml-auto text-right">
                        <span className="block text-xs text-stone-500">{record.totalHours} giờ</span>
                        <span className="font-bold text-emerald-400">{(record.totalSalary || 0).toLocaleString('vi-VN')}đ</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
            {records.length === 0 && !loading && (
              <p className="text-stone-500 text-center py-4">Chưa có ai check-in hôm nay.</p>
            )}
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-stone-900 border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-slide-up">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-stone-950">
              <h3 className="text-xl font-bold text-white">
                {editingShift ? "Sửa Ca Làm Việc" : "Thêm Ca Mới"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-stone-500 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-400 mb-1.5">Tên ca *</label>
                <input 
                  type="text" 
                  required 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-stone-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="VD: Ca Sáng"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-400 mb-1.5">Giờ Bắt đầu *</label>
                  <input 
                    type="time" 
                    required 
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-stone-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-400 mb-1.5">Giờ Kết thúc *</label>
                  <input 
                    type="time" 
                    required 
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-stone-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-400 mb-1.5">Mức lương / giờ (VNĐ) *</label>
                <input 
                  type="number" 
                  required 
                  min="0"
                  step="1000"
                  value={hourlyWage}
                  onChange={(e) => setHourlyWage(e.target.value)}
                  className="w-full bg-stone-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
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
                  className="flex-1 py-3 rounded-xl text-white font-bold bg-blue-600 hover:bg-blue-500 transition-colors"
                >
                  Xác nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
