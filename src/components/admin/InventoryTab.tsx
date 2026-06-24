"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function InventoryTab() {
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [newIng, setNewIng] = useState({ name: "", unit: "g", minStock: 0, currentStock: 0 });
  const [recipeModal, setRecipeModal] = useState<{ menuItemId: string; ingredientId: string; quantity: string } | null>(null);
  const [restockModal, setRestockModal] = useState<{ ingredientId: string; amount: string; name: string; unit: string } | null>(null);

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

  const handleSaveRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockModal || !restockModal.amount) return;
    
    try {
      const res = await fetch(`/api/inventory/${restockModal.ingredientId}/transaction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "RESTOCK", amountChanged: Number(restockModal.amount), reason: "Nhập kho thủ công" })
      });
      if (res.ok) {
        toast.success("Nhập kho thành công!");
        setRestockModal(null);
        fetchData();
      } else {
        toast.error("Lỗi cập nhật kho");
      }
    } catch (e) {
      toast.error("Lỗi cập nhật kho");
    }
  };

  const handleSaveRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipeModal || !recipeModal.ingredientId || !recipeModal.quantity) return;

    const { menuItemId, ingredientId, quantity } = recipeModal;
    
    const menuItem = recipes.find(r => r.id === menuItemId);
    const existingItems = menuItem?.recipeItems.map((r: any) => ({ ingredientId: r.ingredientId, quantity: r.quantity })) || [];
    
    // Check if exists
    const index = existingItems.findIndex((i: any) => i.ingredientId === ingredientId);
    if (index >= 0) {
      existingItems[index].quantity += Number(quantity);
    } else {
      existingItems.push({ ingredientId, quantity: Number(quantity) });
    }

    try {
      const res = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menuItemId, items: existingItems })
      });
      if (res.ok) {
        toast.success("Cập nhật công thức thành công!");
        setRecipeModal(null);
        fetchData();
      }
    } catch (e) {
      toast.error("Lỗi cập nhật công thức");
    }
  };

  const handleRemoveRecipeItem = async (menuItemId: string, ingredientId: string) => {
    if (!confirm("Bạn muốn xóa nguyên liệu này khỏi công thức?")) return;
    const menuItem = recipes.find(r => r.id === menuItemId);
    const updatedItems = menuItem?.recipeItems
      .filter((r: any) => r.ingredientId !== ingredientId)
      .map((r: any) => ({ ingredientId: r.ingredientId, quantity: r.quantity })) || [];

    try {
      const res = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menuItemId, items: updatedItems })
      });
      if (res.ok) {
        toast.success("Đã xóa nguyên liệu khỏi công thức!");
        fetchData();
      }
    } catch (e) {
      toast.error("Lỗi cập nhật công thức");
    }
  };

  if (loading) return <div className="text-stone-400">Đang tải dữ liệu kho...</div>;

  return (
    <div className="space-y-8 relative">
      <div>
        <h3 className="text-xl font-semibold text-emerald-400 mb-4">Danh sách Nguyên Liệu (Kho)</h3>
        
        <form onSubmit={handleAddIngredient} className="flex gap-4 mb-6 bg-stone-900 p-4 rounded-xl border border-white/5">
          <input type="text" placeholder="Tên NL (VD: Cà phê hạt)" className="flex-1 bg-stone-800 border-white/10 rounded-lg px-4 text-white" value={newIng.name} onChange={e => setNewIng({...newIng, name: e.target.value})} required />
          <input type="text" placeholder="Đơn vị (g, ml, chai)" className="w-32 bg-stone-800 border-white/10 rounded-lg px-4 text-white" value={newIng.unit} onChange={e => setNewIng({...newIng, unit: e.target.value})} required />
          <input type="number" placeholder="Tồn tối thiểu" className="w-32 bg-stone-800 border-white/10 rounded-lg px-4 text-white" value={newIng.minStock || ''} onChange={e => setNewIng({...newIng, minStock: Number(e.target.value)})} />
          <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-medium">Thêm NL</button>
        </form>

        <div className="grid gap-4">
          {ingredients.map(ing => (
            <div key={ing.id} className="flex items-center justify-between bg-stone-900 p-4 rounded-xl border border-white/5">
              <div>
                <p className="font-semibold text-white">{ing.name}</p>
                <p className="text-sm text-stone-400">ID: {ing.id.substring(ing.id.length - 6)}</p>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className={`text-2xl font-bold ${ing.currentStock <= ing.minStock ? 'text-red-400' : 'text-emerald-400'}`}>
                    {ing.currentStock} <span className="text-sm font-normal text-stone-400">{ing.unit}</span>
                  </p>
                  {ing.currentStock <= ing.minStock && <p className="text-xs text-red-500">Sắp hết!</p>}
                </div>
                <button onClick={() => setRestockModal({ ingredientId: ing.id, amount: "", name: ing.name, unit: ing.unit })} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm">Nhập kho</button>
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
              <div className="flex justify-between items-center mb-3">
                <p className="font-semibold text-white text-lg">{menuItem.name}</p>
                <button 
                  onClick={() => setRecipeModal({ menuItemId: menuItem.id, ingredientId: ingredients[0]?.id || "", quantity: "" })} 
                  className="bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                >
                  + Thêm NL
                </button>
              </div>
              {menuItem.recipeItems.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {menuItem.recipeItems.map((r: any) => (
                    <div key={r.id} className="bg-stone-800 text-stone-300 text-sm px-3 py-1.5 rounded-lg border border-white/5 flex items-center gap-2">
                      <span>{r.ingredient.name}: <strong className="text-white">{r.quantity}{r.ingredient.unit}</strong></span>
                      <button onClick={() => handleRemoveRecipeItem(menuItem.id, r.ingredient.id)} className="text-red-400 hover:text-red-300 ml-1">
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-stone-500 italic">Chưa cài đặt công thức</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Recipe Modal */}
      {recipeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-stone-900 border border-white/10 p-6 rounded-2xl w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">Thêm nguyên liệu vào công thức</h3>
            <p className="text-stone-400 text-sm mb-4">Món: <span className="text-emerald-400 font-semibold">{recipes.find(r => r.id === recipeModal.menuItemId)?.name}</span></p>
            
            <form onSubmit={handleSaveRecipe} className="space-y-4">
              <div>
                <label className="block text-sm text-stone-400 mb-1">Chọn Nguyên liệu</label>
                <select 
                  className="w-full bg-stone-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                  value={recipeModal.ingredientId}
                  onChange={(e) => setRecipeModal({...recipeModal, ingredientId: e.target.value})}
                  required
                >
                  {ingredients.map(ing => (
                    <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-stone-400 mb-1">Số lượng ({ingredients.find(i => i.id === recipeModal.ingredientId)?.unit || ""})</label>
                <input 
                  type="number" 
                  min="0.1" step="0.1"
                  className="w-full bg-stone-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                  value={recipeModal.quantity}
                  onChange={(e) => setRecipeModal({...recipeModal, quantity: e.target.value})}
                  placeholder="VD: 20"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setRecipeModal(null)} className="flex-1 py-3 rounded-xl bg-stone-800 text-stone-300 font-medium hover:bg-stone-700">Hủy</button>
                <button type="submit" className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-500">Lưu thay đổi</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {restockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-stone-900 border border-white/10 p-6 rounded-2xl w-full max-w-sm shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">Nhập kho thủ công</h3>
            <p className="text-stone-400 text-sm mb-6">Nguyên liệu: <strong className="text-white">{restockModal.name}</strong></p>
            
            <form onSubmit={handleSaveRestock} className="space-y-4">
              <div>
                <label className="block text-sm text-stone-400 mb-1">Số lượng nhập thêm ({restockModal.unit})</label>
                <input 
                  type="number" 
                  min="0.1" step="0.1"
                  className="w-full bg-stone-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                  value={restockModal.amount}
                  onChange={(e) => setRestockModal({...restockModal, amount: e.target.value})}
                  placeholder="VD: 500"
                  required
                  autoFocus
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setRestockModal(null)} className="flex-1 py-3 rounded-xl bg-stone-800 text-stone-300 font-medium hover:bg-stone-700">Hủy</button>
                <button type="submit" className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-500">Xác nhận nhập</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
