"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // Chuyển hướng tới Dashboard khi đăng nhập thành công
        router.push("/");
        router.refresh(); // Cập nhật lại state của app
      } else {
        setError(data.error || "Đăng nhập thất bại");
      }
    } catch (err) {
      setError("Có lỗi kết nối tới server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="glass-card w-full max-w-md p-8 relative z-10 shadow-2xl border border-white/10 rounded-2xl bg-slate-900/50 backdrop-blur-xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600 mb-2">
            SpaceManager
          </h1>
          <p className="text-gray-400 text-sm">Hệ thống quản lý Co-working Space</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Email / Tài khoản</label>
            <input
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
              placeholder="admin@space.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Mật khẩu</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Đang xử lý...
              </span>
            ) : (
              "Đăng nhập Hệ thống"
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            Chỉ dành cho Ban Quản Trị & Nhân viên. <br/> Khách hàng vui lòng quét mã QR tại bàn.
          </p>
        </div>
      </div>
    </div>
  );
}
