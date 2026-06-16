import { useState, useEffect } from "react";

export default function MenuTab() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  // Form states
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("☕");

  const fetchMenu = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/menu');
      const data = await res.json();
      setItems(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const openAddModal = () => {
    setEditingItem(null);
    setName("");
    setPrice("");
    setImageUrl("☕");
    setIsModalOpen(true);
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    setName(item.name);
    setPrice(item.price.toString());
    setImageUrl(item.imageUrl || "☕");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) return;

    try {
      const url = '/api/menu';
      const method = editingItem ? 'PUT' : 'POST';
      const body = {
        id: editingItem?.id,
        name,
        price,
        imageUrl,
        categoryId: editingItem?.categoryId || "default" // For simplicity
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchMenu();
      } else {
        alert("Có lỗi xảy ra!");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa món này? (Các hóa đơn cũ vẫn được giữ nguyên)")) return;
    
    try {
      const res = await fetch('/api/menu', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'delete' })
      });
      if (res.ok) {
        fetchMenu();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading && items.length === 0) {
    return <div className="flex justify-center items-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-600"></div></div>;
  }

  return (
    <div className="glass-card h-full flex flex-col overflow-hidden animate-page-transition">
      <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" x2="6" y1="1" y2="4"/><line x1="10" x2="10" y1="1" y2="4"/><line x1="14" x2="14" y1="1" y2="4"/></svg>
          Quản lý Menu Đồ uống
        </h3>
        <button onClick={openAddModal} className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors shadow-[0_0_15px_rgba(4,120,87,0.4)]">
          + Thêm Món
        </button>
      </div>
      
      <div className="flex-1 overflow-auto p-6 custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {items.map(item => (
            <div key={item.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col relative group hover:bg-white/10 transition-colors">
              {/* Nút thao tác ẩn hiện khi hover */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <button onClick={() => openEditModal(item)} className="p-1.5 bg-blue-500/80 hover:bg-blue-500 text-white rounded-md transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg></button>
                <button onClick={() => handleDelete(item.id)} className="p-1.5 bg-red-500/80 hover:bg-red-500 text-white rounded-md transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
              </div>
              
              <div className="flex-1 flex flex-col items-center justify-center text-center mt-4">
                <div className="text-6xl mb-4 drop-shadow-xl select-none">{item.imageUrl || "🍹"}</div>
                <h4 className="font-bold text-gray-200 text-lg">{item.name}</h4>
              </div>
              <div className="mt-4 pt-4 border-t border-white/10 text-center">
                <p className="text-emerald-500 font-bold text-xl">{item.price.toLocaleString('vi-VN')}đ</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#141c16]/60 backdrop-blur-sm p-4">
          <div className="bg-stone-950 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl overflow-x-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">{editingItem ? "Sửa món" : "Thêm món mới"}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-stone-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-stone-400 mb-1">Hình ảnh (Emoji hoặc URL)</label>
                <input required type="text" value={imageUrl} onChange={e => setImageUrl(e.target.value)} className="w-full bg-[#141c16]/50 border border-white/10 rounded-lg px-4 py-2.5 text-white text-2xl text-center focus:outline-none focus:border-emerald-600" />
              </div>
              <div>
                <label className="block text-sm text-stone-400 mb-1">Tên món</label>
                <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-[#141c16]/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-600" placeholder="VD: Trà Đào Cam Sả" />
              </div>
              <div>
                <label className="block text-sm text-stone-400 mb-1">Giá bán (VNĐ)</label>
                <input required type="number" value={price} onChange={e => setPrice(e.target.value)} className="w-full bg-[#141c16]/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-600" placeholder="VD: 45000" />
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
