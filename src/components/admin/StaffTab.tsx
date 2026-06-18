import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function StaffTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, userId: string, newRole: string, userName: string} | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      setUsers(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const openConfirm = (id: string, newRole: string, userName: string) => {
    setConfirmModal({ isOpen: true, userId: id, newRole, userName });
  };

  const executeRoleChange = async () => {
    if (!confirmModal) return;
    
    try {
      const res = await fetch(`/api/admin/users/${confirmModal.userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        toast.success("Đã cập nhật quyền!");
        fetchUsers();
      } else {
        toast.error("Lỗi cập nhật");
      }
    } catch (e) {
      toast.error("Lỗi hệ thống");
    } finally {
      setConfirmModal(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-600"></div></div>;
  }

  return (
    <div className="flex flex-col h-full bg-[#141c16]/30 rounded-2xl border border-white/5 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-2">Quản lý Tài khoản</h2>
        <p className="text-stone-400 text-sm">Chỉ ADMIN mới có thể phân quyền cho các tài khoản.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-stone-500 text-sm">
              <th className="p-4 font-medium">Họ Tên</th>
              <th className="p-4 font-medium">Email / SĐT</th>
              <th className="p-4 font-medium">Chức vụ hiện tại</th>
              <th className="p-4 font-medium text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-white/5 transition-colors">
                <td className="p-4 font-medium text-white">{user.name || "Khách ẩn danh"}</td>
                <td className="p-4 text-stone-400">{user.email || user.phone}</td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded text-xs font-bold ${
                    user.role === 'ADMIN' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                    user.role === 'STAFF' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                    'bg-stone-500/20 text-stone-400'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <div className="flex bg-black/40 rounded-lg border border-white/5 p-1 w-max ml-auto shadow-inner">
                    <button 
                      onClick={() => openConfirm(user.id, "CUSTOMER", user.name || "Khách ẩn danh")}
                      className={`px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all ${user.role === 'CUSTOMER' ? 'bg-stone-700 text-white shadow-md' : 'text-stone-500 hover:text-stone-300 hover:bg-white/5'}`}
                    >
                      Khách
                    </button>
                    <button 
                      onClick={() => openConfirm(user.id, "STAFF", user.name || "Khách ẩn danh")}
                      className={`px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all ${user.role === 'STAFF' ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.4)]' : 'text-stone-500 hover:text-blue-400 hover:bg-blue-500/10'}`}
                    >
                      Nhân viên
                    </button>
                    <button 
                      onClick={() => openConfirm(user.id, "ADMIN", user.name || "Khách ẩn danh")}
                      className={`px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all ${user.role === 'ADMIN' ? 'bg-red-600 text-white shadow-[0_0_10px_rgba(220,38,38,0.4)]' : 'text-stone-500 hover:text-red-400 hover:bg-red-500/10'}`}
                    >
                      Quản lý
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Beautiful Confirm Modal */}
      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0d1310]/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-stone-950 border border-white/10 rounded-2xl w-full max-w-sm p-6 shadow-2xl scale-in-center">
            <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-500/30">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <h3 className="text-xl font-bold text-white text-center mb-2">Đổi Quyền Tài Khoản</h3>
            <p className="text-stone-400 text-sm text-center mb-6">
              Bạn có chắc muốn cấp quyền <strong className={`font-bold ${confirmModal.newRole === 'ADMIN' ? 'text-red-400' : confirmModal.newRole === 'STAFF' ? 'text-blue-400' : 'text-stone-300'}`}>{confirmModal.newRole}</strong> cho người dùng <strong className="text-emerald-400">{confirmModal.userName}</strong>?
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setConfirmModal(null)} 
                className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={executeRoleChange}
                className="flex-1 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold transition-colors shadow-[0_0_15px_rgba(217,119,6,0.4)]"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
