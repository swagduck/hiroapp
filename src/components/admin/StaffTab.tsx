import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function StaffTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleChangeRole = async (id: string, newRole: string) => {
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
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
                  <select 
                    value={user.role} 
                    onChange={(e) => handleChangeRole(user.id, e.target.value)}
                    className="bg-stone-900 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="CUSTOMER">Thành viên</option>
                    <option value="STAFF">Nhân viên (STAFF)</option>
                    <option value="ADMIN">Chủ quán (ADMIN)</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
