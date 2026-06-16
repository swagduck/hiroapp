"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PublicMenuPage() {
  const router = useRouter();
  const [packages, setPackages] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pkgRes, menuRes] = await Promise.all([
          fetch('/api/packages'),
          fetch('/api/menu')
        ]);
        const pkgs = await pkgRes.json();
        const items = await menuRes.json();
        
        // Chỉ hiện những món đang bán
        setPackages(pkgs.filter((p: any) => p.isActive));
        setMenuItems(items.filter((m: any) => m.isAvailable));
      } catch (error) {
        console.error("Error fetching menu:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-[#141c16] flex justify-center pb-20">
      <div className="w-full max-w-md bg-stone-950 text-stone-200 min-h-screen shadow-2xl relative border-x border-white/5">
        
        {/* Header */}
        <div className="sticky top-0 z-50 bg-stone-950/80 backdrop-blur-md border-b border-white/10 p-4 flex items-center justify-between">
          <button 
            onClick={() => router.back()} 
            className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-stone-300 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-amber-500">
            Menu & Bảng Giá
          </h1>
          <div className="w-9"></div> {/* Spacer to center title */}
        </div>

        {loading ? (
          <div className="flex flex-col justify-center items-center h-64 gap-4">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-500"></div>
            <p className="text-stone-400 animate-pulse">Đang tải thực đơn...</p>
          </div>
        ) : (
          <div className="p-4 space-y-8 animate-page-transition">
            
            {/* Packages Section */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 7h.01"/><path d="M17 7h.01"/><path d="M7 17h.01"/><path d="M17 17h.01"/></svg>
                <h2 className="text-xl font-bold text-white">Gói chỗ ngồi (Mua tại quầy)</h2>
              </div>
              <div className="space-y-3">
                {packages.map(pkg => (
                  <div key={pkg.id} className="bg-white/5 border border-emerald-900/30 rounded-2xl p-4 flex justify-between items-center relative overflow-hidden">
                    <div className="relative z-10">
                      <h3 className="font-bold text-lg text-emerald-100">{pkg.name}</h3>
                      <p className="text-sm text-stone-400 mt-1">
                        Thời gian: {pkg.duration ? `${pkg.duration / 60} tiếng` : "Không giới hạn"}
                      </p>
                      {pkg.includesDrink && (
                        <span className="inline-block mt-2 text-xs px-2 py-1 bg-amber-500/20 text-amber-400 rounded-full font-medium">
                          ✨ Đã bao gồm 1 phần nước
                        </span>
                      )}
                    </div>
                    <div className="text-right relative z-10">
                      <p className="text-emerald-400 font-bold text-xl">{pkg.price.toLocaleString('vi-VN')}đ</p>
                    </div>
                    {/* Decorative gradient */}
                    <div className="absolute right-0 top-0 w-32 h-full bg-gradient-to-l from-emerald-900/20 to-transparent pointer-events-none"></div>
                  </div>
                ))}
              </div>
            </section>

            {/* Menu Section */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" x2="6" y1="2" y2="4"/><line x1="10" x2="10" y1="2" y2="4"/><line x1="14" x2="14" y1="2" y2="4"/></svg>
                <h2 className="text-xl font-bold text-white">Thực đơn Đồ uống</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {menuItems.map(item => (
                  <div key={item.id} className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col items-center text-center">
                    <div className="text-5xl mb-3 drop-shadow-lg">{item.imageUrl || "🍹"}</div>
                    <h3 className="font-bold text-stone-200 text-sm mb-2">{item.name}</h3>
                    <p className="text-amber-500 font-bold mt-auto">{item.price.toLocaleString('vi-VN')}đ</p>
                  </div>
                ))}
              </div>
            </section>

          </div>
        )}
      </div>
    </div>
  );
}
