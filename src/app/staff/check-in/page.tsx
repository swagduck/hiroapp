"use client";

import { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

export default function CheckInPage() {
  const [manualCode, setManualCode] = useState("");
  const [scanResult, setScanResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [cameraError, setCameraError] = useState("");

  useEffect(() => {
    const html5QrCode = new Html5Qrcode("reader");

    const startCamera = async () => {
      try {
        await html5QrCode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            let code = decodedText;
            if (code.includes("/customer/")) {
              code = code.split("/customer/")[1].split("?")[0].replace("/", "");
            }
            verifyCode(code);
            html5QrCode.pause();
            setTimeout(() => html5QrCode.resume(), 3000);
          },
          (errorMessage) => {
            // Ignore scan errors
          }
        );
      } catch (err) {
        console.error("Camera start error:", err);
        setCameraError("Vui lòng cho phép trình duyệt truy cập Camera để quét vé.");
      }
    };

    startCamera();

    return () => {
      if (html5QrCode.isScanning) {
        html5QrCode.stop().then(() => html5QrCode.clear()).catch(console.error);
      } else {
        html5QrCode.clear();
      }
    };
  }, []);

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
          {cameraError ? (
            <div className="text-center p-6 text-amber-500 font-medium">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4 opacity-50"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
              <p>{cameraError}</p>
            </div>
          ) : (
            <div id="reader" className="w-full rounded-xl overflow-hidden [&_video]:rounded-xl [&_video]:object-cover"></div>
          )}
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
                <div className="mt-4 p-4 bg-[#141c16]/40 rounded-xl w-full text-left border border-white/10">
                  <p className="text-sm text-stone-400">Gói cước:</p>
                  <p className="font-bold text-lg text-white mb-2">{scanResult.session.package?.name}</p>
                  <p className="text-sm text-stone-400">Giờ vào:</p>
                  <p className="font-mono text-white">{new Date(scanResult.session.startTime).toLocaleTimeString('vi-VN')}</p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
