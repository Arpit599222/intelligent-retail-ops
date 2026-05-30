import React, { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Package, Search, ArrowUpDown, ChevronDown, Eye, TrendingUp, AlertTriangle, BarChart3 } from "lucide-react";

export default function AdminInventory() {
  const inventory = useAppStore((state) => state.inventory);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredItems = inventory.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalUnits = inventory.reduce((sum, item) => sum + item.quantity, 0);
  const lowStockItems = inventory.filter(i => i.quantity < 300);

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Global Inventory Overview</h1>
          <p className="text-muted text-sm mt-1">Read-only monitoring view. Stock adjustments are managed at the store level by Store Managers.</p>
        </div>
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3 py-1.5 rounded-lg text-xs font-semibold">
          <Eye className="w-3.5 h-3.5" />
          Monitoring Mode
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-surface border border-border p-5 rounded-xl shadow-sm">
          <div className="text-xs text-muted uppercase font-bold tracking-wider mb-2">Total Managed SKUs</div>
          <div className="text-3xl font-mono font-bold text-foreground">{inventory.length}</div>
        </div>
        <div className="bg-surface border border-border p-5 rounded-xl shadow-sm">
          <div className="text-xs text-muted uppercase font-bold tracking-wider mb-2">Total In-Stock Units</div>
          <div className="text-3xl font-mono font-bold text-foreground">
            {totalUnits.toLocaleString()}
          </div>
        </div>
        <div className="bg-surface border border-border p-5 rounded-xl shadow-sm">
          <div className="text-xs text-muted uppercase font-bold tracking-wider mb-2">Storage Utilization</div>
          <div className="text-3xl font-mono font-bold text-foreground">68.4%</div>
        </div>
        <div className={`bg-surface border p-5 rounded-xl shadow-sm ${lowStockItems.length > 0 ? "border-danger/30" : "border-border"}`}>
          <div className="text-xs text-muted uppercase font-bold tracking-wider mb-2 flex items-center gap-1.5">
            {lowStockItems.length > 0 && <AlertTriangle className="w-3 h-3 text-danger" />}
            Low Stock Alerts
          </div>
          <div className={`text-3xl font-mono font-bold ${lowStockItems.length > 0 ? "text-danger" : "text-success"}`}>
            {lowStockItems.length}
          </div>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl shadow-lg overflow-hidden">
        {/* Search Header */}
        <div className="px-5 py-4 border-b border-border bg-surface-hover/30 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input 
              type="text" 
              placeholder="Filter by SKU or Name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-background border border-border rounded-lg text-sm pl-9 pr-3 py-2 text-foreground focus:outline-none focus:border-brand-500"
            />
          </div>
          <div className="flex gap-2">
            <button className="bg-background border border-border px-3 py-2 rounded-lg text-xs font-semibold text-foreground hover:bg-surface-hover flex items-center">
              <ArrowUpDown className="w-3.5 h-3.5 mr-2" /> Sort
            </button>
            <button className="bg-background border border-border px-3 py-2 rounded-lg text-xs font-semibold text-foreground hover:bg-surface-hover flex items-center">
              <ChevronDown className="w-3.5 h-3.5 mr-2" /> Location
            </button>
          </div>
        </div>

        {/* Ledger Table - Read Only */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface-hover/10 text-xs font-bold text-muted uppercase tracking-wider">
                <th className="p-4">SKU Code</th>
                <th className="p-4">Product Name</th>
                <th className="p-4">Warehouse Location</th>
                <th className="p-4">Available Qty</th>
                <th className="p-4 text-right">Stock Health</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {filteredItems.map((item) => (
                <tr key={item.sku} className="hover:bg-surface-hover/20 transition-colors">
                  <td className="p-4 font-mono font-bold text-foreground">{item.sku}</td>
                  <td className="p-4 font-medium text-foreground">{item.name}</td>
                  <td className="p-4 text-muted">{item.location}</td>
                  <td className="p-4 font-mono font-bold">
                    <span className={item.quantity < 300 ? "text-danger" : "text-foreground"}>
                      {item.quantity.toLocaleString()}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {item.quantity < 300 ? (
                      <span className="inline-flex items-center gap-1.5 bg-danger/10 border border-danger/20 text-danger px-2.5 py-1 rounded-full text-xs font-bold">
                        <AlertTriangle className="w-3 h-3" /> Critical
                      </span>
                    ) : item.quantity < 1000 ? (
                      <span className="inline-flex items-center gap-1.5 bg-warning/10 border border-warning/20 text-warning px-2.5 py-1 rounded-full text-xs font-bold">
                        <TrendingUp className="w-3 h-3" /> Low
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 bg-success/10 border border-success/20 text-success px-2.5 py-1 rounded-full text-xs font-bold">
                        <BarChart3 className="w-3 h-3" /> Healthy
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted italic">No inventory matching search terms found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
