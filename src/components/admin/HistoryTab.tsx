import { useState, useEffect } from "react";

export default function HistoryTab() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch('/api/sessions?all=true');
        const data = await res.json();
        setHistory(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-600"></div></div>;
  }

  return (
    <div className="glass-card h-full flex flex-col overflow-hidden animate-page-transition">
      <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
          Lịch sử Phiên giao dịch
        </h3>
        <p className="text-sm text-stone-400">Tổng số: {history.length} phiên</p>
      </div>
      <div className="flex-1 overflow-auto p-4 custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 text-stone-400 text-sm border-b border-white/10">
              <th className="p-4 font-medium">Mã Phiên</th>
              <th className="p-4 font-medium">Trạng thái</th>
              <th className="p-4 font-medium">Gói cước</th>
              <th className="p-4 font-medium">Giờ vào</th>
              <th className="p-4 font-medium text-right">Tổng thu</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {history.length === 0 ? (
              <tr><td colSpan={5} className="p-4 text-center text-stone-500">Chưa có dữ liệu</td></tr>
            ) : history.map((session) => {
              const total = session.orders?.reduce((acc: number, order: any) => acc + order.totalAmount, 0) || 0;
              const revenue = (session.package?.price || 0) + total;
              
              return (
                <tr key={session.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-4 font-mono font-bold text-stone-300">#{session.accessCode}</td>
                  <td className="p-4">
                    {session.status === "ACTIVE" 
                      ? <span className="px-2 py-1 text-xs rounded bg-green-500/20 text-green-400 font-medium">Đang hoạt động</span>
                      : <span className="px-2 py-1 text-xs rounded bg-[#f3f0e8]0/20 text-stone-400 font-medium">Đã kết thúc</span>
                    }
                  </td>
                  <td className="p-4 text-white">{session.package?.name || "N/A"}</td>
                  <td className="p-4 text-stone-400">{new Date(session.startTime).toLocaleString('vi-VN')}</td>
                  <td className="p-4 font-bold text-right text-emerald-500">{revenue.toLocaleString('vi-VN')}đ</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
