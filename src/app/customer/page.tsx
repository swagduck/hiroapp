"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const QrScanner = dynamic(() => import("@/components/QRScanner"), {
  ssr: false,
  loading: () => <div className="text-stone-400 p-4 text-center">Đang tải máy quét...</div>
});

export default function CustomerPortal() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"member" | "guest">("member");
  
  // Member Login State
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [memberLoading, setMemberLoading] = useState(false);

  // Guest Code State
  const [code, setCode] = useState("");
  const [guestLoading, setGuestLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  // Check if member already logged in
  useEffect(() => {
    if (document.cookie.includes("member_token")) {
      router.push("/member/dashboard");
    }
  }, [router]);

  const handleMemberLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMemberLoading(true);

    try {
      const res = await fetch("/api/auth/member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, dob })
      });

      if (res.ok) {
        router.push("/member/dashboard");
      } else {
        const data = await res.json();
        alert(data.error || "Đăng nhập thất bại");
        setMemberLoading(false);
      }
    } catch (error) {
      alert("Lỗi kết nối mạng");
      setMemberLoading(false);
    }
  };

  const handleGuestJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.replace(/#/g, '').trim().toUpperCase();
    if (!cleanCode) return;

    setGuestLoading(true);
    
    try {
      const res = await fetch(`/api/sessions/${cleanCode}`);
      if (res.ok) {
        router.push(`/customer/${cleanCode}`);
      } else {
        alert("Mã phiên không tồn tại hoặc đã kết thúc! Vui lòng kiểm tra lại.");
        setGuestLoading(false);
      }
    } catch (error) {
      console.error(error);
      alert("Lỗi kết nối mạng");
      setGuestLoading(false);
    }
  };

  const handleScanSuccess = (decodedText: string) => {
    let parsedCode = decodedText;
    if (parsedCode.includes("/customer/")) {
      parsedCode = parsedCode.split("/customer/")[1].split("?")[0].replace("/", "");
    }
    setCode(parsedCode.toUpperCase());
    setIsScanning(false);
  };

  return (
    <div className="min-h-screen bg-[#141c16] flex justify-center overflow-x-hidden">
      <div className="w-full max-w-md flex flex-col min-h-screen bg-stone-950 text-white shadow-2xl border-x border-white/5 relative p-6">
        
        {/* Abstract Background */}
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-emerald-900/20 to-transparent pointer-events-none"></div>
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-600/10 rounded-full blur-[80px] pointer-events-none"></div>
        
        <div className="flex-1 flex flex-col items-center justify-center relative z-10 w-full">
          <div className="w-20 h-20 mb-4 rounded-full bg-gradient-to-tr from-emerald-700 to-amber-600 p-[2px] shadow-[0_0_30px_rgba(5,150,105,0.4)]">
            <div className="w-full h-full bg-stone-950 rounded-full flex items-center justify-center">
              <span className="text-3xl">☕</span>
            </div>
          </div>
          
          <h1 className="text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-amber-500 mb-8">
            HIRO COFFEE
          </h1>

          {/* Tab Selector */}
          <div className="flex w-full bg-white/5 p-1 rounded-2xl mb-8">
            <button
              onClick={() => setActiveTab("member")}
              className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${
                activeTab === "member" 
                  ? "bg-emerald-600 text-white shadow-lg" 
                  : "text-stone-400 hover:text-stone-200"
              }`}
            >
              Thành viên
            </button>
            <button
              onClick={() => setActiveTab("guest")}
              className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${
                activeTab === "guest" 
                  ? "bg-amber-600 text-white shadow-lg" 
                  : "text-stone-400 hover:text-stone-200"
              }`}
            >
              Khách vãng lai
            </button>
          </div>

          {/* Member Tab */}
          {activeTab === "member" && (
            <div className="w-full animate-slide-up">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold mb-2">Đăng ký / Đăng nhập</h2>
                <p className="text-sm text-stone-400">Đặt chỗ tại bàn & Tích điểm hội viên</p>
              </div>

              <form onSubmit={handleMemberLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-400 mb-1">Họ và tên</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                    placeholder="VD: Nguyễn Văn A"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-stone-400 mb-1">Năm sinh</label>
                  <input
                    type="number"
                    required
                    min="1900"
                    max="2020"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                    placeholder="VD: 1998"
                  />
                </div>

                <button
                  type="submit"
                  disabled={memberLoading}
                  className="w-full py-4 rounded-xl mt-6 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all disabled:opacity-50"
                >
                  {memberLoading ? "Đang xử lý..." : "Đăng Nhập"}
                </button>
              </form>
            </div>
          )}

          {/* Guest Tab */}
          {activeTab === "guest" && (
            <div className="w-full animate-slide-up">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold mb-2">Gọi nước tại bàn</h2>
                <p className="text-sm text-stone-400">Dành cho khách đã lấy vé ở quầy thu ngân</p>
              </div>

              <form onSubmit={handleGuestJoin} className="w-full">
                <div className="mb-4 relative flex gap-2">
                  <input
                    type="text"
                    required={!isScanning}
                    maxLength={7}
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="Nhập mã vé (VD: A1B2C)"
                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-center text-xl font-mono text-white placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all uppercase tracking-widest min-w-0"
                  />
                  <button
                    type="button"
                    onClick={() => setIsScanning(true)}
                    className="w-[60px] shrink-0 bg-stone-800 border border-white/10 hover:bg-stone-700 rounded-xl flex items-center justify-center transition-colors shadow-lg active:scale-95"
                    title="Quét mã QR"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"><rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/></svg>
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={guestLoading || !code.trim()}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold shadow-[0_0_20px_rgba(217,119,6,0.3)] transition-all disabled:opacity-50 mt-2"
                >
                  {guestLoading ? "Đang kết nối..." : "Vào Gọi Nước"}
                </button>
              </form>

              {isScanning && (
                <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
                  <div className="p-4 flex justify-between items-center bg-black">
                    <h3 className="text-white font-bold text-lg">Quét mã trên Biên lai</h3>
                    <button onClick={() => setIsScanning(false)} className="text-white p-2 rounded-full bg-white/10">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                  </div>
                  <div className="flex-1 relative bg-black">
                    <QrScanner elementId="reader" onScanSuccess={handleScanSuccess} />
                    <div className="absolute inset-0 pointer-events-none border-[40px] border-black/50" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
