"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function VouchersTab() {
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<any>(null);

  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discountType: "PERCENTAGE",
    discountValue: "",
    maxDiscount: "",
    minOrderValue: "",
    validFrom: "",
    validUntil: "",
    usageLimit: "",
    isActive: true
  });

  const fetchVouchers = async () => {
    try {
      const res = await fetch("/api/admin/vouchers");
      if (res.ok) {
        const data = await res.json();
        setVouchers(data);
      }
    } catch (e) {
      toast.error("Lỗi lấy danh sách mã giảm giá");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  const openModal = (voucher: any = null) => {
    if (voucher) {
      setEditingVoucher(voucher);
      setFormData({
        code: voucher.code,
        description: voucher.description || "",
        discountType: voucher.discountType,
        discountValue: voucher.discountValue.toString(),
        maxDiscount: voucher.maxDiscount ? voucher.maxDiscount.toString() : "",
        minOrderValue: voucher.minOrderValue ? voucher.minOrderValue.toString() : "",
        validFrom: voucher.validFrom ? new Date(voucher.validFrom).toISOString().slice(0, 16) : "",
        validUntil: voucher.validUntil ? new Date(voucher.validUntil).toISOString().slice(0, 16) : "",
        usageLimit: voucher.usageLimit ? voucher.usageLimit.toString() : "",
        isActive: voucher.isActive
      });
    } else {
      setEditingVoucher(null);
      setFormData({
        code: "",
        description: "",
        discountType: "PERCENTAGE",
        discountValue: "",
        maxDiscount: "",
        minOrderValue: "",
        validFrom: "",
        validUntil: "",
        usageLimit: "",
        isActive: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.discountValue) {
      return toast.error("Vui lòng nhập mã và mức giảm!");
    }

    const payload = {
      ...formData,
      discountValue: Number(formData.discountValue),
      maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : null,
      minOrderValue: formData.minOrderValue ? Number(formData.minOrderValue) : null,
      usageLimit: formData.usageLimit ? Number(formData.usageLimit) : null,
    };

    const url = editingVoucher ? `/api/admin/vouchers/${editingVoucher.id}` : "/api/admin/vouchers";
    const method = editingVoucher ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        toast.success(editingVoucher ? "Đã cập nhật mã" : "Đã tạo mã mới");
        setIsModalOpen(false);
        fetchVouchers();
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Lỗi lưu mã");
      }
    } catch (error) {
      toast.error("Lỗi mạng");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa mã này?")) return;
    try {
      const res = await fetch(`/api/admin/vouchers/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Đã xóa mã");
        fetchVouchers();
      } else {
        const err = await res.json();
        toast.error(err.error || "Không thể xóa mã");
      }
    } catch (e) {
      toast.error("Lỗi xóa");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Mã giảm giá (Voucher)</h1>
          <p className="text-slate-500 text-sm mt-1">Quản lý các mã khuyến mãi cho khách hàng</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm shadow-indigo-200"
        >
          + Tạo mã mới
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Đang tải...</div>
        ) : vouchers.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-slate-400 mb-3 text-4xl">🏷️</div>
            <p className="text-slate-600 font-medium">Chưa có mã giảm giá nào</p>
            <p className="text-slate-400 text-sm mt-1">Bấm "Tạo mã mới" để bắt đầu</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/80 text-slate-500 text-xs uppercase font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Mã Voucher</th>
                  <th className="px-6 py-4">Mức giảm</th>
                  <th className="px-6 py-4">Điều kiện</th>
                  <th className="px-6 py-4">Sử dụng</th>
                  <th className="px-6 py-4">Hạn dùng</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vouchers.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-indigo-600 uppercase tracking-wide">{v.code}</div>
                      <div className="text-xs text-slate-500 mt-1">{v.description || "Không mô tả"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-700">
                        {v.discountType === "PERCENTAGE" ? `${v.discountValue}%` : `${v.discountValue.toLocaleString('vi-VN')}đ`}
                      </span>
                      {v.discountType === "PERCENTAGE" && v.maxDiscount && (
                        <div className="text-xs text-slate-500">Tối đa {v.maxDiscount.toLocaleString('vi-VN')}đ</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {v.minOrderValue ? `Đơn từ ${v.minOrderValue.toLocaleString('vi-VN')}đ` : "Mọi đơn hàng"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-700 font-medium">{v.usedCount}</span>
                        {v.usageLimit && <span className="text-slate-400 text-sm">/ {v.usageLimit}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {v.validUntil ? new Date(v.validUntil).toLocaleDateString('vi-VN') : "Không giới hạn"}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${v.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {v.isActive ? 'Đang bật' : 'Đã tắt'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-3">
                      <button onClick={() => openModal(v)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Sửa</button>
                      <button onClick={() => handleDelete(v.id)} className="text-rose-600 hover:text-rose-800 text-sm font-medium">Xóa</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-800">{editingVoucher ? "Cập nhật mã giảm giá" : "Tạo mã giảm giá"}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mã Voucher (Code) *</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingVoucher}
                    value={formData.code}
                    onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 uppercase disabled:bg-slate-100"
                    placeholder="VD: GIAM20K"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả (Không bắt buộc)</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2"
                    placeholder="Khuyến mãi cuối tuần..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Loại giảm giá</label>
                    <select
                      value={formData.discountType}
                      onChange={e => setFormData({...formData, discountType: e.target.value})}
                      className="w-full border border-slate-300 rounded-lg px-4 py-2 bg-white"
                    >
                      <option value="PERCENTAGE">Phần trăm (%)</option>
                      <option value="FIXED_AMOUNT">Số tiền (VNĐ)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Mức giảm *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.discountValue}
                      onChange={e => setFormData({...formData, discountValue: e.target.value})}
                      className="w-full border border-slate-300 rounded-lg px-4 py-2"
                      placeholder={formData.discountType === "PERCENTAGE" ? "Ví dụ: 10" : "Ví dụ: 20000"}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {formData.discountType === "PERCENTAGE" && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Giảm tối đa (VNĐ)</label>
                      <input
                        type="number"
                        value={formData.maxDiscount}
                        onChange={e => setFormData({...formData, maxDiscount: e.target.value})}
                        className="w-full border border-slate-300 rounded-lg px-4 py-2"
                        placeholder="Không giới hạn"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Đơn tối thiểu (VNĐ)</label>
                    <input
                      type="number"
                      value={formData.minOrderValue}
                      onChange={e => setFormData({...formData, minOrderValue: e.target.value})}
                      className="w-full border border-slate-300 rounded-lg px-4 py-2"
                      placeholder="Mọi đơn hàng"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Ngày bắt đầu</label>
                    <input
                      type="datetime-local"
                      value={formData.validFrom}
                      onChange={e => setFormData({...formData, validFrom: e.target.value})}
                      className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Ngày hết hạn</label>
                    <input
                      type="datetime-local"
                      value={formData.validUntil}
                      onChange={e => setFormData({...formData, validUntil: e.target.value})}
                      className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Giới hạn số lần dùng</label>
                    <input
                      type="number"
                      value={formData.usageLimit}
                      onChange={e => setFormData({...formData, usageLimit: e.target.value})}
                      className="w-full border border-slate-300 rounded-lg px-4 py-2"
                      placeholder="Không giới hạn"
                    />
                  </div>
                  <div className="flex items-end pb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={e => setFormData({...formData, isActive: e.target.checked})}
                        className="w-4 h-4 text-indigo-600 rounded"
                      />
                      <span className="text-sm font-medium text-slate-700">Đang hoạt động</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
                >
                  {editingVoucher ? "Lưu thay đổi" : "Tạo mã"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
