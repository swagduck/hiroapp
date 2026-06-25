import React, { useEffect, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Session } from '@/types';

interface ReceiptModalProps {
  receiptData: Session | null;
  onClose: () => void;
  onApprove?: (id: string) => void;
  autoPrint?: boolean;
}

export default function ReceiptModal({ receiptData, onClose, onApprove, autoPrint = true }: ReceiptModalProps) {
  const [dontAskAgain, setDontAskAgain] = useState(false);
  const [userAction, setUserAction] = useState<'CONFIRMED' | 'SKIPPED' | null>(null);

  useEffect(() => {
    if (!receiptData) {
      setUserAction(null);
    }
  }, [receiptData]);

  const isSnoozed = typeof window !== 'undefined' 
    ? (localStorage.getItem('skipPrintConfirmUntil') && parseInt(localStorage.getItem('skipPrintConfirmUntil') as string) > Date.now())
    : false;

  const showConfirm = Boolean(receiptData && autoPrint && !isSnoozed && userAction === null);

  useEffect(() => {
    if (receiptData && autoPrint && !showConfirm) {
      if (isSnoozed || userAction === 'CONFIRMED') {
        const timer = setTimeout(() => {
          window.print();
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [receiptData, autoPrint, showConfirm, isSnoozed, userAction]);

  const handlePrint = () => {
    if (dontAskAgain) {
      localStorage.setItem('skipPrintConfirmUntil', (Date.now() + 3600000).toString());
    }
    setUserAction('CONFIRMED');
  };

  const handleSkip = () => {
    setUserAction('SKIPPED');
  };

  if (!receiptData) return null;

  return (
    <>
      {/* Hide receipt when confirm dialog is shown */}
      {!showConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#141c16]/80 backdrop-blur-md p-4 animate-page-transition">
          <div id="print-receipt" className="bg-white text-black w-full max-w-sm rounded-xl overflow-hidden shadow-2xl relative">
        <button 
          onClick={() => window.print()}
          className="absolute top-4 right-4 p-2 bg-stone-100 hover:bg-stone-200 rounded-full text-stone-600 transition-colors print-hidden"
          title="In Hóa Đơn"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
        </button>

        <div className="p-6 text-center border-b border-stone-200 border-dashed">
          <h2 className="text-2xl font-black tracking-tighter">HIRO COFFEE</h2>
          <p className="text-sm text-stone-500 uppercase tracking-widest mt-1">Study Space</p>
          
          <div className="mt-6 flex flex-wrap justify-center gap-6">
            <div className="text-center">
              <div className="p-2 border-2 border-black rounded-xl inline-block bg-white">
                <QRCodeCanvas 
                  value={typeof window !== 'undefined' ? `${window.location.origin}/customer/${receiptData.accessCode}` : `http://localhost:9999/customer/${receiptData.accessCode}`} 
                  size={140}
                  level={"H"}
                />
              </div>
              <p className="text-xs text-stone-500 mt-2 font-bold">Quét QR tại cổng</p>
            </div>
          </div>
        </div>
        
        <div className="p-6 bg-[#f3f0e8] print-bg-white">
          <div className="flex justify-between items-center mb-3">
            <span className="text-stone-500 text-sm font-bold">Gói cước:</span>
            <span className="font-bold">{receiptData.package?.name}</span>
          </div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-stone-500 text-sm font-bold">Mã vào cổng:</span>
            <span className="font-mono font-black text-xl px-2 py-1 bg-stone-300 rounded border border-black">{receiptData.accessCode}</span>
          </div>
          <div className="flex justify-between items-center mb-6">
            <span className="text-stone-500 text-sm font-bold">Giờ tạo:</span>
            <span className="font-medium">{new Date(receiptData.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>

          <div className="flex gap-3 print-hidden">
            {receiptData.status === 'PENDING' && onApprove ? (
              <>
                <button 
                  onClick={() => {
                    onApprove(receiptData.id);
                  }}
                  className="flex-1 py-3 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold hover:from-emerald-500 hover:to-emerald-400 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.3)] text-sm"
                >
                  Xác nhận Tiền & Bắt đầu
                </button>
                <button 
                  onClick={onClose}
                  className="flex-1 py-3 rounded-lg bg-[#141c16] text-white font-bold hover:bg-gray-800 transition-colors border border-white/10 text-sm"
                >
                  Khách chuyển khoản (Chờ)
                </button>
              </>
            ) : (
              <button 
                onClick={onClose}
                className="w-full py-3 rounded-lg bg-[#141c16] text-white font-bold hover:bg-gray-800 transition-colors border border-white/10 text-sm"
              >
                Đóng
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
    )}

    {showConfirm && (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in print-hidden">
        <div className="bg-stone-900 border border-white/10 rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-slide-up flex flex-col">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
          </div>
          <h3 className="text-xl font-bold text-white text-center mb-2">In hoá đơn & mã khách?</h3>
          <p className="text-stone-400 text-sm text-center mb-6">Bạn có muốn in hoá đơn và mã vào cổng cho khách hàng không?</p>
          
          <label className="flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition-colors mb-6 border border-white/5">
            <input 
              type="checkbox" 
              checked={dontAskAgain}
              onChange={(e) => setDontAskAgain(e.target.checked)}
              className="w-5 h-5 rounded border-stone-600 text-emerald-500 focus:ring-emerald-500 bg-stone-950 accent-emerald-500 shrink-0" 
            />
            <span className="text-sm text-stone-300 font-medium">Không hiện lại thông báo này trong 1 tiếng tới</span>
          </label>

          <div className="flex gap-3">
            <button 
              onClick={handleSkip}
              className="flex-1 py-3.5 rounded-xl bg-stone-800 text-white font-bold hover:bg-stone-700 transition-colors text-sm border border-white/10"
            >
              Bỏ qua
            </button>
            <button 
              onClick={handlePrint}
              className="flex-1 py-3.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-500 transition-colors shadow-[0_0_20px_rgba(5,150,105,0.4)] text-sm"
            >
              In ngay
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
