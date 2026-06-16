"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";

export default function MemberDashboard() {
  const router = useRouter();
  const [member, setMember] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Mua hàng
  const [packages, setPackages] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [selectedPkg, setSelectedPkg] = useState<string | null>(null);
  const [cart, setCart] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Lấy thông tin từ localStorage
    const saved = localStorage.getItem("member_info");
    if (saved) {
      setMember(JSON.parse(saved));
    } else {
      router.push("/member/login");
      return;
    }

    const fetchData = async () => {
      try {
        const [sessionRes, pkgRes, menuRes] = await Promise.all([
          fetch("/api/member/orders"),
          fetch("/api/packages"),
          fetch("/api/menu")
        ]);

        if (sessionRes.ok) {
          const s = await sessionRes.json();
          // Chỉ lấy phiên Active hoặc Pending
          if (s && (s.status === "ACTIVE" || s.status === "PENDING")) {
            setSession(s);
          }
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
      alert("Vui lòng chọn 1 Gói giờ!");
      return;
    }
    
    setSubmitting(true);
    const pkg = packages.find(p => p.id === selectedPkg);
    let totalAmount = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const orderItems = cart.map(item => ({
      id: item.id,
      quantity: item.quantity,
      price: item.price
    }));

    if (pkg?.includesDrink && cart.length > 0) {
      totalAmount -= cart[0].price; // Miễn phí ly đầu tiên
      orderItems[0].price = 0;
    }

    try {
      const res = await fetch("/api/member/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: selectedPkg,
          orderItems,
          orderTotal: totalAmount
        })
      });

      if (res.ok) {
        alert("Gửi đơn thành công! Vui lòng ra quầy hoặc đợi thu ngân duyệt.");
        window.location.reload();
      } else {
        alert("Lỗi tạo đơn");
      }
    } catch (e) {
      alert("Lỗi kết nối");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-stone-950 flex justify-center items-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-emerald-500"></div></div>;

  return (
    <div className="min-h-screen bg-slate-950 flex justify-center pb-20">
      <div className="w-full max-w-md bg-stone-950 min-h-screen border-x border-white/5 text-white">
        
        {/* Header User */}
        <div className="p-5 bg-gradient-to-b from-emerald-900/40 to-transparent border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center font-bold text-xl shadow-[0_0_15px_rgba(16,185,129,0.5)]">
              {member?.name?.charAt(0) || "U"}
            </div>
            <div>
              <h2 className="font-bold text-lg">{member?.name}</h2>
              <div className="flex items-center gap-2 text-sm text-emerald-400">
                <span className="font-mono bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                  {member?.customerCode}
                </span>
                <span className="text-stone-400">|</span>
                <span>Bảo lưu: {member?.savedMinutes || 0} phút</span>
              </div>
            </div>
          </div>
        </div>

        {session ? (
          <div className="p-4 space-y-4">
            <div className={`p-4 rounded-2xl border ${session.status === 'PENDING' ? 'bg-amber-900/20 border-amber-500/30' : 'bg-emerald-900/20 border-emerald-500/30'}`}>
              <h3 className="font-bold mb-2">Đơn hàng hiện tại</h3>
              <p className="text-sm text-stone-300">Gói: <span className="text-white font-medium">{session.package?.name}</span></p>
              <div className="mt-4 flex justify-between items-center">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${session.status === 'PENDING' ? 'bg-amber-500 text-stone-900' : 'bg-emerald-500 text-white'}`}>
                  {session.status === 'PENDING' ? 'Chờ thu ngân duyệt' : 'Đang hoạt động'}
                </span>
                {session.status === 'ACTIVE' && (
                  <button onClick={() => router.push(`/customer/${session.accessCode}`)} className="text-emerald-400 text-sm font-medium hover:underline">
                    Gọi Nước &gt;
                  </button>
                )}
              </div>
              {session.status === 'ACTIVE' && (
                <div className="mt-6 flex flex-col items-center bg-white p-4 rounded-xl max-w-[200px] mx-auto">
                  <QRCodeCanvas 
                    value={session.accessCode} 
                    size={160} 
                    level={"H"} 
                    includeMargin={true}
                    fgColor={"#000000"} 
                    bgColor={"#ffffff"} 
                  />
                  <p className="text-stone-900 font-bold mt-2 text-sm text-center">Quét QR tại cổng</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-4">
            <h3 className="font-bold text-lg mb-4 text-emerald-400">1. Chọn Gói Thời Gian</h3>
            <div className="space-y-3 mb-8">
              {packages.map(pkg => (
                <div 
                  key={pkg.id} 
                  onClick={() => setSelectedPkg(pkg.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedPkg === pkg.id ? 'bg-emerald-900/40 border-emerald-500' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{pkg.name}</span>
                    <span className="text-emerald-400 font-bold">{pkg.price.toLocaleString('vi-VN')}đ</span>
                  </div>
                  {pkg.includesDrink && <p className="text-xs text-amber-400 mt-1">✨ Tặng 1 ly nước</p>}
                </div>
              ))}
            </div>

            <h3 className="font-bold text-lg mb-4 text-emerald-400">2. Chọn Đồ Uống (Tùy chọn)</h3>
            <div className="grid grid-cols-2 gap-3 mb-8">
              {menuItems.map(item => (
                <div key={item.id} onClick={() => addToCart(item)} className="bg-white/5 p-3 rounded-xl border border-white/10 flex flex-col items-center text-center cursor-pointer hover:bg-white/10 active:scale-95 transition-all">
                  <div className="text-4xl mb-2">{item.imageUrl || "🍹"}</div>
                  <span className="text-sm font-medium mb-1 line-clamp-1">{item.name}</span>
                  <span className="text-xs text-stone-400">{item.price.toLocaleString('vi-VN')}đ</span>
                </div>
              ))}
            </div>

            {cart.length > 0 && (
              <div className="mb-8 bg-white/5 p-4 rounded-xl border border-white/10 space-y-2">
                <h4 className="font-bold mb-2">Đã chọn:</h4>
                {cart.map((c, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span>{c.quantity}x {c.name}</span>
                    <button onClick={() => setCart(cart.filter(x => x.id !== c.id))} className="text-red-400">Xóa</button>
                  </div>
                ))}
              </div>
            )}

            <button 
              onClick={submitOrder}
              disabled={submitting || !selectedPkg}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all"
            >
              {submitting ? "Đang gửi..." : "Gửi Đơn Order"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
