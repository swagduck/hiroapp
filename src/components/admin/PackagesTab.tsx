import { useState, useEffect } from "react";

export default function PackagesTab() {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  // Form states
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");
  const [includesDrink, setIncludesDrink] = useState(false);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/packages');
      const data = await res.json();
      setPackages(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const openAddModal = () => {
    setEditingItem(null);
    setName("");
    setPrice("");
    setDuration("");
    setIncludesDrink(false);
    setIsModalOpen(true);
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    setName(item.name);
    setPrice(item.price.toString());
    setDuration(item.duration ? item.duration.toString() : "");
    setIncludesDrink(item.includesDrink || false);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) return;

    try {
      const url = '/api/packages';
      const method = editingItem ? 'PUT' : 'POST';
      const body = {
        id: editingItem?.id,
        name,
        price,
        type: "HOURLY", // Default since Prisma requires it
        duration: duration || null,
        includesDrink
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchPackages();
      } else {
        alert("Có lỗi xảy ra!");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa gói này? (Các hóa đơn cũ vẫn được giữ nguyên)")) return;
    
    try {
      const res = await fetch('/api/packages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'delete' })
      });
      if (res.ok) {
        fetchPackages();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading && packages.length === 0) {
    return <div className="flex justify-center items-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-600"></div></div>;
  }

  return (
    <div className="glass-card h-full flex flex-col overflow-hidden animate-page-transition">
      <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 7h.01"/><path d="M17 7h.01"/><path d="M7 17h.01"/><path d="M17 17h.01"/></svg>
          Quản lý Gói cước / Bảng giá
        </h3>
        <button onClick={openAddModal} className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors shadow-[0_0_15px_rgba(4,120,87,0.4)]">
          + Thêm Gói
        </button>
      </div>
      
      <div className="flex-1 overflow-auto p-6 custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {packages.map(pkg => (
            <div key={pkg.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col relative group hover:bg-white/10 transition-colors">
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <button onClick={() => openEditModal(pkg)} className="p-1.5 bg-blue-500/80 hover:bg-blue-500 text-white rounded-md transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg></button>
                <button onClick={() => handleDelete(pkg.id)} className="p-1.5 bg-red-500/80 hover:bg-red-500 text-white rounded-md transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
              </div>
              
              <div className="mb-4">
                <h4 className="font-bold text-gray-200 text-lg">{pkg.name}</h4>
                {pkg.includesDrink ? (
                  <span className="inline-block mt-2 text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full font-medium">✨ Miễn phí 1 ly nước</span>
                ) : (
                  <span className="inline-block mt-2 text-xs px-2 py-1 bg-[#f3f0e8]0/20 text-stone-400 rounded-full font-medium">Chỉ chỗ ngồi</span>
                )}
              </div>

              <div className="mt-auto pt-4 border-t border-white/10 flex justify-between items-end">
                <div>
                  <p className="text-xs text-stone-500">Thời gian</p>
                  <p className="text-sm font-medium text-stone-300">{pkg.duration ? `${pkg.duration / 60} tiếng` : "Không giới hạn"}</p>
                </div>
                <p className="text-emerald-500 font-bold text-xl">{pkg.price.toLocaleString('vi-VN')}đ</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#141c16]/60 backdrop-blur-sm p-4">
          <div className="bg-stone-950 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">{editingItem ? "Sửa gói cước" : "Thêm gói cước mới"}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-stone-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-stone-400 mb-1">Tên gói cước</label>
                <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-[#141c16]/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-600" placeholder="VD: Combo Sinh viên 4H" />
              </div>
              <div>
                <label className="block text-sm text-stone-400 mb-1">Giá tiền (VNĐ)</label>
                <input required type="number" value={price} onChange={e => setPrice(e.target.value)} className="w-full bg-[#141c16]/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-600" placeholder="VD: 55000" />
              </div>
              <div>
                <label className="block text-sm text-stone-400 mb-1">Thời lượng (Phút) - Để trống nếu không giới hạn</label>
                <input type="number" value={duration} onChange={e => setDuration(e.target.value)} className="w-full bg-[#141c16]/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-600" placeholder="VD: 240 (Tương đương 4 tiếng)" />
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 mt-2">
                <input 
                  type="checkbox" 
                  id="includesDrink" 
                  checked={includesDrink} 
                  onChange={e => setIncludesDrink(e.target.checked)} 
                  className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
                />
                <label htmlFor="includesDrink" className="text-sm font-medium text-gray-200 cursor-pointer">
                  Mô hình Combo: Khách được <span className="text-green-400">miễn phí 1 ly nước</span> đầu tiên khi chọn mua gói này.
                </label>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors">Hủy</button>
                <button type="submit" className="flex-1 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold transition-colors">Lưu lại</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
