const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');

code = code.replace(
  'const [receiptData, setReceiptData] = useState<any>(null);',
  'const [receiptData, setReceiptData] = useState<any>(null);\n  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);'
);

code = code.replace(
  `      const [resSessions, resPackages, resMenu] = await Promise.all([
        fetch('/api/sessions'),
        fetch('/api/packages'),
        fetch('/api/menu')
      ]);`,
  `      const [resSessions, resPackages, resMenu, resOrders] = await Promise.all([
        fetch('/api/sessions'),
        fetch('/api/packages'),
        fetch('/api/menu'),
        fetch('/api/orders?t=' + new Date().getTime())
      ]);`
);

code = code.replace(
  `      const dataMenu = await resMenu.json();`,
  `      const dataMenu = await resMenu.json();\n      const dataOrders = await resOrders.json();\n      setPendingOrdersCount(dataOrders.filter((o: any) => o.status === "PENDING").length);`
);

code = code.replace(
  `<button onClick={() => setActiveTab("orders")} className={\`w-full flex justify-between items-center px-4 py-3 rounded-xl transition-all duration-200 \${activeTab === "orders" ? "bg-emerald-600/20 text-emerald-500 font-bold border border-emerald-500/30" : "text-stone-400 hover:bg-white/5 hover:text-white"}\`}>
            Đơn pha chế
          </button>`,
  `<button onClick={() => setActiveTab("orders")} className={\`w-full flex justify-between items-center px-4 py-3 rounded-xl transition-all duration-200 \${activeTab === "orders" ? "bg-emerald-600/20 text-emerald-500 font-bold border border-emerald-500/30" : "text-stone-400 hover:bg-white/5 hover:text-white"}\`}>
            <span>Đơn pha chế</span>
            {pendingOrdersCount > 0 && (
              <span className="bg-amber-500 text-stone-900 text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                {pendingOrdersCount}
              </span>
            )}
          </button>`
);

fs.writeFileSync('src/app/page.tsx', code);
console.log("Done");
