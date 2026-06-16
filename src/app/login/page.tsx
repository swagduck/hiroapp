"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState(""); // For register
  const [dob, setDob] = useState(""); // For register
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
        if (data.role === "CUSTOMER") {
          router.push("/member/dashboard");
        } else {
          router.push("/");
        }
        router.refresh();
      } else {
        setError(data.error || "Đăng nhập thất bại");
      }
    } catch (err) {
      setError("Có lỗi kết nối tới server");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, name, dob: dob || undefined }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push("/member/dashboard");
        router.refresh();
      } else {
        setError(data.error || "Đăng ký thất bại");
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
            Hiro Coffee
          </h1>
          <p className="text-gray-400 text-sm mb-8">Chào mừng bạn đến với hệ thống</p>

          <Link href="/customer" className="inline-block w-full py-5 rounded-2xl border border-white/20 bg-gradient-to-r from-blue-600/40 to-indigo-600/40 hover:from-blue-500/50 hover:to-indigo-500/50 text-white font-bold text-lg shadow-[0_0_30px_rgba(59,130,246,0.3)] transition-all">
            🚶 Khách Vãng Lai (Vào Đây)
          </Link>
          <p className="text-xs text-slate-400 mt-3">Không cần tài khoản. Nhấn vào đây để xem Menu và Gọi nước trực tiếp.</p>
        </div>

        <div className="flex items-center justify-center gap-4 mt-8 mb-8">
          <div className="h-px bg-white/10 flex-1"></div>
          <span className="text-xs text-slate-400 uppercase font-bold tracking-widest text-center">Hoặc<br/>Dành cho Hội Viên</span>
          <div className="h-px bg-white/10 flex-1"></div>
        </div>

        {/* Tab Selector */}
        <div className="flex w-full bg-black/20 p-1 rounded-2xl mb-8 border border-white/5">
          <button
            onClick={() => { setActiveTab("login"); setError(""); }}
            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${
              activeTab === "login" 
                ? "bg-purple-600/50 border border-purple-500/50 text-white shadow-lg" 
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Đăng Nhập
          </button>
          <button
            onClick={() => { setActiveTab("register"); setError(""); }}
            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${
              activeTab === "register" 
                ? "bg-pink-600/50 border border-pink-500/50 text-white shadow-lg" 
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Đăng Ký
          </button>
        </div>

        {error && (
          <div className="p-3 mb-5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {/* Login Form */}
        {activeTab === "login" && (
          <form onSubmit={handleLogin} className="space-y-5 animate-slide-up">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
                placeholder="VD: user@email.com"
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
              {loading ? "Đang xử lý..." : "Vào Hệ Thống"}
            </button>
          </form>
        )}

        {/* Register Form */}
        {activeTab === "register" && (
          <form onSubmit={handleRegister} className="space-y-5 animate-slide-up">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Tên hiển thị (Username)</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 transition-all"
                placeholder="VD: Nguyễn Văn A"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 transition-all"
                placeholder="VD: user@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Ngày sinh (Để nhận quà sinh nhật)</label>
              <input
                type="text"
                placeholder="DD/MM/YYYY (Ví dụ: 25/12/1999)"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Mật khẩu</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 transition-all"
                placeholder="Ít nhất 6 ký tự"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold shadow-[0_0_20px_rgba(236,72,153,0.4)] transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
            >
              {loading ? "Đang xử lý..." : "Tạo Tài Khoản"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
