import React from 'react';

interface EndSessionModalProps {
  sessionToEnd: string | null;
  onClose: () => void;
  onConfirm: () => void;
}

export default function EndSessionModal({ sessionToEnd, onClose, onConfirm }: EndSessionModalProps) {
  if (!sessionToEnd) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#141c16]/60 backdrop-blur-sm">
      <div className="bg-stone-950 border border-white/10 rounded-2xl p-6 w-full max-w-[400px] shadow-2xl transform transition-all animate-page-transition">
        <h3 className="text-xl font-bold text-white mb-2">Kết thúc phiên</h3>
        <p className="text-stone-400 mb-6">Bạn có chắc chắn muốn kết thúc phiên sử dụng này không? Khách hàng sẽ không thể truy cập mã này nữa.</p>
        <div className="flex justify-end gap-3">
          <button 
            onClick={onClose} 
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors"
          >
            Hủy bỏ
          </button>
          <button 
            onClick={onConfirm} 
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold shadow-[0_0_15px_rgba(225,29,72,0.4)] transition-colors"
          >
            Xác nhận Kết thúc
          </button>
        </div>
      </div>
    </div>
  );
}
