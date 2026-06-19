"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const QrScanner = dynamic(() => import("@/components/QRScanner"), {
  ssr: false,
  loading: () => <div className="text-stone-400 p-4 text-center min-h-[300px] flex items-center justify-center">Đang khởi động Camera...</div>
});

export default function CheckinPage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Luôn focus vào ô input (để dùng máy quét mã vạch nếu cần)
    inputRef.current?.focus();
    
    const handleClick = () => inputRef.current?.focus();
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const handleCheckin = async (accessCode: string) => {
    if (accessCode.length !== 5) return;
    
    setLoading(true);
    setErrorMsg("");
    setSuccess(false);

    try {
      const res = await fetch("/api/sessions/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessCode })
      });
      
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setCode("");
          inputRef.current?.focus();
        }, 3000);
      } else {
        setErrorMsg(data.error || "Mã không hợp lệ hoặc đã kích hoạt.");
        setCode("");
      }
    } catch (e) {
      setErrorMsg("Lỗi kết nối đến máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
    setCode(val);
    if (val.length === 5) {
      handleCheckin(val);
    }
  };

  const handleScanSuccess = (decodedText: string) => {
    let scannedCode = decodedText;
    if (scannedCode.includes("/customer/")) {
      scannedCode = scannedCode.split("/customer/")[1].split("?")[0].replace("/", "");
    }
    scannedCode = scannedCode.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
    if (scannedCode.length === 5) {
      setCode(scannedCode);
      handleCheckin(scannedCode);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1310] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <h1 className="text-4xl font-black text-emerald-400 mb-2 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]">
          HIRO COFFEE AND STUDY SPACE
        </h1>
        <p className="text-stone-400 mb-8 font-medium">Nhập hoặc quét mã Phiên để bắt đầu tính giờ</p>

        <div className="bg-[#141c16] border border-emerald-500/30 p-8 rounded-3xl shadow-[0_0_40px_rgba(16,185,129,0.1)] relative overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0 bg-emerald-500/5 mix-blend-overlay animate-pulse"></div>
          
          <div className="relative z-10">
            {success ? (
              <div className="animate-scale-up py-4">
                <div className="w-20 h-20 bg-emerald-500 rounded-full mx-auto flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(16,185,129,0.6)]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <h2 className="text-2xl font-bold text-emerald-400">Thành công!</h2>
                <p className="text-stone-300 mt-2">Đã bắt đầu tính giờ. Mời bạn lên lầu.</p>
              </div>
            ) : (
              <div className="py-4">
                <div className="bg-black border border-white/10 p-2 rounded-2xl shadow-xl mb-6 overflow-hidden relative min-h-[250px] flex items-center justify-center">
                  <QrScanner 
                    elementId="reader-checkin"
                    onScanSuccess={handleScanSuccess}
                  />
                </div>

                <p className="text-stone-500 text-sm mb-2 font-medium">Hoặc nhập mã thủ công:</p>
                <input 
                  ref={inputRef}
                  type="text" 
                  value={code}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="Nhập mã 5 ký tự..."
                  className="w-full bg-black/40 border-2 border-emerald-500/50 rounded-2xl px-6 py-5 text-4xl font-mono text-center text-white tracking-[0.5em] focus:outline-none focus:border-emerald-400 focus:shadow-[0_0_20px_rgba(52,211,153,0.3)] transition-all placeholder:text-stone-700 placeholder:tracking-normal"
                />
                
                {loading && (
                  <div className="mt-6 flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
                  </div>
                )}
                
                {errorMsg && !loading && (
                  <p className="mt-6 text-red-400 font-medium animate-shake bg-red-500/10 py-2 px-4 rounded-lg inline-block border border-red-500/20">
                    {errorMsg}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8">
          <Link href="/" className="text-stone-500 hover:text-emerald-400 transition-colors flex items-center justify-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            Quay lại trang Quản trị
          </Link>
        </div>
      </div>
    </div>
  );
}
