import React from 'react';

interface PauseSessionModalProps {
  sessionToPause: string | null;
  pausePhone: string;
  setPausePhone: (val: string) => void;
  isPausing: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function PauseSessionModal({
  sessionToPause,
  pausePhone,
  setPausePhone,
  isPausing,
  onClose,
  onConfirm
}: PauseSessionModalProps) {
  if (!sessionToPause) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#141c16]/60 backdrop-blur-sm">
      <div className="bg-stone-950 border border-amber-500/30 rounded-2xl p-6 w-[400px] shadow-2xl transform transition-all animate-page-transition">
        <h3 className="text-xl font-bold text-amber-500 mb-2 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          Bảo lưu thời gian
        </h3>
        <p className="text-stone-400 mb-4 text-sm">Nhập số điện thoại của khách hàng để lưu lại số phút chưa sử dụng. Phiên hiện tại sẽ được kết thúc ngay lập tức.</p>
        
        <input 
          type="tel"
          placeholder="Nhập SĐT (VD: 0901234567)"
          value={pausePhone}
          onChange={e => setPausePhone(e.target.value)}
          className="w-full bg-stone-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 mb-6"
          autoFocus
        />

        <div className="flex justify-end gap-3">
          <button 
            onClick={onClose} 
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors"
            disabled={isPausing}
          >
            Hủy bỏ
          </button>
          <button 
            onClick={onConfirm} 
            disabled={!pausePhone || isPausing}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white font-bold shadow-[0_0_15px_rgba(217,119,6,0.4)] transition-colors disabled:opacity-50"
          >
            {isPausing ? "Đang xử lý..." : "Bảo lưu & Kết thúc"}
          </button>
        </div>
      </div>
    </div>
  );
}
