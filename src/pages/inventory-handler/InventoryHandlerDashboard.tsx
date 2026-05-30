import React, { useState } from "react";
import { useAppStore, WorkerStatus } from "@/store/useAppStore";
import AttendanceCard from "@/components/AttendanceCard";
import { 
  Clock, 
  Power, 
  Lock as LockIcon, 
  Unlock, 
  Activity,
  ClipboardList,
  ScanBarcode,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function InventoryHandlerDashboard() {
  const user = useAppStore((state) => state.user);
  const inventory = useAppStore((state) => state.inventory);
  const clockIn = useAppStore((state) => state.clockIn);
  const clockOut = useAppStore((state) => state.clockOut);
  const addToast = useAppStore((state) => state.addToast);
  const addLog = useAppStore((state) => state.addLog);
  const fetchInventory = useAppStore((state) => state.fetchInventory);
  const updateInventoryQuantity = useAppStore((state) => state.updateInventoryQuantity);

  const isClockedIn = user?.status && user.status !== "OFFLINE";
  const workerStatus = user?.status || "OFFLINE";

  const activeStoreId = user?.storeId || "ST-003";

  React.useEffect(() => {
    fetchInventory(activeStoreId);
  }, [fetchInventory, activeStoreId]);

  // Form states for carton audits
  const [selectedSku, setSelectedSku] = useState("");
  const [auditQty, setAuditQty] = useState("");
  const [isAuditing, setIsAuditing] = useState(false);

  React.useEffect(() => {
    if (inventory.length > 0 && !selectedSku) {
      setSelectedSku(inventory[0].sku);
    }
  }, [inventory, selectedSku]);

  const handleShiftToggle = () => {
    if (!user?.workerId) return;
    if (isClockedIn) {
      clockOut(user.workerId);
    } else {
      clockIn(user.workerId);
    }
  };

  const handleAuditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSku || !auditQty) return;

    // Validate audited qty format (non-negative integer)
    const qtyVal = parseInt(auditQty, 10);
    if (isNaN(qtyVal) || qtyVal < 0) {
      addToast("Audited quantity must be a non-negative integer.", "warning");
      return;
    }

    setIsAuditing(true);
    const item = inventory.find(i => i.sku === selectedSku);
    if (item) {
      const res = await updateInventoryQuantity({
        sku: selectedSku,
        storeId: activeStoreId,
        quantity: qtyVal
      });

      if (res.success) {
        addToast(`Inventory SKU audit completed for ${item.name}`, "success");
        addLog(`Roster Audit: Personnel ${user?.name} checked SKU ${selectedSku} [Qty: ${qtyVal}]`, "success");
        setAuditQty("");
      }
    }
    setIsAuditing(false);
  };

  const getStatusBadgeConfig = (status: WorkerStatus) => {
    switch (status) {
      case "ONLINE":
        return { bg: "bg-success-bg border-success/20 text-success animate-pulse", label: "Clocked In • Active" };
      case "BUSY":
        return { bg: "bg-amber-500/10 border-amber-500/20 text-amber-400", label: "Auditing Bay" };
      case "OFFLINE":
      default:
        return { bg: "bg-red-500/10 border-red-500/20 text-red-400", label: "Clocked Out • Standby" };
    }
  };

  const badge = getStatusBadgeConfig(workerStatus);

  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-[1500px] mx-auto h-[calc(100vh-100px)]">
      
      {/* LEFT: Task & Shift info */}
      <div className="w-full lg:w-[420px] flex flex-col gap-4">
        
        {/* Attendance Card Widget */}
        <AttendanceCard />

        <div className="flex justify-between items-center shrink-0">
          <div>
            <h1 className="text-xl font-bold text-foreground">Inventory Handler Panel</h1>
            <p className="text-muted text-xs mt-0.5">Personnel: {user?.name || "Rahul S."} • Hub: {user?.storeName || "LA Mega"}</p>
          </div>
          <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider border ${badge.bg}`}>
            {badge.label}
          </span>
        </div>

        {/* Audit Form Box */}
        <div className="bg-surface border border-border rounded-xl shadow-lg flex-1 flex flex-col overflow-hidden relative">
          
          {/* OFFLINE LOCK OVERLAY */}
          <AnimatePresence>
            {!isClockedIn && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-background/95 backdrop-blur-[4px] z-30 flex flex-col items-center justify-center p-6 text-center"
              >
                <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full flex items-center justify-center mb-4">
                  <LockIcon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-1">Shift Offline</h3>
                <p className="text-xs text-muted max-w-xs mb-6">
                  Access to carton ledgers is locked. Clock In to initiate stock barcode verification pipelines.
                </p>
                <button
                  onClick={handleShiftToggle}
                  className="bg-brand-600 hover:bg-brand-500 text-white px-5 py-2.5 rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-2"
                >
                  <Unlock className="w-3.5 h-3.5" /> Clock In Shift
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Header */}
          <div className="bg-surface-hover/80 px-5 py-4 border-b border-border flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-brand-600 rounded flex items-center justify-center shrink-0">
                <ClipboardList className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground">Stock Barcode Verifier</h2>
                <span className="text-[10px] text-muted uppercase tracking-wider font-bold">Physical Audit Manifest</span>
              </div>
            </div>
          </div>

          {/* Details / Verification Flow */}
          <form onSubmit={handleAuditSubmit} className="p-5 flex-1 space-y-4 overflow-y-auto">
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">Select Physical Audit SKU</label>
              <select 
                value={selectedSku}
                onChange={(e) => setSelectedSku(e.target.value)}
                className="w-full bg-background border border-border rounded-lg text-xs px-3 py-2.5 text-foreground focus:outline-none focus:border-brand-500 cursor-pointer"
              >
                {inventory.map((item) => (
                  <option key={item.sku} value={item.sku}>{item.sku} - {item.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">Measured Box Quantity</label>
              <div className="relative">
                <ScanBarcode className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input 
                  required 
                  type="number"
                  value={auditQty}
                  onChange={(e) => setAuditQty(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg text-xs pl-9 pr-3 py-2.5 text-foreground focus:outline-none focus:border-brand-500" 
                  placeholder="e.g. 2450" 
                />
              </div>
            </div>

            <div className="flex items-center text-[11px] text-brand-400 bg-brand-500/5 border border-brand-500/10 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4 mr-2 text-brand-500 shrink-0" />
              <span>Verifying a physical audit will overwrite the global virtual carton registry count instantly.</span>
            </div>

            <button 
              type="submit"
              disabled={isAuditing}
              className="w-full bg-brand-600 hover:bg-brand-500 text-white py-3 rounded-lg font-bold text-xs transition-colors flex items-center justify-center shadow-md cursor-pointer"
            >
              {isAuditing ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" /> Log Checked Audit Count
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* RIGHT: Live Stock Directory Ledger */}
      <div className="flex-1 flex flex-col bg-surface border border-border rounded-xl overflow-hidden shadow-lg">
        <div className="px-4 py-3 border-b border-border bg-surface flex justify-between items-center shrink-0">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-wider">
            <Activity className="w-4 h-4 text-brand-500 animate-pulse" />
            Live Warehouse Inventory Ledgers
          </h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {inventory.map((item) => (
              <div key={item.sku} className="bg-background border border-border p-4 rounded-xl flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] text-brand-400 font-mono font-bold">{item.sku}</span>
                    <span className="text-[10px] bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded text-muted font-bold">
                      {item.location}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-foreground mb-3">{item.name}</h3>
                </div>
                
                <div className="flex justify-between items-end border-t border-border/50 pt-3 mt-3">
                  <div>
                    <span className="text-[9px] text-muted uppercase font-bold tracking-wider block">Virtual Stock</span>
                    <span className="text-2xl font-mono font-bold text-foreground">{item.quantity}</span>
                  </div>
                  <span className="text-[10px] text-success-bg border border-success/15 bg-success/5 px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1">
                    <div className="w-1 h-1 rounded-full bg-success" /> Synced
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
