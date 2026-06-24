import React from 'react';
import { Package, MenuItem, PosCartItem } from '@/types';

interface PosModalProps {
  isPosOpen: boolean;
  setIsPosOpen: (val: boolean) => void;
  posStep: number;
  setPosStep: (val: number) => void;
  packages: Package[];
  menuItems: MenuItem[];
  posSelectedPackage: Package | null;
  setPosSelectedPackage: (pkg: Package | null) => void;
  posCart: PosCartItem[];
  setPosCart: (cart: PosCartItem[]) => void;
  
  savedTimePhone: string;
  setSavedTimePhone: (val: string) => void;
  isCheckingSavedTime: boolean;
  handleCheckSavedTime: () => void;
  savedTimeResult: {minutes: number, name?: string} | null;
  handleUseSavedTime: () => void;
  
  posLoading: boolean;
  posPaymentStatus?: "PAID" | "UNPAID" | "QR";
  setPosPaymentStatus?: (status: "PAID" | "UNPAID" | "QR") => void;
  handleCompleteOrder: () => void;
}

export default function PosModal({
  isPosOpen, setIsPosOpen, posStep, setPosStep, packages, menuItems,
  posSelectedPackage, setPosSelectedPackage, posCart, setPosCart,
  savedTimePhone, setSavedTimePhone, isCheckingSavedTime, handleCheckSavedTime,
  savedTimeResult, handleUseSavedTime, posLoading, posPaymentStatus, setPosPaymentStatus, handleCompleteOrder
}: PosModalProps) {
  if (!isPosOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#141c16]/90 backdrop-blur-md p-2 md:p-6 pb-20 md:pb-6">
      <div className="bg-stone-950 border border-white/10 rounded-2xl w-full max-w-6xl h-full flex flex-col shadow-2xl overflow-hidden animate-page-transition">
        {/* Header */}
        <div className="h-14 md:h-16 border-b border-white/10 flex items-center justify-between px-4 md:px-6 bg-white/5">
          <div className="flex items-center gap-4">
            <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
              Tạo Đơn (POS)
            </h2>
            {posStep > 1 && (
              <div className="hidden md:flex items-center gap-2 text-sm">
                <span className={`px-2 py-1 rounded ${posStep >= 1 ? 'bg-emerald-500/20 text-emerald-400' : 'text-stone-500'}`}>1. Chọn gói</span>
                <span className="text-stone-600">→</span>
                <span className={`px-2 py-1 rounded ${posStep >= 2 ? 'bg-emerald-500/20 text-emerald-400' : 'text-stone-500'}`}>2. Menu Nước</span>
                <span className="text-stone-600">→</span>
                <span className={`px-2 py-1 rounded ${posStep >= 3 ? 'bg-emerald-500/20 text-emerald-400' : 'text-stone-500'}`}>3. Thanh toán</span>
              </div>
            )}
          </div>
          <button onClick={() => setIsPosOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-stone-300 transition-colors">✕</button>
        </div>
        
        {/* Body */}
        <div className="flex-1 flex flex-col overflow-hidden relative bg-[#141c16]/20">
          
          {/* STEP 1: CHỌN GÓI CƯỚC */}
          {posStep === 1 && (
            <div className="p-6 h-full overflow-y-auto animate-fade-in flex flex-col">
              
              {/* Khu vực Sử dụng Giờ bảo lưu */}
              <div className="max-w-5xl mx-auto w-full mb-8 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6">
                <h4 className="text-amber-500 font-bold mb-4 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  Tra cứu & Sử dụng Giờ bảo lưu
                </h4>
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
                  <div className="flex-1 w-full">
                    <label className="block text-xs text-stone-400 mb-1">Số điện thoại khách hàng</label>
                    <div className="flex gap-2">
                      <input 
                        type="tel"
                        placeholder="Nhập SĐT..."
                        value={savedTimePhone}
                        onChange={e => setSavedTimePhone(e.target.value)}
                        className="flex-1 bg-stone-900 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-amber-500"
                      />
                      <button 
                        onClick={handleCheckSavedTime}
                        disabled={!savedTimePhone || isCheckingSavedTime}
                        className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-white rounded-xl transition-colors disabled:opacity-50 whitespace-nowrap"
                      >
                        {isCheckingSavedTime ? "Đang tra..." : "Kiểm tra"}
                      </button>
                    </div>
                  </div>
                  
                  {savedTimeResult && (
                    <div className="flex-1 w-full bg-stone-950 rounded-xl p-3 border border-white/5 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-stone-400">Kết quả tra cứu</p>
                        <p className="text-sm">
                          Khách có: <span className="text-amber-500 font-bold text-lg">{savedTimeResult.minutes} phút</span>
                        </p>
                      </div>
                      {savedTimeResult.minutes > 0 ? (
                        <button 
                          onClick={handleUseSavedTime}
                          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg transition-colors text-sm shadow-[0_0_10px_rgba(217,119,6,0.3)]"
                        >
                          Tạo phiên ngay
                        </button>
                      ) : (
                        <span className="text-xs text-stone-500 italic">Không khả dụng</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-center gap-4 mb-8">
                <div className="h-px bg-white/10 flex-1 max-w-xs"></div>
                <h3 className="text-xl font-bold text-stone-300">Hoặc chọn Mua gói cước mới</h3>
                <div className="h-px bg-white/10 flex-1 max-w-xs"></div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-5xl mx-auto w-full">
                {packages.map(pkg => (
                  <div 
                    key={pkg.id} 
                    onClick={() => {
                      setPosSelectedPackage(pkg);
                      setPosStep(2); // Đi tới Bước 2 (Menu)
                    }}
                    className="glass-card p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:scale-105 active:scale-95 transition-all aspect-square border-2 border-transparent hover:border-emerald-500/50"
                  >
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={pkg.includesDrink ? "text-amber-400" : "text-emerald-500"}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    </div>
                    <h4 className="font-bold text-white text-lg mb-2">{pkg.name}</h4>
                    <p className="text-emerald-400 font-black text-xl mb-2">{pkg.price.toLocaleString('vi-VN')}đ</p>
                    {pkg.includesDrink ? (
                      <span className="text-xs bg-amber-500/20 text-amber-400 px-3 py-1.5 rounded-full font-medium mt-auto">
                        🎁 Kèm 1 phần nước
                      </span>
                    ) : (
                      <span className="text-xs bg-stone-500/20 text-stone-400 px-3 py-1.5 rounded-full font-medium mt-auto">
                        Chỉ chỗ ngồi
                      </span>
                    )}
                  </div>
                ))}
              </div>
              {packages.length === 0 && <p className="text-stone-500 text-center mt-10">Chưa có gói cước nào.</p>}
            </div>
          )}

          {/* STEP 2: CHỌN NƯỚC */}
          {posStep === 2 && (
            <div className="flex flex-col h-full animate-slide-up">
              <div className="p-4 bg-emerald-900/30 border-b border-emerald-500/20 flex flex-col md:flex-row justify-between items-start md:items-center px-6 shrink-0 gap-4">
                <div>
                  <p className="text-sm text-emerald-400">Gói đã chọn: <span className="font-bold text-white">{posSelectedPackage?.name}</span></p>
                  {posSelectedPackage?.includesDrink && (
                    <p className="text-xs text-amber-400 mt-1">🎁 Khách được tặng 1 ly nước miễn phí trong Menu!</p>
                  )}
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                  <button onClick={() => setPosStep(1)} className="text-stone-400 hover:text-white text-sm">← Đổi gói khác</button>
                  <button onClick={() => setPosStep(3)} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-[0_0_15px_rgba(5,150,105,0.4)] transition-colors">
                    {posCart.length > 0 ? `Tiếp tục (${posCart.length} món) →` : "Bỏ qua gọi nước →"}
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 max-w-6xl mx-auto">
                  {menuItems.map(item => (
                    <div 
                      key={item.id} 
                      onClick={() => {
                        const exist = posCart.find(c => c.id === item.id);
                        if (exist) {
                          setPosCart(posCart.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
                        } else {
                          setPosCart([...posCart, { ...item, quantity: 1 }]);
                        }
                      }}
                      className="glass-card p-4 cursor-pointer hover:scale-105 active:scale-95 transition-all text-center flex flex-col items-center justify-center aspect-square relative"
                    >
                      <div className="text-5xl mb-3 drop-shadow-xl">{item.imageUrl || "🍹"}</div>
                      <h4 className="font-medium text-sm text-gray-200 line-clamp-2">{item.name}</h4>
                      <p className="text-emerald-500 font-bold text-sm mt-1">{item.price.toLocaleString('vi-VN')}đ</p>
                      
                      {posCart.find(c => c.id === item.id) && (
                        <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-sm shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-bounce-short">
                          {posCart.find(c => c.id === item.id)?.quantity}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: THANH TOÁN */}
          {posStep === 3 && (
            <div className="flex flex-col h-full animate-slide-up max-w-3xl mx-auto w-full p-6">
              <div className="flex items-center gap-4 mb-6">
                <button onClick={() => setPosStep(2)} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">←</button>
                <h3 className="text-2xl font-bold text-white">Xác nhận & Thanh toán</h3>
              </div>

              <div className="flex-1 bg-[#141c16]/40 rounded-2xl border border-white/10 p-6 overflow-y-auto">
                {/* Bill Header */}
                <div className="flex justify-between items-start pb-4 border-b border-white/10 mb-4">
                  <div>
                    <p className="font-bold text-lg text-green-400">{posSelectedPackage?.name}</p>
                    <p className="text-sm text-stone-500">Gói cước thời gian</p>
                  </div>
                  <p className="font-bold text-lg text-white">{(posSelectedPackage?.price || 0).toLocaleString('vi-VN')}đ</p>
                </div>

                {/* Drink Items */}
                <div className="space-y-4">
                  {posCart.length === 0 ? (
                    <p className="text-stone-500 text-center py-8 italic">Không kèm nước uống</p>
                  ) : posCart.map((item, index) => {
                    const isFreeDrink = posSelectedPackage?.includesDrink && index === 0;
                    return (
                    <div key={item.id} className="flex flex-col gap-1 pb-2 border-b border-white/5">
                      <div className="flex justify-between items-start">
                        <p className="font-medium text-gray-200">
                          <span className="text-emerald-500 font-bold mr-2">{item.quantity}x</span>
                          {item.name}
                        </p>
                        <p className="font-bold text-white">
                          {isFreeDrink 
                            ? (item.price * (item.quantity - 1)).toLocaleString('vi-VN') + "đ" 
                            : (item.price * item.quantity).toLocaleString('vi-VN') + "đ"
                          }
                        </p>
                      </div>
                      <div className="flex justify-between items-center">
                        {isFreeDrink ? (
                          <p className="text-xs text-amber-500 font-medium bg-amber-500/10 px-2 py-0.5 rounded inline-block">🎁 Tặng kèm gói Combo (1 ly)</p>
                        ) : (
                          <p className="text-xs text-stone-500">{item.price.toLocaleString('vi-VN')}đ/ly</p>
                        )}
                        
                        <div className="flex items-center gap-3 bg-white/5 rounded-lg px-2 py-1 mt-1">
                          <button onClick={() => {
                             if (item.quantity > 1) {
                               setPosCart(posCart.map(c => c.id === item.id ? { ...c, quantity: c.quantity - 1 } : c));
                             } else {
                               setPosCart(posCart.filter(c => c.id !== item.id));
                             }
                          }} className="w-6 h-6 flex items-center justify-center text-stone-400 hover:text-white bg-white/5 rounded">-</button>
                          <button onClick={() => setPosCart(posCart.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c))} className="w-6 h-6 flex items-center justify-center text-stone-400 hover:text-white bg-white/5 rounded">+</button>
                        </div>
                      </div>
                    </div>
                  )})}
                </div>
              </div>

              <div className="mt-6">
                <div className="flex justify-between items-end mb-6 bg-emerald-900/20 p-5 rounded-2xl border border-emerald-500/30">
                  <span className="text-emerald-400 font-medium text-lg uppercase tracking-wider">Tổng Thu</span>
                  <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-amber-400 drop-shadow-sm">
                    {(() => {
                      let drinkTotal = posCart.reduce((acc, item) => acc + item.price * item.quantity, 0);
                      if (posSelectedPackage?.includesDrink && posCart.length > 0) {
                        drinkTotal -= posCart[0].price; // Giảm giá 1 ly đầu tiên
                      }
                      return ((posSelectedPackage?.price || 0) + drinkTotal).toLocaleString('vi-VN');
                    })()}đ
                  </span>
                </div>
                
                {setPosPaymentStatus && (
                  <div className="flex w-full bg-black/20 p-1 rounded-2xl mb-6 border border-white/5 relative">
                    <button
                      onClick={() => setPosPaymentStatus("PAID")}
                      className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-300 ${
                        posPaymentStatus === "PAID" 
                          ? "bg-emerald-600/50 border border-emerald-500/50 text-white shadow-lg" 
                          : "text-stone-500 hover:text-stone-300"
                      }`}
                    >
                      Tiền mặt
                    </button>
                    <button
                      onClick={() => setPosPaymentStatus("QR")}
                      className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-300 ${
                        posPaymentStatus === "QR" 
                          ? "bg-blue-600/50 border border-blue-500/50 text-white shadow-lg" 
                          : "text-stone-500 hover:text-stone-300"
                      }`}
                    >
                      QR Ngân hàng
                    </button>
                    <button
                      onClick={() => setPosPaymentStatus("UNPAID")}
                      className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-300 ${
                        posPaymentStatus === "UNPAID" 
                          ? "bg-amber-600/50 border border-amber-500/50 text-white shadow-lg" 
                          : "text-stone-500 hover:text-stone-300"
                      }`}
                    >
                      Khách Ghi Nợ
                    </button>
                  </div>
                )}

                {posPaymentStatus === "QR" && (
                  <div className="flex flex-col items-center justify-center mb-6 bg-white p-4 rounded-2xl mx-auto w-fit animate-fade-in shadow-xl">
                    <div className="relative">
                      <img 
                        src={`https://img.vietqr.io/image/970436-0123456789-compact2.png?amount=${(() => {
                          let drinkTotal = posCart.reduce((acc, item) => acc + item.price * item.quantity, 0);
                          if (posSelectedPackage?.includesDrink && posCart.length > 0) {
                            drinkTotal -= posCart[0].price;
                          }
                          return (posSelectedPackage?.price || 0) + drinkTotal;
                        })()}&addInfo=Thanh toan Hiro App&accountName=HIRO COFFEE`} 
                        alt="VietQR" 
                        className="w-56 h-56 rounded-xl border border-stone-200" 
                      />
                    </div>
                    <p className="text-stone-900 font-bold mt-3 text-sm uppercase tracking-wide">Vietcombank - HIRO COFFEE</p>
                    <p className="text-stone-500 text-xs text-center mt-1">Đưa mã này cho khách quét để chuyển khoản</p>
                  </div>
                )}
                
                <button 
                  disabled={posLoading}
                  onClick={handleCompleteOrder}
                  className="w-full py-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-amber-500 text-white font-bold text-xl shadow-[0_0_30px_rgba(5,150,105,0.4)] disabled:opacity-50 hover:opacity-90 transition-all active:scale-95 flex justify-center items-center gap-3"
                >
                  {posLoading ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 17h2a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h2"/><path d="M17 9V5a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v4"/><path d="M7 15h10v6H7z"/></svg>
                      HOÀN TẤT & IN MÃ KHÁCH
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
