"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Html5Qrcode } from "html5-qrcode";

export default function CustomerLanding() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const router = useRouter();

  useEffect(() => {
    let html5QrCode: Html5Qrcode | null = null;
    if (isScanning) {
      html5QrCode = new Html5Qrcode("customer-reader");
      
      const startCamera = async () => {
        try {
          await html5QrCode!.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 250, height: 250 } },
            (decodedText) => {
              let parsedCode = decodedText;
              if (parsedCode.includes("/customer/")) {
                parsedCode = parsedCode.split("/customer/")[1].split("?")[0].replace("/", "");
              }
              setCode(parsedCode.toUpperCase());
              setIsScanning(false);
            },
            (errorMessage) => {
              // Ignore
            }
          );
        } catch (err) {
          console.error("Camera start error:", err);
          setCameraError("Vui lòng cho phép truy cập Camera để quét mã.");
        }
      };
      
      startCamera();
    }

    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().then(() => html5QrCode!.clear()).catch(console.error);
      }
    };
  }, [isScanning]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.replace(/#/g, '').trim().toUpperCase();
    if (!cleanCode) return;

    setLoading(true);
    
    try {
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
            <div className="mb-4 relative flex gap-2">
              <input
                type="text"
                required={!isScanning}
                maxLength={7}
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="VD: A1B2C"
                className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-center text-3xl font-mono text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/50 focus:border-emerald-600 transition-all uppercase tracking-widest min-w-0"
              />
              <button
                type="button"
                onClick={() => setIsScanning(true)}
                className="w-16 h-16 shrink-0 bg-stone-800 border border-white/10 hover:bg-stone-700 rounded-2xl flex items-center justify-center transition-colors shadow-lg active:scale-95"
                title="Quét mã QR"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/></svg>
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-700 to-emerald-600 hover:from-emerald-600 hover:to-emerald-500 text-white font-bold text-lg shadow-[0_0_20px_rgba(4,120,87,0.4)] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mb-4 mt-2"
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

      {/* QR Scanner Modal */}
      {isScanning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-stone-900 rounded-2xl overflow-hidden border border-white/10 flex flex-col shadow-2xl">
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-stone-950">
              <h3 className="font-bold text-white flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/></svg>
                Quét mã QR trên biên lai
              </h3>
              <button onClick={() => setIsScanning(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-stone-300 hover:bg-white/20">✕</button>
            </div>
            
            <div className="p-4 flex-1 flex flex-col items-center justify-center min-h-[300px]">
              {cameraError ? (
                <p className="text-amber-500 text-center">{cameraError}</p>
              ) : (
                <div id="customer-reader" className="w-full rounded-xl overflow-hidden [&_video]:rounded-xl [&_video]:object-cover"></div>
              )}
            </div>
            <div className="p-4 text-center text-sm text-stone-400 border-t border-white/5 bg-stone-950">
              Đưa camera vào mã QR in trên hóa đơn để tự động đăng nhập.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
