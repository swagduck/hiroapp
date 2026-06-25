"use client";

import React, { useState } from 'react';
import dynamic from 'next/dynamic';

const StaffTab = dynamic(() => import("./StaffTab"));
const ShiftsAdminTab = dynamic(() => import("./ShiftsAdminTab"));

export default function PersonnelTab() {
  const [subTab, setSubTab] = useState<"accounts" | "shifts">("shifts");

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex bg-stone-900 border border-white/10 rounded-2xl p-1 w-fit">
        <button
          onClick={() => setSubTab("shifts")}
          className={`px-6 py-2.5 rounded-xl font-bold transition-all ${subTab === "shifts" ? "bg-cyan-600 text-white shadow-lg" : "text-stone-400 hover:text-white"}`}
        >
          Ca Làm Việc & Chấm Công
        </button>
        <button
          onClick={() => setSubTab("accounts")}
          className={`px-6 py-2.5 rounded-xl font-bold transition-all ${subTab === "accounts" ? "bg-blue-600 text-white shadow-lg" : "text-stone-400 hover:text-white"}`}
        >
          Quản Lý Tài Khoản (Khách & NV)
        </button>
      </div>

      <div className="pt-2">
        {subTab === "shifts" ? <ShiftsAdminTab /> : <StaffTab />}
      </div>
    </div>
  );
}
