import React, { useState, useEffect, Suspense } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Search, User, Clock, Navigation, CheckCircle } from "lucide-react";

const LiveMap = React.lazy(
  () => import("@/components/tracking/LiveMap").then((mod) => ({ default: mod.LiveMap }))
);

export default function ManagerTransfers() {
  const transfers = useAppStore((state) => state.transfers);
  const updateTransferStatus = useAppStore((state) => state.updateTransferStatus);
  const user = useAppStore((state) => state.user);

  // Filter tasks to match the manager's store (LA Mega ST-003)
  const storeTasks = transfers.filter(t => t.storeId === (user?.storeId || "ST-003"));
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Auto-select first task if none selected
  useEffect(() => {
    if (storeTasks.length > 0 && !selectedTaskId) {
      setSelectedTaskId(storeTasks[0].id);
    }
  }, [storeTasks, selectedTaskId]);

  const activeTask = storeTasks.find(t => t.id === selectedTaskId);

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto h-[calc(100vh-100px)]">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Inbound & Outbound Deliveries</h1>
        <p className="text-muted text-sm mt-1">Real-time GPS coordination for store stock transfers and worker route tracking.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        {/* LEFT: Deliveries List */}
        <div className="flex-1 lg:max-w-md flex flex-col bg-surface border border-border rounded-xl shadow-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-surface-hover/50 flex justify-between items-center shrink-0">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Active Store Transfers</h2>
            <span className="text-xs bg-brand-600 text-white font-mono font-bold px-2 py-0.5 rounded-full">
              {storeTasks.length}
            </span>
          </div>

          <div className="p-2 border-b border-border shrink-0">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input 
                type="text" 
                placeholder="Search ID or worker..." 
                className="w-full bg-background border border-border rounded-lg text-xs pl-9 pr-3 py-2 text-foreground focus:outline-none focus:border-brand-500" 
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {storeTasks.length === 0 ? (
              <div className="text-center text-muted text-xs py-10">No transfers linked to this store.</div>
            ) : (
              storeTasks.map(task => (
                <div 
                  key={task.id} 
                  onClick={() => setSelectedTaskId(task.id)}
                  className={`cursor-pointer border rounded-lg p-3 transition-all ${
                    selectedTaskId === task.id ? 'bg-brand-600/10 border-brand-500/50 shadow-md' : 'bg-background border-border hover:bg-surface-hover/30'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-mono font-bold text-foreground text-xs">{task.id}</div>
                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                      task.status === 'COMPLETED' || task.status === 'VERIFIED' ? 'bg-success/15 text-success border border-success/20' :
                      task.status === 'DELAYED' ? 'bg-danger/15 text-danger border-danger/20' :
                      'bg-warning/15 text-warning border-warning/20'
                    }`}>
                      {task.status}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-end text-xs text-muted">
                    <div>
                      <span className="block text-foreground text-xs font-semibold mb-0.5"><User className="w-3.5 h-3.5 inline mr-1 text-muted" />{task.workerName || "Unassigned"}</span>
                      <span>{task.cartons} Cartons</span>
                    </div>
                    {task.status === "IN_TRANSIT" && (
                      <span className="text-brand-500 font-mono font-bold flex items-center gap-1 animate-pulse">
                        <Clock className="w-3.5 h-3.5" /> {task.eta}m ETA
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT: Live Tracking Map */}
        <div className="flex-[2] flex flex-col bg-surface border border-border rounded-xl shadow-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-surface-hover/30 flex justify-between items-center shrink-0">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Navigation className="w-4 h-4 text-brand-500" />
              Live Route Monitor: {activeTask?.id || "N/A"}
            </h2>
            {activeTask?.status === "DELIVERED" && (
              <button 
                onClick={() => updateTransferStatus(activeTask.id, "COMPLETED")}
                className="bg-success-bg border border-success/30 hover:bg-success hover:text-white text-success px-3 py-1 rounded text-xs font-bold transition-all flex items-center cursor-pointer"
              >
                <CheckCircle className="w-3.5 h-3.5 mr-1" /> Verify & Complete Delivery
              </button>
            )}
          </div>
          
          <div className="flex-1 relative z-10">
            {selectedTaskId ? (
              <Suspense fallback={
                <div className="w-full h-full bg-[#111113] flex items-center justify-center text-xs text-muted font-mono tracking-wider uppercase animate-pulse">
                  Initializing Map Module...
                </div>
              }>
                <LiveMap taskId={selectedTaskId} className="w-full h-full border-0 rounded-none" />
              </Suspense>
            ) : (
              <div className="w-full h-full bg-[#111113] flex items-center justify-center text-muted text-xs">
                No active delivery selected.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
