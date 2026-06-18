import { useState, useEffect } from "react";

export default function ActivityLogTab() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivity();
  }, []);

  const fetchActivity = async () => {
    try {
      const res = await fetch("/api/admin/activity");
      const data = await res.json();
      setActivities(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full text-stone-400">Đang tải nhật ký...</div>;
  }

  return (
    <div className="flex flex-col h-full bg-[#141c16]/30 rounded-2xl border border-white/5 overflow-hidden">
      <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            Nhật ký Giao dịch & Hoạt động
          </h2>
          <p className="text-sm text-stone-400 mt-1">Lưu vết mọi thao tác thanh toán và gọi món.</p>
        </div>
        <button onClick={fetchActivity} className="p-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-4 max-w-4xl mx-auto">
          {activities.length === 0 ? (
            <p className="text-center text-stone-500 italic py-8">Chưa có giao dịch nào.</p>
          ) : (
            activities.map((act) => (
              <div key={act.id} className="bg-stone-900/50 border border-white/5 p-4 rounded-xl flex gap-4 hover:bg-white/5 transition-colors">
                <div className="shrink-0 mt-1">
                  {act.type === 'SESSION_CREATED' && <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center text-xl">🎟️</div>}
                  {act.type === 'SESSION_COMPLETED' && <div className="w-10 h-10 rounded-full bg-stone-500/20 text-stone-500 flex items-center justify-center text-xl">🏁</div>}
                  {act.type === 'DRINK_ORDER' && <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xl">🥤</div>}
                  {act.type === 'EXTENSION' && <div className="w-10 h-10 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xl">⏳</div>}
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-white font-medium">
                        Phiên <span className="text-amber-500 font-mono font-bold">#{act.accessCode}</span>
                        {act.userName && <span className="text-stone-400 font-normal ml-2">({act.userName})</span>}
                      </p>
                      <p className="text-sm text-stone-400 mt-1">{act.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold">{act.amount.toLocaleString('vi-VN')}đ</p>
                      <p className="text-xs text-stone-500 mt-1">
                        {new Date(act.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    {act.paymentStatus === 'PAID' ? (
                      <span className="text-[10px] uppercase tracking-wider font-bold bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded">
                        Đã thanh toán
                      </span>
                    ) : (
                      <span className="text-[10px] uppercase tracking-wider font-bold bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-1 rounded">
                        Chưa thu tiền (Nợ)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
