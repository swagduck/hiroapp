"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const QrScanner = dynamic(() => import("@/components/QRScanner"), {
  ssr: false,
  loading: () => <div className="text-stone-400 p-4 text-center min-h-[300px] flex items-center justify-center">Đang khởi động Camera...</div>
});

export default function CheckInPage() {
  const [manualCode, setManualCode] = useState("");
  const [scanResult, setScanResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleScanSuccess = (decodedText: string) => {
    let code = decodedText;
    if (code.includes("/customer/")) {
      code = code.split("/customer/")[1].split("?")[0].replace("/", "");
    }
    verifyCode(code);
  };

  const verifyCode = async (code: string) => {
    if (!code) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/sessions/verify?code=${code}`);
      const data = await res.json();
      setScanResult(data);
      
      // Auto-clear result after 5 seconds
      setTimeout(() => {
        setScanResult(null);
      }, 5000);
    } catch (error) {
      console.error(error);
      setScanResult({ valid: false, message: "Lỗi kết nối máy chủ" });
    } finally {
      setLoading(false);
      setManualCode("");
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verifyCode(manualCode);
  };

  return (
    <div className="min-h-screen bg-stone-950 text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-amber-500 mb-2">HIRO SCANNER</h1>
          <p className="text-stone-400">Quét vé lên lầu (Staff Only)</p>
        </div>

        {/* Khung quét QR */}
        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl shadow-2xl mb-6 overflow-hidden relative min-h-[300px] flex items-center justify-center">
          <QrScanner 
            elementId="reader"
            onScanSuccess={handleScanSuccess}
          />
        </div>

        {/* Nhập mã thủ công */}
        <form onSubmit={handleManualSubmit} className="flex gap-2 mb-8">
          <input 
            type="text" 
            placeholder="Hoặc nhập mã (VD: 6PUHM)" 
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-600"
          />
          <button 
            type="submit" 
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-emerald-700 font-bold hover:bg-emerald-600 disabled:opacity-50 transition-colors"
          >
            Kiểm tra
          </button>
        </form>

        {/* Kết quả quét */}
        {scanResult && (
          <div className={`p-6 rounded-2xl border-2 shadow-2xl animate-page-transition ${scanResult.valid ? 'bg-green-900/20 border-green-500' : 'bg-red-900/20 border-red-500'}`}>
            <div className="flex flex-col items-center text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${scanResult.valid ? 'bg-green-500' : 'bg-red-500'}`}>
                {scanResult.valid ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                )}
              </div>
              <h2 className={`text-2xl font-bold mb-2 ${scanResult.valid ? 'text-green-400' : 'text-red-400'}`}>
                {scanResult.valid ? "HỢP LỆ - MỜI VÀO" : "VÉ KHÔNG HỢP LỆ"}
              </h2>
              <p className="text-stone-300 text-lg">{scanResult.message}</p>
              
              {scanResult.valid && scanResult.session && (
                <div className="mt-4 p-5 bg-[#141c16]/60 rounded-xl w-full text-left border border-white/10 shadow-inner">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm text-stone-400">Mã truy cập:</span>
                    <span className="font-mono font-bold text-emerald-400 text-lg bg-emerald-900/30 px-2 py-0.5 rounded">#{scanResult.session.accessCode}</span>
                  </div>
                  
                  <div className="mb-3">
                    <span className="text-sm text-stone-400 block mb-1">Gói cước:</span>
                    <span className="font-bold text-lg text-white">{scanResult.session.package?.name}</span>
                  </div>
                  
                  <div className="mb-4">
                    <span className="text-sm text-stone-400 block mb-1">Giờ vào:</span>
                    <span className="font-mono text-stone-200">{new Date(scanResult.session.startTime).toLocaleTimeString('vi-VN')}</span>
                  </div>

                  {scanResult.session.package?.includesDrink && (
                    <div className="pt-3 border-t border-white/10">
                      <span className="text-sm text-stone-400 block mb-2">Tình trạng đồ uống miễn phí:</span>
                      {scanResult.session.freeDrinkClaimed ? (
                        <div className="flex items-center gap-2 text-stone-400 bg-stone-800/50 p-2 rounded-lg">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                          <span className="font-medium text-sm">Đã đổi nước / Đã sử dụng</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-amber-400 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 14h10"/><path d="M14 2v10"/><path d="m3 3 3 9"/><path d="m21 3-3 9"/><path d="M10 14v4"/><path d="M14 14v4"/><path d="M6 18h12"/></svg>
                          <span className="font-bold text-sm">Chưa đổi (Khách được 1 ly miễn phí)</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
