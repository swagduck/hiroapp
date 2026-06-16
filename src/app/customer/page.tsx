"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CustomerLanding() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.replace(/#/g, '').trim().toUpperCase();
    if (!cleanCode) return;

    setLoading(true);
    
    try {
      // Gọi API kiểm tra mã phiên có tồn tại và đang hoạt động không
      const res = await fetch(`/api/sessions/${cleanCode}`);
      if (res.ok) {
        router.push(`/customer/${cleanCode}`);
      } else {
        alert("Mã phiên không tồn tại hoặc đã kết thúc! Vui lòng kiểm tra lại.");
        setLoading(false);
      }
    } catch (error) {
      console.error(error);
      alert("Lỗi kết nối");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#141c16] flex justify-center overflow-x-hidden">
      <div className="w-full max-w-md flex flex-col min-h-screen bg-stone-950 text-white shadow-2xl border-x border-white/5 relative p-6">
        
        {/* Abstract Background */}
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-emerald-900/20 to-transparent pointer-events-none"></div>
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-600/10 rounded-full blur-[80px] pointer-events-none"></div>
        
        <div className="flex-1 flex flex-col items-center justify-center relative z-10">
          <div className="w-24 h-24 mb-6 rounded-full bg-gradient-to-tr from-emerald-700 to-amber-600 p-[2px] shadow-[0_0_30px_rgba(5,150,105,0.4)]">
            <div className="w-full h-full bg-stone-950 rounded-full flex items-center justify-center">
              <span className="text-4xl">☕</span>
            </div>
          </div>
          
          <h1 className="text-3xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-amber-500 mb-2">
            HIRO COFFEE
          </h1>
          <p className="text-stone-400 text-center mb-10 text-sm">
            Nhập mã truy cập do nhân viên cung cấp để xem menu và gọi đồ uống tại bàn.
          </p>

          <form onSubmit={handleJoin} className="w-full">
            <div className="mb-6 relative">
              <input
                type="text"
                required
                maxLength={7}
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="VD: A1B2C"
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-center text-3xl font-mono text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/50 focus:border-emerald-600 transition-all uppercase tracking-widest"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-700 to-emerald-600 hover:from-emerald-600 hover:to-emerald-500 text-white font-bold text-lg shadow-[0_0_20px_rgba(4,120,87,0.4)] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
            >
              {loading ? "Đang kết nối..." : "Vào Gọi Món"}
            </button>

            <button
              type="button"
              onClick={() => router.push('/customer/menu')}
              className="w-full py-4 rounded-2xl bg-stone-900 border border-white/10 hover:bg-stone-800 text-stone-300 font-bold text-lg transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
              Xem Menu & Bảng Giá
            </button>
          </form>
        </div>

        <div className="text-center pb-6 text-xs text-stone-500 relative z-10">
          <p>Bản quyền thuộc về HIRO Coffee & Study Space</p>
        </div>
      </div>
    </div>
  );
}
