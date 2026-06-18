"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "sonner";

export default function MemberDashboard() {
  const router = useRouter();
  const [member, setMember] = useState<any>(null);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [historySessions, setHistorySessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<"menu" | "cart" | "history" | "profile">("menu");
  const [dobInput, setDobInput] = useState("");
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Mua hàng
  const [packages, setPackages] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [selectedPkg, setSelectedPkg] = useState<string | null>(null);
  const [cart, setCart] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [useFreeDrink, setUseFreeDrink] = useState(false);

  const fetchData = async () => {
    try {
      const [meRes, sessionRes, historyRes, pkgRes, menuRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/member/orders"),
        fetch("/api/member/orders?history=true"),
        fetch("/api/packages"),
        fetch("/api/menu")
      ]);

      if (meRes.ok) {
        const userData = await meRes.json();
        setMember(userData);
        if (userData.dob) setDobInput(userData.dob);
      } else {
        router.push("/customer");
        return;
      }

      if (sessionRes.ok) {
        const s = await sessionRes.json();
        if (s && (s.status === "ACTIVE" || s.status === "PENDING")) {
          setActiveSession(s);
        }
      }

      if (historyRes.ok) {
        const hs = await historyRes.json();
        setHistorySessions(Array.isArray(hs) ? hs : []);
      }
      
      if (pkgRes.ok) {
        const p = await pkgRes.json();
        setPackages(p.filter((x: any) => x.isActive));
      }

      if (menuRes.ok) {
        const m = await menuRes.json();
        setMenuItems(m.filter((x: any) => x.isAvailable));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [router]);

  const addToCart = (item: any) => {
    const existing = cart.find(c => c.id === item.id);
    if (existing) {
      setCart(cart.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const submitOrder = async () => {
    if (!selectedPkg) {
      toast.error("Vui lòng chọn 1 Gói giờ!");
      return;
    }
    
    setSubmitting(true);
    const pkg = packages.find(p => p.id === selectedPkg);
    const totalAmount = getCartTotal();

    // The orderItems will just be sent, API will trust the totalAmount for simplicity in this MVP
    // We should send the updateFreeDrink flag
    let updateFreeDrink = false;
    const orderItems = cart.map(item => ({
      id: item.id,
      quantity: item.quantity,
      price: item.price * 0.9 // Member discount recorded in DB
    }));

    if (pkg?.includesDrink && cart.length > 0) {
      orderItems[0].price = 0;
    } else if (useFreeDrink && cart.length > 0) {
      orderItems[0].price = 0;
      updateFreeDrink = true;
    }

    try {
      const res = await fetch("/api/member/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: selectedPkg,
          orderItems,
          orderTotal: totalAmount,
          updateFreeDrink
        })
      });

      if (res.ok) {
        toast.success("Gửi đơn thành công! Vui lòng ra quầy hoặc đợi thu ngân duyệt.");
        setTimeout(() => window.location.reload(), 1500);
      } else {
        toast.error("Lỗi tạo đơn");
      }
    } catch (e) {
      toast.error("Lỗi kết nối");
    } finally {
      setSubmitting(false);
    }
  };

  const getCartTotal = () => {
    const pkg = packages.find(p => p.id === selectedPkg);
    let totalDrinks = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    let pkgPrice = pkg ? pkg.price : 0;

    // Apply 10% member discount on drinks
    totalDrinks = totalDrinks * 0.9;

    let firstDrinkPrice = cart.length > 0 ? cart[0].price * 0.9 : 0;
    
    if (pkg?.includesDrink && cart.length > 0) {
      totalDrinks -= firstDrinkPrice;
    } else if (useFreeDrink && cart.length > 0) {
      totalDrinks -= firstDrinkPrice;
    }

    return pkgPrice + Math.max(0, totalDrinks);
  };

  const getDiscountAmount = () => {
    let totalDrinksOriginal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    return totalDrinksOriginal * 0.1;
  };

  if (loading) return <div className="min-h-screen bg-stone-950 flex justify-center items-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-emerald-500"></div></div>;

  return (
    <div className="min-h-screen bg-slate-950 flex justify-center pb-24">
      <div className="w-full max-w-md bg-stone-950 min-h-screen border-x border-white/5 text-white relative">
        
        {/* Header User */}
        <div className="p-5 bg-gradient-to-b from-emerald-900/40 to-transparent border-b border-white/5 sticky top-0 z-10 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center font-bold text-xl shadow-[0_0_15px_rgba(16,185,129,0.5)]">
              {member?.name?.charAt(0) || "U"}
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-lg">{member?.name}</h2>
              <div className="flex items-center gap-2 text-sm text-emerald-400 flex-wrap">
                <span className="font-mono bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                  {member?.customerCode || "KH MỚI"}
                </span>
                <span className="text-stone-400">|</span>
                <span>Bảo lưu: {member?.savedMinutes || 0}p</span>
                <span className="text-stone-400">|</span>
                <span className="text-amber-400">Điểm: {member?.points || 0}</span>
                {member?.points >= 100 && (
                  <button 
                    onClick={async () => {
                      if (!confirm("Đổi 100 điểm lấy 60 phút bảo lưu?")) return;
                      try {
                        const res = await fetch("/api/users/redeem-points", { method: "POST" });
                        if (res.ok) {
                          toast.success("Đổi điểm thành công!");
                          fetchData();
                        } else {
                          toast.error("Lỗi đổi điểm!");
                        }
                      } catch (e) {
                        toast.error("Lỗi kết nối");
                      }
                    }}
                    className="ml-1 px-2 py-0.5 bg-amber-500/20 border border-amber-500/50 text-amber-400 rounded hover:bg-amber-500/40 transition-colors text-xs font-bold"
                  >
                    Đổi 1h
                  </button>
                )}
              </div>
            </div>
            <button
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" });
                router.push("/customer");
              }}
              className="px-3 py-1.5 text-xs font-bold bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors"
            >
              Đăng xuất
            </button>
          </div>
        </div>

        {/* Content based on Tab */}
        <div key={activeTab} className="p-4 animate-tab-enter">
          {activeTab === "menu" && (
            <div className="space-y-6">
              {/* Active Session Banner */}
              {activeSession && (
                <div className={`p-4 rounded-2xl border ${activeSession.status === 'PENDING' ? 'bg-amber-900/20 border-amber-500/30' : 'bg-emerald-900/20 border-emerald-500/30'} cursor-pointer`} onClick={() => setActiveTab("history")}>
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-sm text-stone-300">Bạn đang có 1 phiên {activeSession.status === 'PENDING' ? 'chờ duyệt' : 'hoạt động'}</h3>
                      <p className="text-xs text-stone-500 mt-1">Nhấn vào Lịch sử để xem chi tiết QR thanh toán/check-in.</p>
                    </div>
                    <span className="text-xl">👉</span>
                  </div>
                </div>
              )}

              <div>
                <h3 className="font-bold text-lg mb-4 text-emerald-400">1. Chọn Gói Thời Gian</h3>
                <div className="space-y-3">
                  {packages.map(pkg => (
                    <div 
                      key={pkg.id} 
                      onClick={() => setSelectedPkg(pkg.id)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedPkg === pkg.id ? 'bg-emerald-900/40 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{pkg.name}</span>
                        <span className="text-emerald-400 font-bold">{pkg.price.toLocaleString('vi-VN')}đ</span>
                      </div>
                      {pkg.includesDrink && <p className="text-xs text-amber-400 mt-1">✨ Tặng 1 ly nước bất kỳ</p>}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-lg mb-4 text-emerald-400">2. Chọn Đồ Uống (Tùy chọn)</h3>
                <div className="grid grid-cols-2 gap-3">
                  {menuItems.map(item => (
                    <div key={item.id} onClick={() => addToCart(item)} className="bg-white/5 p-4 rounded-xl border border-white/10 flex flex-col items-center text-center cursor-pointer hover:bg-white/10 hover:border-emerald-500/50 active:scale-95 transition-all group">
                      <div className="text-4xl mb-3 group-active:scale-110 transition-transform">{item.imageUrl || "🍹"}</div>
                      <span className="text-sm font-medium mb-1 line-clamp-2 min-h-[40px]">{item.name}</span>
                      <span className="text-xs text-emerald-400 font-bold">{item.price.toLocaleString('vi-VN')}đ</span>
                      <div className="mt-2 w-full bg-emerald-600/20 text-emerald-400 py-1.5 rounded-lg text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">Thêm</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "cart" && (
            <div className="space-y-6">
              <h3 className="font-bold text-2xl text-white mb-2">Giỏ hàng của bạn</h3>
              
              <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-4">
                <div className="pb-4 border-b border-white/10">
                  <h4 className="text-sm text-stone-400 font-medium mb-2">Gói thời gian</h4>
                  {selectedPkg ? (
                    <div className="flex justify-between items-center text-emerald-400 font-bold">
                      <span>{packages.find(p => p.id === selectedPkg)?.name}</span>
                      <span>{packages.find(p => p.id === selectedPkg)?.price.toLocaleString('vi-VN')}đ</span>
                    </div>
                  ) : (
                    <p className="text-stone-500 text-sm italic">Chưa chọn gói</p>
                  )}
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm text-stone-400 font-medium">Đồ uống</h4>
                    <button onClick={() => setCart([])} className="text-xs text-stone-500 hover:text-white">Xóa tất cả</button>
                  </div>
                  {cart.length > 0 ? (
                    <div className="space-y-3 mt-3">
                      {cart.map((c, i) => (
                        <div key={i} className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 bg-stone-800 text-xs flex items-center justify-center rounded text-stone-300">{c.quantity}x</span>
                            <span className="text-sm text-stone-200">{c.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-stone-300">{(c.price * c.quantity).toLocaleString('vi-VN')}đ</span>
                            <button onClick={() => setCart(cart.filter(x => x.id !== c.id))} className="text-red-400/50 hover:text-red-400">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-stone-500 text-sm italic">Chưa chọn đồ uống</p>
                  )}
                </div>
              </div>

              {getDiscountAmount() > 0 && (
                <div className="bg-emerald-900/10 text-emerald-400 text-xs p-3 rounded-lg border border-emerald-500/20 flex items-center gap-2">
                  <span>💎</span>
                  <span>Đã giảm 10% tiền nước (Đặc quyền Hội viên)</span>
                </div>
              )}

              {member?.freeDrinkTokens > 0 && !packages.find(p => p.id === selectedPkg)?.includesDrink && cart.length > 0 && (
                <div className="bg-pink-900/20 text-pink-400 text-xs p-3 rounded-lg border border-pink-500/30 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span>🎂</span>
                    <span>Bạn có {member.freeDrinkTokens} quà sinh nhật!</span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={useFreeDrink} 
                      onChange={(e) => setUseFreeDrink(e.target.checked)}
                      className="accent-pink-500 w-4 h-4"
                    />
                    <span className="font-bold">Dùng ngay</span>
                  </label>
                </div>
              )}

              {packages.find(p => p.id === selectedPkg)?.includesDrink && cart.length > 0 && (
                <div className="bg-emerald-900/20 text-emerald-400 text-xs p-3 rounded-lg border border-emerald-500/30 flex items-center gap-2">
                  <span>🎁</span>
                  <span>Đã trừ tiền 1 ly nước (Áp dụng theo gói Combo)</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-4">
                <span className="text-stone-400">Tổng thanh toán:</span>
                <span className="text-2xl font-black text-emerald-400">{getCartTotal().toLocaleString('vi-VN')}đ</span>
              </div>

              <button 
                onClick={submitOrder}
                disabled={submitting || !selectedPkg || !!activeSession}
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:opacity-50 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all mt-4"
              >
                {activeSession ? "Đang có phiên hoạt động" : (submitting ? "Đang xử lý..." : "Gửi Đơn Order")}
              </button>
            </div>
          )}

          {activeTab === "history" && (
            <div className="space-y-6">
              <h3 className="font-bold text-2xl text-white mb-4">Lịch sử & Hoạt động</h3>
              
              {activeSession && (
                <div className={`p-5 rounded-2xl border mb-6 ${activeSession.status === 'PENDING' ? 'bg-amber-900/20 border-amber-500' : 'bg-emerald-900/20 border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.1)]'}`}>
                  <h4 className="font-bold text-lg mb-1 flex items-center gap-2">
                    Phiên hiện tại 
                    <span className="flex h-3 w-3 relative">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${activeSession.status === 'PENDING' ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
                      <span className={`relative inline-flex rounded-full h-3 w-3 ${activeSession.status === 'PENDING' ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                    </span>
                  </h4>
                  <p className="text-sm text-stone-300 mb-4">Gói: <span className="text-white font-medium">{activeSession.package?.name}</span></p>
                  
                  {activeSession.status === 'PENDING' && activeSession.paymentStatus === 'UNPAID' && (
                    <div className="mt-4 flex flex-col items-center bg-white p-4 rounded-xl mx-auto">
                      <p className="text-stone-900 font-bold mb-2 text-center text-sm">Mã QR Thanh Toán</p>
                      <img 
                        src={`https://img.vietqr.io/image/MB-123456789-compact2.png?amount=${activeSession.totalAmount || 0}&addInfo=${activeSession.accessCode}&accountName=SPACE CAFE`} 
                        alt="VietQR" 
                        className="w-[160px] h-[180px] object-contain rounded shadow-sm border border-stone-200" 
                      />
                      <div className="text-stone-600 text-xs mt-3 text-center space-y-1">
                        <p>Số tiền: <strong className="text-emerald-600 text-sm">{(activeSession.totalAmount || 0).toLocaleString('vi-VN')}đ</strong></p>
                        <p>Mã phiên: <strong className="text-stone-900">{activeSession.accessCode}</strong></p>
                      </div>
                    </div>
                  )}

                  {activeSession.status === 'ACTIVE' && (
                    <div className="mt-4 flex flex-col items-center bg-white p-4 rounded-xl mx-auto max-w-[220px]">
                      <p className="text-stone-900 font-bold mb-2 text-center text-sm">Mã QR Lên Lầu</p>
                      <QRCodeCanvas 
                        value={activeSession.accessCode} 
                        size={180} 
                        level={"H"} 
                        includeMargin={true}
                        fgColor={"#000000"} 
                        bgColor={"#ffffff"} 
                      />
                      <p className="text-stone-500 font-mono mt-2 text-xs text-center">{activeSession.accessCode}</p>
                    </div>
                  )}

                  {activeSession.status === 'ACTIVE' && (
                    <button onClick={() => router.push(`/customer/${activeSession.accessCode}`)} className="w-full mt-4 bg-emerald-600/20 border border-emerald-500 hover:bg-emerald-600/30 text-emerald-400 py-3 rounded-xl font-bold transition-colors">
                      Vào Menu Gọi Thêm Nước
                    </button>
                  )}
                </div>
              )}

              <div className="space-y-3">
                <h4 className="text-sm font-bold text-stone-400 uppercase tracking-widest mb-3">Lịch sử giao dịch</h4>
                {historySessions.length === 0 ? (
                  <p className="text-stone-500 text-sm italic text-center py-8">Chưa có giao dịch nào</p>
                ) : (
                  historySessions.filter(s => s.status === 'COMPLETED' || s.status === 'CANCELLED').map(s => (
                    <div key={s.id} className="bg-white/5 p-4 rounded-xl border border-white/10 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-sm text-stone-200">{s.package?.name || "Gói thời gian"}</p>
                        <p className="text-xs text-stone-500 mt-1">{new Date(s.createdAt).toLocaleDateString('vi-VN')} - {new Date(s.createdAt).toLocaleTimeString('vi-VN')}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-400">{(s.totalAmount || 0).toLocaleString('vi-VN')}đ</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${s.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                          {s.status === 'COMPLETED' ? 'HOÀN THÀNH' : 'ĐÃ HỦY'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === "profile" && (
            <div className="space-y-6 animate-page-transition">
              <h3 className="font-bold text-lg text-emerald-400">Thông tin Cá nhân</h3>
              
              <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-400 mb-1">Tên hiển thị</label>
                  <input type="text" value={member?.name || ""} disabled className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-stone-500 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-400 mb-1">Email</label>
                  <input type="email" value={member?.email || ""} disabled className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-stone-500 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-400 mb-1">Ngày sinh (Để nhận quà sinh nhật)</label>
                  <input 
                    type="text" 
                    placeholder="DD/MM/YYYY (Ví dụ: 25/12/1999)"
                    value={dobInput} 
                    onChange={(e) => setDobInput(e.target.value)}
                    className="w-full bg-black/20 border border-emerald-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50" 
                  />
                  <p className="text-xs text-stone-500 mt-2">Nhập đúng định dạng DD/MM/YYYY. Ngày sinh chỉ được nhập một lần hoặc phải liên hệ nhân viên để đổi lại nhằm tránh gian lận.</p>
                </div>

                <button 
                  disabled={updatingProfile}
                  onClick={async () => {
                    setUpdatingProfile(true);
                    try {
                      const res = await fetch("/api/auth/me", {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ dob: dobInput })
                      });
                      if (res.ok) {
                        toast.success("Cập nhật thành công!");
                        fetchData();
                      } else {
                        const err = await res.json();
                        toast.error(err.error || "Lỗi cập nhật");
                      }
                    } catch(e) {
                      toast.error("Lỗi kết nối");
                    }
                    setUpdatingProfile(false);
                  }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold transition-all active:scale-95 disabled:opacity-50"
                >
                  {updatingProfile ? "Đang lưu..." : "Lưu Thay Đổi"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-stone-950/80 backdrop-blur-xl border-t border-white/10 z-50">
          <div className="flex justify-around items-center px-2 py-3">
            <button 
              onClick={() => setActiveTab("menu")}
              className={`flex flex-col items-center gap-1 p-2 flex-1 rounded-xl transition-all ${activeTab === 'menu' ? 'text-emerald-400' : 'text-stone-500 hover:text-stone-300'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>
              <span className="text-[10px] font-bold uppercase tracking-wider">Menu</span>
            </button>
            <button 
              onClick={() => setActiveTab("cart")}
              className={`flex flex-col items-center gap-1 p-2 flex-1 rounded-xl transition-all relative ${activeTab === 'cart' ? 'text-emerald-400' : 'text-stone-500 hover:text-stone-300'}`}
            >
              <div className="relative">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                {(cart.reduce((acc, item) => acc + item.quantity, 0) + (selectedPkg ? 1 : 0)) > 0 && (
                  <span className="absolute -top-2 -right-2 bg-amber-500 text-stone-900 text-[10px] font-black w-4 h-4 flex items-center justify-center rounded-full animate-bounce">
                    {cart.reduce((acc, item) => acc + item.quantity, 0) + (selectedPkg ? 1 : 0)}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider">Giỏ Hàng</span>
            </button>
            <button 
              onClick={() => setActiveTab("history")}
              className={`flex flex-col items-center gap-1 p-2 flex-1 rounded-xl transition-all ${activeTab === 'history' ? 'text-emerald-400' : 'text-stone-500 hover:text-stone-300'}`}
            >
              <div className="relative">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><path d="M12 7v5l4 2"/></svg>
                {activeSession && activeTab !== 'history' && (
                  <span className="absolute 0 top-0 right-0 w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
                )}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider">Lịch sử</span>
            </button>
            <button 
              onClick={() => setActiveTab("profile")}
              className={`flex flex-col items-center gap-1 p-2 flex-1 rounded-xl transition-all ${activeTab === 'profile' ? 'text-emerald-400' : 'text-stone-500 hover:text-stone-300'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              <span className="text-[10px] font-bold uppercase tracking-wider">Cá Nhân</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
