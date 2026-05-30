import React, { Suspense } from "react";
import { useAppStore, TransferTask, TransferStatus, WorkerStatus } from "@/store/useAppStore";
import { 
  MapPin, 
  Package, 
  ArrowRight, 
  Clock, 
  CheckSquare, 
  Truck, 
  Power, 
  Lock as LockIcon, 
  Unlock, 
  Activity,
  AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const LiveMap = React.lazy(
  () => import("@/components/tracking/LiveMap").then((mod) => ({ default: mod.LiveMap }))
);

export default function DeliveryStaffDashboard() {
  const transfers = useAppStore((state) => state.transfers);
  const updateTransferStatus = useAppStore((state) => state.updateTransferStatus);
  const user = useAppStore((state) => state.user);
  const clockIn = useAppStore((state) => state.clockIn);
  const clockOut = useAppStore((state) => state.clockOut);
  
  // Find task assigned to this worker
  const task = transfers.find(t => t.workerId === user?.workerId);
  const isClockedIn = user?.status && user.status !== "OFFLINE";
  const workerStatus = user?.status || "OFFLINE";

  const handleShiftToggle = () => {
    if (!user?.workerId) return;
    if (isClockedIn) {
      clockOut(user.workerId);
    } else {
      clockIn(user.workerId);
    }
  };

  const getStatusBadgeConfig = (status: WorkerStatus) => {
    switch (status) {
      case "ONLINE":
        return { bg: "bg-success-bg border-success/20 text-success animate-pulse", label: "Clocked In • Ready" };
      case "BUSY":
        return { bg: "bg-amber-500/10 border-amber-500/20 text-amber-400", label: "On Task • Preparing" };
      case "ON_DELIVERY":
        return { bg: "bg-blue-500/10 border-blue-500/20 text-blue-400 animate-pulse", label: "On Route • Transit" };
      case "OFFLINE":
      default:
        return { bg: "bg-red-500/10 border-red-500/20 text-red-400", label: "Clocked Out • Standby" };
    }
  };

  const badge = getStatusBadgeConfig(workerStatus);

  const renderActionButtons = (task: TransferTask) => {
    if (!isClockedIn) {
      return (
        <button 
          disabled 
          className="w-full bg-zinc-800 border border-zinc-700 text-zinc-500 py-3.5 rounded-lg font-bold text-sm flex items-center justify-center opacity-50 cursor-not-allowed"
        >
          <LockIcon className="w-4 h-4 mr-2" /> Shift Offline
        </button>
      );
    }

    switch (task.status) {
      case "APPROVED":
        return (
          <button 
            onClick={() => updateTransferStatus(task.id, "PICKED_UP")} 
            className="w-full bg-brand-600 hover:bg-brand-500 text-white py-3.5 rounded-lg font-bold text-sm transition-colors flex items-center justify-center shadow-md cursor-pointer"
          >
            <Package className="w-4 h-4 mr-2" /> Commence Picking & Load Cartons
          </button>
        );
      case "PICKED_UP":
        return (
          <button 
            onClick={() => updateTransferStatus(task.id, "IN_TRANSIT")} 
            className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-900 py-3.5 rounded-lg font-bold text-sm transition-colors flex items-center justify-center shadow-md cursor-pointer"
          >
            <Truck className="w-4 h-4 mr-2" /> Depart Warehouse & Start Transit
          </button>
        );
      case "IN_TRANSIT":
        return (
          <button disabled className="w-full bg-surface-hover text-muted py-3.5 rounded-lg font-bold text-sm flex items-center justify-center opacity-60 animate-pulse">
            <Truck className="w-4 h-4 mr-2 animate-bounce" /> Transit Active (Simulated GPS Moving...)
          </button>
        );
      case "DELIVERED":
        return (
          <button 
            onClick={() => updateTransferStatus(task.id, "COMPLETED")} 
            className="w-full bg-success hover:bg-emerald-400 text-white py-3.5 rounded-lg font-bold text-sm transition-colors flex items-center justify-center shadow-md cursor-pointer"
          >
            <CheckSquare className="w-4 h-4 mr-2" /> Confirm Delivery & Complete Task
          </button>
        );
      case "COMPLETED":
        return (
          <div className="w-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 py-3.5 rounded-lg text-center font-bold text-sm uppercase tracking-wider font-mono">
            ✓ Task Completed Successfully
          </div>
        );
      default:
        return (
          <button 
            onClick={() => updateTransferStatus(task.id, "APPROVED")} 
            className="w-full bg-brand-600 hover:bg-brand-500 text-white py-3.5 rounded-lg font-bold text-sm transition-colors flex items-center justify-center shadow-md cursor-pointer"
          >
            Reset Task to Approved (Demo)
          </button>
        );
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-[1500px] mx-auto h-[calc(100vh-100px)]">
      
      {/* LEFT: Task Info */}
      <div className="w-full lg:w-[420px] flex flex-col gap-4">
        
        {/* Attendance Controls */}
        <div className="bg-surface border border-border rounded-xl p-4 shadow-md flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isClockedIn ? "bg-success/10" : "bg-red-500/10"}`}>
              <Power className={`w-4 h-4 ${isClockedIn ? "text-success" : "text-red-400"}`} />
            </div>
            <div>
              <div className="text-[10px] font-bold text-muted uppercase tracking-wider">Shift Attendance</div>
              <div className="text-sm font-bold text-foreground">
                {isClockedIn ? "Active Duty" : "Shift Inactive"}
              </div>
            </div>
          </div>
          
          <button
            onClick={handleShiftToggle}
            className={`px-4 py-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${
              isClockedIn 
                ? "bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-muted" 
                : "bg-success-bg border border-success/30 hover:bg-success text-success hover:text-white"
            }`}
          >
            {isClockedIn ? "Clock Out" : "Clock In"}
          </button>
        </div>

        <div className="flex justify-between items-center shrink-0">
          <div>
            <h1 className="text-xl font-bold text-foreground">Delivery Staff Panel</h1>
            <p className="text-muted text-xs mt-0.5">Personnel: {user?.name || "Alex M."} • Role: {user?.designation || "Delivery Staff"}</p>
          </div>
          <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider border ${badge.bg}`}>
            {badge.label}
          </span>
        </div>

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
                  Logistics manifest data is locked. You must **Clock In** above to decrypt dispatch records and commence workflow operations.
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

          {task ? (
            <>
              {/* Header */}
              <div className="bg-surface-hover/80 px-5 py-4 border-b border-border flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-brand-600 rounded flex items-center justify-center shrink-0">
                    <Package className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-base font-mono font-bold text-foreground">{task.id}</h2>
                    <span className="text-[10px] text-muted uppercase tracking-wider font-bold">Inter-Store Replenishment</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-mono font-bold text-foreground">{task.cartons}</div>
                  <div className="text-[9px] text-muted uppercase font-semibold">Cartons</div>
                </div>
              </div>

              {/* Details */}
              <div className="p-5 flex-1 space-y-5 overflow-y-auto">
                <div className="relative">
                  <div className="absolute left-3.5 top-4 bottom-4 w-px bg-border"></div>
                  
                  {/* Origin */}
                  <div className="flex items-start gap-4 mb-5 relative z-10">
                    <div className="w-7 h-7 rounded-full bg-[#0a0a0b] border-2 border-brand-500 flex items-center justify-center shrink-0">
                      <MapPin className="w-3.5 h-3.5 text-brand-500" />
                    </div>
                    <div className="bg-background border border-border rounded-lg p-3.5 flex-1">
                      <div className="text-[9px] font-bold text-brand-500 uppercase tracking-wider mb-1">Pickup Storage Location</div>
                      <div className="text-foreground font-semibold text-sm mb-0.5">Aisle 14, Rack B2</div>
                      <div className="text-xs text-muted">{task.storeName || "LA Mega"} Hub</div>
                    </div>
                  </div>

                  {/* Destination */}
                  <div className="flex items-start gap-4 relative z-10">
                    <div className="w-7 h-7 rounded-full bg-[#0a0a0b] border-2 border-border flex items-center justify-center shrink-0">
                      <ArrowRight className="w-3.5 h-3.5 text-muted" />
                    </div>
                    <div className="bg-background border border-border rounded-lg p-3.5 flex-1">
                      <div className="text-[9px] font-bold text-muted uppercase tracking-wider mb-1">Target Storage Bay</div>
                      <div className="text-foreground font-semibold text-sm mb-0.5">Outbound Dock Door 4</div>
                      <div className="text-xs text-muted">Staging Area Repackaging</div>
                    </div>
                  </div>
                </div>

                {/* Checklist of duties */}
                <div className="p-4 bg-background/50 border border-border rounded-lg">
                  <span className="font-bold text-[10px] text-zinc-400 uppercase tracking-wider block mb-3">Duties Checklist</span>
                  <div className="space-y-2.5">
                    <label className="flex items-center text-xs text-zinc-400 gap-2.5 cursor-pointer">
                      <input type="checkbox" checked={task.status !== "APPROVED"} readOnly className="rounded border-zinc-800 bg-[#0a0a0b] text-brand-500 focus:ring-brand-500 pointer-events-none" />
                      <span className={task.status !== "APPROVED" ? "line-through text-zinc-600" : ""}>Scan barcodes & locate {task.cartons} cartons (Aisle 14)</span>
                    </label>
                    <label className="flex items-center text-xs text-zinc-400 gap-2.5 cursor-pointer">
                      <input type="checkbox" checked={task.status !== "APPROVED"} readOnly className="rounded border-zinc-800 bg-[#0a0a0b] text-brand-500 focus:ring-brand-500 pointer-events-none" />
                      <span className={task.status !== "APPROVED" ? "line-through text-zinc-600" : ""}>Verify trailer cargo distribution & weight limits</span>
                    </label>
                    <label className="flex items-center text-xs text-zinc-400 gap-2.5 cursor-pointer">
                      <input type="checkbox" checked={task.status === "IN_TRANSIT" || task.status === "DELIVERED" || task.status === "COMPLETED"} readOnly className="rounded border-zinc-800 bg-[#0a0a0b] text-brand-500 focus:ring-brand-500 pointer-events-none" />
                      <span className={(task.status === "IN_TRANSIT" || task.status === "DELIVERED" || task.status === "COMPLETED") ? "line-through text-zinc-600" : ""}>Secure logistics trailer doors & document manifest</span>
                    </label>
                    <label className="flex items-center text-xs text-zinc-400 gap-2.5 cursor-pointer">
                      <input type="checkbox" checked={task.status === "COMPLETED"} readOnly className="rounded border-zinc-800 bg-[#0a0a0b] text-brand-500 focus:ring-brand-500 pointer-events-none" />
                      <span className={task.status === "COMPLETED" ? "line-through text-zinc-600" : ""}>Deliver & unload cartons to storage bay Outbound Door 4</span>
                    </label>
                  </div>
                </div>
                
                <div className="flex items-center text-xs text-warning bg-warning-bg border border-warning/15 p-3.5 rounded-lg font-mono">
                  <Clock className="w-4 h-4 mr-2" />
                  ESTIMATED TRANSIT TIME: {task.eta} MIN
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 bg-surface-hover/30 border-t border-border shrink-0">
                {renderActionButtons(task)}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 flex-1 text-center text-muted">
              <Package className="w-12 h-12 mb-3 opacity-30" />
              <div className="font-bold text-foreground text-sm mb-1">Roster Standby Active</div>
              <p className="text-xs max-w-[250px] mb-4">No active dispatch orders assigned. Standard shift standby initialized.</p>
              
              <div className="flex items-center gap-2 p-3 bg-brand-500/5 border border-brand-500/10 rounded-lg text-[11px] text-brand-400 font-mono w-full max-w-xs text-left">
                <Activity className="w-3.5 h-3.5 text-brand-500 shrink-0 animate-pulse" />
                <span>Pinging HQ for replenishment routes...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Live Map */}
      <div className="flex-1 flex flex-col bg-surface border border-border rounded-xl overflow-hidden shadow-lg">
        <div className="px-4 py-3 border-b border-border bg-surface flex justify-between items-center z-20 shrink-0">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-wider">
            <Clock className="w-4 h-4 text-brand-500 animate-pulse" />
            Live Dispatch Route
          </h2>
        </div>
        <div className="flex-1 relative z-10">
          {task ? (
            <Suspense fallback={
              <div className="w-full h-full bg-[#111113] flex items-center justify-center text-xs text-muted font-mono tracking-wider uppercase animate-pulse">
                Initializing Map Module...
              </div>
            }>
              <LiveMap taskId={task.id} className="w-full h-full border-0 rounded-none" />
            </Suspense>
          ) : (
            <div className="w-full h-full bg-[#0d0d0f] flex flex-col items-center justify-center text-muted gap-2 text-xs font-mono">
              <AlertTriangle className="w-5 h-5 text-zinc-600 animate-pulse" />
              <span>WAITING ON VEHICLE GPS ASSIGNMENT</span>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
