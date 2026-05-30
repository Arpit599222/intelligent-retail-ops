import React, { useState } from "react";
import { useAppStore, WorkerStatus } from "@/store/useAppStore";
import AttendanceCard from "@/components/AttendanceCard";
import { 
  Package, 
  Power, 
  Lock as LockIcon, 
  Unlock, 
  Activity,
  AlertCircle,
  Truck,
  Layers,
  ShieldCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function WarehouseStaffDashboard() {
  const user = useAppStore((state) => state.user);
  const clockIn = useAppStore((state) => state.clockIn);
  const clockOut = useAppStore((state) => state.clockOut);
  const addToast = useAppStore((state) => state.addToast);
  const addLog = useAppStore((state) => state.addLog);

  const isClockedIn = user?.status && user.status !== "OFFLINE";
  const workerStatus = user?.status || "OFFLINE";

  // Trailer door checklists
  const [checklist, setChecklist] = useState([
    { id: "W1", text: "Verify trailer tire blocks are placed", done: false },
    { id: "W2", text: "Cross-check loading dock trailer seal code", done: false },
    { id: "W3", text: "Run inspection on pallet jack battery charge", done: false },
    { id: "W4", text: "Scan door 4 outbound shipping manifest", done: false }
  ]);

  const handleShiftToggle = () => {
    if (!user?.workerId) return;
    if (isClockedIn) {
      clockOut(user.workerId);
    } else {
      clockIn(user.workerId);
    }
  };

  const toggleCheckItem = (id: string) => {
    if (!isClockedIn) return;
    setChecklist(prev => 
      prev.map(item => item.id === id ? { ...item, done: !item.done } : item)
    );
    const item = checklist.find(i => i.id === id);
    if (item) {
      addToast(`Checked: ${item.text}`, "info");
      addLog(`Safety Audit: Personnel ${user?.name} checked duty item [${item.text}]`, "info");
    }
  };

  const getStatusBadgeConfig = (status: WorkerStatus) => {
    switch (status) {
      case "ONLINE":
        return { bg: "bg-success-bg border-success/20 text-success animate-pulse", label: "Clocked In • Standby" };
      case "BUSY":
        return { bg: "bg-amber-500/10 border-amber-500/20 text-amber-400", label: "Loading Trailer" };
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
            <h1 className="text-xl font-bold text-foreground">Warehouse Staff Panel</h1>
            <p className="text-muted text-xs mt-0.5">Personnel: {user?.name || "David W."} • Hub: {user?.storeName || "LA Mega"}</p>
          </div>
          <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider border ${badge.bg}`}>
            {badge.label}
          </span>
        </div>

        {/* Safety Form Box */}
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
                  <LockIcon className="w-6 h-6 animate-bounce" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-1">Shift Offline</h3>
                <p className="text-xs text-muted max-w-xs mb-6">
                  Loading Dock manifests are locked. Clock In to initiate trailer loading sequences.
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
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground">Trailer Dock Checklist</h2>
                <span className="text-[10px] text-muted uppercase tracking-wider font-bold">Standard Safety Manifest</span>
              </div>
            </div>
          </div>

          {/* Checklist Items */}
          <div className="p-5 flex-1 space-y-3 overflow-y-auto">
            {checklist.map((item) => (
              <label 
                key={item.id} 
                className="flex items-start text-xs text-zinc-400 gap-3 cursor-pointer p-3 bg-background border border-border rounded-lg hover:border-brand-500/30 transition-colors"
                onClick={() => toggleCheckItem(item.id)}
              >
                <input 
                  type="checkbox" 
                  checked={item.done} 
                  readOnly 
                  className="rounded border-zinc-800 bg-[#0a0a0b] text-brand-500 focus:ring-brand-500 pointer-events-none mt-0.5" 
                />
                <span className={item.done ? "line-through text-zinc-600" : "text-foreground font-semibold"}>
                  {item.text}
                </span>
              </label>
            ))}

            <div className="flex items-center text-[10px] text-warning bg-warning-bg border border-warning/15 p-3 rounded-lg mt-4">
              <AlertCircle className="w-4 h-4 mr-2 text-warning shrink-0" />
              <span>Trailer doors must remain closed until tire blocks are verified.</span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: Live Dock Doors Ledger */}
      <div className="flex-1 flex flex-col bg-surface border border-border rounded-xl overflow-hidden shadow-lg">
        <div className="px-4 py-3 border-b border-border bg-surface flex justify-between items-center shrink-0">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-wider">
            <Layers className="w-4 h-4 text-brand-500 animate-pulse" />
            Active Dock Loading Bays
          </h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-background border border-border p-5 rounded-xl flex flex-col justify-between h-48">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-mono font-bold text-brand-400">BAY DOOR 1</span>
                  <span className="text-[10px] bg-success-bg border border-success/15 text-success px-2 py-0.5 rounded font-bold">
                    CONNECTED
                  </span>
                </div>
                <h3 className="font-bold text-base text-foreground">Inbound Trailer TRX-9042</h3>
                <p className="text-xs text-muted mt-1">110 cartons of stretch wrap rolls.</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted">
                <Truck className="w-4 h-4 text-brand-500" />
                <span>Trailer unloaded at Outbound Door 4</span>
              </div>
            </div>

            <div className="bg-background border border-border p-5 rounded-xl flex flex-col justify-between h-48">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-mono font-bold text-brand-400">BAY DOOR 4</span>
                  <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-bold">
                    LOADING ACTIVE
                  </span>
                </div>
                <h3 className="font-bold text-base text-foreground">Outbound Replenish TRX-8821</h3>
                <p className="text-xs text-muted mt-1">42 cartons packaging materials.</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted">
                <Package className="w-4 h-4 text-amber-500" />
                <span>Trailer seal locked & cleared</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
