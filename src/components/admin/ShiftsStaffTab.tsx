"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  hourlyWage: number;
}

interface ShiftRecord {
  id: string;
  shift: Shift;
  checkIn: string;
  checkOut: string | null;
  totalHours: number | null;
  totalSalary: number | null;
  status: string;
}

export default function ShiftsStaffTab() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [records, setRecords] = useState<ShiftRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/staff/shifts');
      const data = await res.json();
      if (res.ok) {
        setShifts(data.shifts || []);
        setRecords(data.records || []);
      }
    } catch (error) {
      toast.error("Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCheckIn = async (shiftId: string) => {
    try {
      setCheckingIn(shiftId);
      const res = await fetch('/api/staff/shifts/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shiftId })
      });
      if (res.ok) {
        toast.success("Check-in thành công");
        fetchData();
      } else {
        const error = await res.json();
        toast.error(error.error || "Lỗi check-in");
      }
    } catch (error) {
      toast.error("Lỗi kết nối");
    } finally {
      setCheckingIn(null);
    }
  };

  const handleCheckOut = async (recordId: string) => {
    try {
      setCheckingOut(recordId);
      const res = await fetch('/api/staff/shifts/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordId })
      });
      if (res.ok) {
        toast.success("Check-out thành công");
        fetchData();
      } else {
        const error = await res.json();
        toast.error(error.error || "Lỗi check-out");
      }
    } catch (error) {
      toast.error("Lỗi kết nối");
    } finally {
      setCheckingOut(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">
          Chấm Công Cá Nhân
        </h2>
        <p className="text-stone-400 text-sm mt-1">Check-in, Check-out và xem lịch sử ca làm việc của bạn.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Danh Sách Ca Khả Dụng */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-lg font-bold text-white">Chọn Ca Để Check-in</h3>
          <div className="space-y-3">
            {shifts.map(shift => {
              // Check if already checked in to this shift today
              const activeRecord = records.find(r => r.shift.id === shift.id && r.status === "ACTIVE");
              
              return (
                <div key={shift.id} className={`p-5 rounded-2xl border ${activeRecord ? 'bg-emerald-900/10 border-emerald-500/30' : 'bg-stone-900 border-white/5'}`}>
                  <h4 className="font-bold text-white text-lg">{shift.name}</h4>
                  <p className="text-stone-400 mb-4">{shift.startTime} - {shift.endTime}</p>
                  
                  {activeRecord ? (
                    <div className="space-y-3">
                      <div className="bg-emerald-500/10 text-emerald-400 px-3 py-2 rounded-xl text-sm font-medium text-center">
                        Đã Check-in lúc: {new Date(activeRecord.checkIn).toLocaleTimeString('vi-VN')}
                      </div>
                      <button 
                        onClick={() => handleCheckOut(activeRecord.id)}
                        disabled={checkingOut === activeRecord.id}
                        className="w-full py-3 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-500 disabled:opacity-50 transition-colors"
                      >
                        {checkingOut === activeRecord.id ? "Đang xử lý..." : "CHECK-OUT"}
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleCheckIn(shift.id)}
                      disabled={checkingIn === shift.id}
                      className="w-full py-3 rounded-xl bg-stone-800 text-emerald-400 font-bold hover:bg-stone-700 disabled:opacity-50 transition-colors border border-emerald-500/20"
                    >
                      {checkingIn === shift.id ? "Đang xử lý..." : "CHECK-IN"}
                    </button>
                  )}
                </div>
              );
            })}
            {shifts.length === 0 && !loading && (
              <p className="text-stone-500 text-center py-4">Không có ca làm việc nào khả dụng.</p>
            )}
          </div>
        </div>

        {/* Lịch Sử Gần Đây */}
        <div className="lg:col-span-2">
          <h3 className="text-lg font-bold text-white mb-4">Lịch Sử (Hôm Nay)</h3>
          <div className="bg-stone-900 border border-white/5 rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-900/80 text-stone-400 text-sm border-b border-white/5">
                  <th className="p-4 font-medium">Ca</th>
                  <th className="p-4 font-medium">Giờ vào</th>
                  <th className="p-4 font-medium">Giờ ra</th>
                  <th className="p-4 font-medium">Tổng giờ</th>
                  <th className="p-4 font-medium text-right">Lương ước tính</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-stone-500">Chưa có dữ liệu</td>
                  </tr>
                ) : (
                  records.map((record) => (
                    <tr key={record.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4">
                        <span className="font-bold text-white block">{record.shift.name}</span>
                        {record.status === "ACTIVE" && <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded">Đang làm</span>}
                      </td>
                      <td className="p-4 text-stone-300">
                        {new Date(record.checkIn).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                      </td>
                      <td className="p-4 text-stone-300">
                        {record.checkOut ? new Date(record.checkOut).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'}) : "-"}
                      </td>
                      <td className="p-4 text-stone-300">
                        {record.totalHours ? `${record.totalHours}h` : "-"}
                      </td>
                      <td className="p-4 font-bold text-emerald-400 text-right">
                        {record.totalSalary ? `${record.totalSalary.toLocaleString('vi-VN')}đ` : "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
