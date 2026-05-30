import React, { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Package, Search, Plus, ArrowUpDown, ChevronDown, CheckCircle, AlertTriangle, X } from "lucide-react";

export default function ManagerInventory() {
  const inventory = useAppStore((state) => state.inventory);
  const user = useAppStore((state) => state.user);
  const addToast = useAppStore((state) => state.addToast);
  const addLog = useAppStore((state) => state.addLog);
  const fetchInventory = useAppStore((state) => state.fetchInventory);
  const addInventoryItem = useAppStore((state) => state.addInventoryItem);
  const restockInventoryItem = useAppStore((state) => state.restockInventoryItem);

  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSku, setNewSku] = useState("");
  const [newName, setNewName] = useState("");
  const [newQty, setNewQty] = useState("");
  const [newLocation, setNewLocation] = useState("");

  const activeStoreId = user?.storeId || "ST-003";
  const activeStoreName = user?.storeName || "LA Mega Store";

  React.useEffect(() => {
    fetchInventory(activeStoreId);
  }, [fetchInventory, activeStoreId]);

  const handleRestock = async (sku: string, name: string) => {
    const res = await restockInventoryItem({
      sku,
      storeId: activeStoreId,
      quantity: 500
    });
    if (res.success) {
      addToast(`Restocked 500 units for ${name}`, "success");
      addLog(`[${activeStoreName}] Stock adjustment: +500 units for SKU ${sku}`, "success");
    }
  };

  const handleAddItem = async () => {
    if (!newSku || !newName || !newQty) {
      addToast("Fill in all required fields", "error");
      return;
    }

    // Client-side Sanitization & Whitelisting
    const skuClean = newSku.trim().toUpperCase();
    const skuRegex = /^[A-Z0-9\-]{3,30}$/;
    if (!skuRegex.test(skuClean)) {
      addToast("SKU must be 3-30 alphanumeric characters or hyphens.", "warning");
      return;
    }

    const nameClean = newName.replace(/[^\w\s\-\'\(\)\:\.\,]/g, '').trim();
    if (!nameClean || nameClean.length < 2 || nameClean.length > 100) {
      addToast("Product Name is too short or contains invalid characters.", "warning");
      return;
    }

    const qtyVal = parseInt(newQty, 10);
    if (isNaN(qtyVal) || qtyVal < 0) {
      addToast("Initial quantity must be a non-negative integer.", "warning");
      return;
    }

    const locationClean = newLocation.replace(/[^\w\s\-\'\(\)\:\.\,]/g, '').trim();

    const res = await addInventoryItem({
      sku: skuClean,
      name: nameClean,
      quantity: qtyVal,
      storeId: activeStoreId,
      location: locationClean || "Unassigned"
    });

    if (res.success) {
      addToast(`Added ${nameClean} (${skuClean}) to inventory`, "success");
      addLog(`[${activeStoreName}] New SKU registered: ${skuClean} — ${nameClean}`, "success");
      setShowAddModal(false);
      setNewSku(""); setNewName(""); setNewQty(""); setNewLocation("");
    }
  };

  const filteredItems = inventory.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalUnits = inventory.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Store Inventory Management</h1>
          <p className="text-muted text-sm mt-1">{activeStoreName} ({activeStoreId}) — Full stock control</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer shadow-md"
        >
          <Plus className="w-4 h-4" /> Add New SKU
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface border border-border p-5 rounded-xl shadow-sm">
          <div className="text-xs text-muted uppercase font-bold tracking-wider mb-2">Store SKUs</div>
          <div className="text-3xl font-mono font-bold text-foreground">{inventory.length}</div>
        </div>
        <div className="bg-surface border border-border p-5 rounded-xl shadow-sm">
          <div className="text-xs text-muted uppercase font-bold tracking-wider mb-2">Total In-Stock Units</div>
          <div className="text-3xl font-mono font-bold text-foreground">
            {totalUnits.toLocaleString()}
          </div>
        </div>
        <div className="bg-surface border border-border p-5 rounded-xl shadow-sm">
          <div className="text-xs text-muted uppercase font-bold tracking-wider mb-2">Low Stock Alerts</div>
          <div className={`text-3xl font-mono font-bold ${inventory.filter(i => i.quantity < 300).length > 0 ? "text-danger" : "text-success"}`}>
            {inventory.filter(i => i.quantity < 300).length}
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

        {/* Inventory Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface-hover/10 text-xs font-bold text-muted uppercase tracking-wider">
                <th className="p-4">SKU Code</th>
                <th className="p-4">Product Name</th>
                <th className="p-4">Storage Location</th>
                <th className="p-4">Available Qty</th>
                <th className="p-4 text-right">Stock Actions</th>
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
                    {item.quantity < 300 && (
                      <AlertTriangle className="w-3.5 h-3.5 text-danger inline ml-2" />
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => handleRestock(item.sku, item.name)}
                      className="bg-brand-600/10 border border-brand-500/30 hover:bg-brand-600 hover:text-white text-brand-500 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-end ml-auto cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1 animate-pulse" /> Restock (+500)
                    </button>
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

      {/* Add SKU Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-xl shadow-2xl w-full max-w-md">
            <div className="px-5 py-4 border-b border-border flex justify-between items-center">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Package className="w-4 h-4 text-brand-500" />
                Register New SKU
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-muted hover:text-foreground cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1.5">SKU Code *</label>
                <input 
                  type="text" value={newSku} onChange={e => setNewSku(e.target.value)}
                  placeholder="e.g. SKU-5502"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-brand-500 font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1.5">Product Name *</label>
                <input 
                  type="text" value={newName} onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. Bubble Wrap Roll (12in)"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-brand-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1.5">Initial Quantity *</label>
                  <input 
                    type="number" value={newQty} onChange={e => setNewQty(e.target.value)}
                    placeholder="0"
                    className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-brand-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-1.5">Storage Location</label>
                  <input 
                    type="text" value={newLocation} onChange={e => setNewLocation(e.target.value)}
                    placeholder="e.g. Aisle 8, Shelf D"
                    className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-border flex justify-end gap-3">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-xs font-semibold text-muted hover:text-foreground cursor-pointer">
                Cancel
              </button>
              <button 
                onClick={handleAddItem}
                className="bg-brand-600 hover:bg-brand-500 text-white px-5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-2"
              >
                <CheckCircle className="w-3.5 h-3.5" /> Register SKU
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
