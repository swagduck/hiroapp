"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function InventoryTab() {
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [newIng, setNewIng] = useState({ name: "", unit: "g", minStock: 0, currentStock: 0 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resIng, resRec] = await Promise.all([
        fetch("/api/inventory"),
        fetch("/api/recipes")
      ]);
      if (resIng.ok) setIngredients(await resIng.json());
      if (resRec.ok) setRecipes(await resRec.json());
    } catch (e) {
      toast.error("Lỗi tải dữ liệu kho");
    } finally {
      setLoading(false);
    }
  };

  const handleAddIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIng.name) return;
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newIng)
      });
      if (res.ok) {
        toast.success("Thêm nguyên liệu thành công");
        setNewIng({ name: "", unit: "g", minStock: 0, currentStock: 0 });
        fetchData();
      }
    } catch (e) {
      toast.error("Lỗi thêm nguyên liệu");
    }
  };

  const handleRestock = async (id: string) => {
    const amount = window.prompt("Nhập số lượng nhập thêm kho:");
    if (!amount || isNaN(Number(amount))) return;
    
    try {
      const res = await fetch(`/api/inventory/${id}/transaction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "RESTOCK", amountChanged: Number(amount), reason: "Nhập kho thủ công" })
      });
      if (res.ok) {
        toast.success("Nhập kho thành công!");
        fetchData();
      } else {
        toast.error("Lỗi cập nhật kho");
      }
    } catch (e) {
      toast.error("Lỗi cập nhật kho");
    }
  };

  const handleRecipeChange = async (menuItemId: string) => {
    // Simple prompt for MVP
    const ingredientName = window.prompt("Nhập ID của Nguyên liệu cần thêm vào công thức này (Xem ID ở bảng trên):");
    const quantity = window.prompt("Nhập số lượng (Ví dụ: 20):");
    
    if (!ingredientName || !quantity) return;

    // Fetch existing recipe items to append
    const menuItem = recipes.find(r => r.id === menuItemId);
    const existingItems = menuItem?.recipeItems.map((r: any) => ({ ingredientId: r.ingredientId, quantity: r.quantity })) || [];
    
    existingItems.push({ ingredientId: ingredientName, quantity: Number(quantity) });

    try {
      const res = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menuItemId, items: existingItems })
      });
      if (res.ok) {
        toast.success("Cập nhật công thức thành công!");
        fetchData();
      }
    } catch (e) {
      toast.error("Lỗi cập nhật công thức");
    }
  };

  if (loading) return <div className="text-stone-400">Đang tải dữ liệu kho...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-semibold text-emerald-400 mb-4">Danh sách Nguyên Liệu (Kho)</h3>
        
        <form onSubmit={handleAddIngredient} className="flex gap-4 mb-6 bg-stone-900 p-4 rounded-xl border border-white/5">
          <input type="text" placeholder="Tên NL (VD: Cà phê hạt)" className="flex-1 bg-stone-800 border-white/10 rounded-lg px-4" value={newIng.name} onChange={e => setNewIng({...newIng, name: e.target.value})} required />
          <input type="text" placeholder="Đơn vị (g, ml, chai)" className="w-32 bg-stone-800 border-white/10 rounded-lg px-4" value={newIng.unit} onChange={e => setNewIng({...newIng, unit: e.target.value})} required />
          <input type="number" placeholder="Tồn tối thiểu" className="w-32 bg-stone-800 border-white/10 rounded-lg px-4" value={newIng.minStock || ''} onChange={e => setNewIng({...newIng, minStock: Number(e.target.value)})} />
          <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-medium">Thêm NL</button>
        </form>

        <div className="grid gap-4">
          {ingredients.map(ing => (
            <div key={ing.id} className="flex items-center justify-between bg-stone-900 p-4 rounded-xl border border-white/5">
              <div>
                <p className="font-semibold text-white">{ing.name}</p>
                <p className="text-sm text-stone-400">ID: {ing.id}</p>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className={`text-2xl font-bold ${ing.currentStock <= ing.minStock ? 'text-red-400' : 'text-emerald-400'}`}>
                    {ing.currentStock} <span className="text-sm font-normal text-stone-400">{ing.unit}</span>
                  </p>
                  {ing.currentStock <= ing.minStock && <p className="text-xs text-red-500">Sắp hết!</p>}
                </div>
                <button onClick={() => handleRestock(ing.id)} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm">Nhập kho</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold text-emerald-400 mb-4">Công thức đồ uống</h3>
        <div className="grid gap-4">
          {recipes.map(menuItem => (
            <div key={menuItem.id} className="bg-stone-900 p-4 rounded-xl border border-white/5">
              <div className="flex justify-between items-center mb-2">
                <p className="font-semibold text-white">{menuItem.name}</p>
                <button onClick={() => handleRecipeChange(menuItem.id)} className="text-emerald-400 hover:text-emerald-300 text-sm font-medium">+ Thêm NL vào công thức</button>
              </div>
              {menuItem.recipeItems.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {menuItem.recipeItems.map((r: any) => (
                    <span key={r.id} className="bg-stone-800 text-stone-300 text-xs px-2 py-1 rounded border border-white/5">
                      {r.ingredient.name}: {r.quantity}{r.ingredient.unit}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-stone-500 italic">Chưa cài đặt công thức</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
