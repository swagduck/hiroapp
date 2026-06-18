import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Session } from '@/types';

interface ReceiptModalProps {
  receiptData: Session | null;
  onClose: () => void;
  onApprove?: (id: string) => void;
}

export default function ReceiptModal({ receiptData, onClose, onApprove }: ReceiptModalProps) {
  if (!receiptData) return null;

  return (
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

            <div className="text-center print-hidden">
              <div className="p-2 border-2 border-black rounded-xl inline-block bg-white">
                <img 
                  src={`https://img.vietqr.io/image/MB-123456789-compact2.png?amount=${receiptData.totalAmount || receiptData.package?.price || 0}&addInfo=${receiptData.accessCode}&accountName=SPACE CAFE`} 
                  alt="VietQR" 
                  className="w-[160px] h-[180px] object-contain" 
                />
              </div>
              <p className="text-xs text-stone-500 mt-2 font-bold">Quét VietQR Thanh toán</p>
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
  );
}
