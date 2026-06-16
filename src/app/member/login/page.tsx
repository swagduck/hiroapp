"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function MemberLogin() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !dob) {
      setError("Vui lòng nhập đầy đủ Họ Tên và Ngày sinh.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, dob }),
      });

      const data = await res.json();
      if (res.ok) {
        // Lưu thông tin tạm vào localStorage nếu cần
        localStorage.setItem("member_info", JSON.stringify(data.user));
        router.push("/member/dashboard");
      } else {
        setError(data.error || "Có lỗi xảy ra, vui lòng thử lại.");
      }
    } catch (err) {
      setError("Không thể kết nối đến máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 flex justify-center items-center p-4">
      <div className="w-full max-w-md bg-stone-900 border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-emerald-500/20 rounded-full blur-[50px] pointer-events-none"></div>

        <div className="text-center mb-8 relative z-10">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-amber-500 mb-2">
            Thành Viên
          </h1>
          <p className="text-stone-400 text-sm">
            Nhập Họ tên & Ngày sinh để đăng nhập hoặc đăng ký mới
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl mb-6 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5 relative z-10">
          <div>
            <label className="block text-sm font-medium text-stone-300 mb-2">
              Họ và Tên
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Nguyễn Văn A"
              className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all uppercase placeholder-stone-600"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-300 mb-2">
              Ngày tháng năm sinh
            </label>
            <input
              type="text"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              placeholder="VD: 01/01/2000"
              className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder-stone-600"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold py-3.5 px-4 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 shadow-[0_0_20px_rgba(16,185,129,0.3)] mt-4 flex justify-center items-center"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
            ) : (
              "Vào Không Gian"
            )}
          </button>
        </form>

      </div>
    </div>
  );
}
