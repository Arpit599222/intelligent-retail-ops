import { useState, useEffect, useRef, useCallback } from "react";
import { useAppStore, TransferTask } from "@/store/useAppStore";
import { 
  Package, ArrowRightLeft, Users, Truck, CheckSquare, MessageSquare,
  X, MapPin, Navigation, Clock, Radio, User, Zap, 
  ArrowRight, CircleDot, LocateFixed
} from "lucide-react";
import { Link } from "react-router-dom";
import AttendanceCard from "@/components/AttendanceCard";
import { AnalyticsView } from "@/components/dashboard/AnalyticsView";

// --- Tracking Simulation Component ---
function TrackingSimulation({ task, onClose }: { task: TransferTask; onClose: () => void }) {
  const [simStage, setSimStage] = useState(0);
  const [eta, setEta] = useState(task.eta);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const stages = [
    { label: "Preparing Pickup", status: "PREPARING", icon: Package, color: "text-amber-400", bgColor: "bg-amber-500/10 border-amber-500/20" },
    { label: "Reached Pickup Location", status: "AT_PICKUP", icon: MapPin, color: "text-blue-400", bgColor: "bg-blue-500/10 border-blue-500/20" },
    { label: "Loading Cartons", status: "LOADING", icon: Zap, color: "text-purple-400", bgColor: "bg-purple-500/10 border-purple-500/20" },
    { label: "In Transit", status: "IN_TRANSIT", icon: Truck, color: "text-brand-400", bgColor: "bg-brand-500/10 border-brand-500/20" },
    { label: "Approaching Destination", status: "APPROACHING", icon: Navigation, color: "text-cyan-400", bgColor: "bg-cyan-500/10 border-cyan-500/20" },
    { label: "Arrived — Unloading", status: "ARRIVED", icon: CheckSquare, color: "text-emerald-400", bgColor: "bg-emerald-500/10 border-emerald-500/20" },
  ];

  const locationLabels = [
    "Warehouse Dock Bay 2",
    "Aisle 14, Rack B2 — Pickup Zone",
    "Loading Zone — Gate 4",
    "Interstate 405 S — Mile 12",
    "Exit 42B — 0.8 mi from store",
    `${task.storeName} — Receiving Dock`,
  ];

  const advanceStage = useCallback(() => {
    setSimStage((prev) => {
      if (prev < stages.length - 1) return prev + 1;
      return prev;
    });
  }, [stages.length]);

  useEffect(() => {
    // Auto-advance simulation every 4 seconds
    intervalRef.current = setInterval(() => {
      setSimStage((prev) => {
        if (prev < stages.length - 1) {
          return prev + 1;
        }
        if (intervalRef.current) clearInterval(intervalRef.current);
        return prev;
      });
    }, 4000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [stages.length]);

  // ETA countdown
  useEffect(() => {
    const etaInterval = setInterval(() => {
      setEta((prev) => Math.max(0, prev - 1));
    }, 3000);
    return () => clearInterval(etaInterval);
  }, []);

  // Progress bar
  useEffect(() => {
    const targetProgress = Math.round(((simStage + 1) / stages.length) * 100);
    setProgress(targetProgress);
  }, [simStage, stages.length]);

  const currentStage = stages[simStage];
  const CurrentIcon = currentStage.icon;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-border bg-surface-hover/30 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center">
              <Radio className="w-4.5 h-4.5 text-white animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Live Tracking — {task.id}</h3>
              <span className="text-[10px] text-muted uppercase tracking-wider font-semibold">Real-time GPS Feed</span>
            </div>
          </div>
          <button onClick={onClose} className="text-muted hover:text-foreground transition-colors cursor-pointer p-1 rounded hover:bg-surface-hover">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Status Banner */}
        <div className={`mx-5 mt-4 flex items-center gap-3 p-3.5 rounded-xl border ${currentStage.bgColor}`}>
          <CurrentIcon className={`w-5 h-5 ${currentStage.color} shrink-0 ${simStage === 3 ? "animate-bounce" : ""}`} />
          <div className="flex-1">
            <div className={`text-sm font-bold ${currentStage.color}`}>{currentStage.label}</div>
            <div className="text-[10px] text-muted mt-0.5">{locationLabels[simStage]}</div>
          </div>
          {eta > 0 && (
            <div className="text-right shrink-0">
              <div className="text-lg font-mono font-bold text-foreground">{eta}m</div>
              <div className="text-[9px] text-muted uppercase">ETA</div>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mx-5 mt-4">
          <div className="flex justify-between text-[10px] text-muted uppercase tracking-wider font-bold mb-2">
            <span>Route Progress</span>
            <span className="text-foreground">{progress}%</span>
          </div>
          <div className="w-full h-2 bg-background rounded-full overflow-hidden border border-border">
            <div 
              className="h-full bg-gradient-to-r from-brand-600 to-brand-400 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Info Grid */}
        <div className="mx-5 mt-4 grid grid-cols-2 gap-3">
          <div className="bg-background border border-border rounded-lg p-3">
            <div className="text-[9px] text-muted uppercase tracking-wider font-bold mb-1 flex items-center gap-1">
              <User className="w-3 h-3" /> Driver
            </div>
            <div className="text-sm font-semibold text-foreground">{task.workerName || "Unassigned"}</div>
          </div>
          <div className="bg-background border border-border rounded-lg p-3">
            <div className="text-[9px] text-muted uppercase tracking-wider font-bold mb-1 flex items-center gap-1">
              <Package className="w-3 h-3" /> Cargo
            </div>
            <div className="text-sm font-semibold text-foreground">{task.cartons} Cartons</div>
          </div>
          <div className="bg-background border border-border rounded-lg p-3">
            <div className="text-[9px] text-muted uppercase tracking-wider font-bold mb-1 flex items-center gap-1">
              <LocateFixed className="w-3 h-3" /> Current Location
            </div>
            <div className="text-xs font-medium text-foreground truncate">{locationLabels[simStage]}</div>
          </div>
          <div className="bg-background border border-border rounded-lg p-3">
            <div className="text-[9px] text-muted uppercase tracking-wider font-bold mb-1 flex items-center gap-1">
              <ArrowRight className="w-3 h-3" /> Destination
            </div>
            <div className="text-xs font-medium text-foreground">{task.storeName} Store</div>
          </div>
        </div>

        {/* Timeline */}
        <div className="mx-5 mt-4 mb-5">
          <div className="text-[10px] text-muted uppercase tracking-wider font-bold mb-3">Progress Timeline</div>
          <div className="space-y-0">
            {stages.map((stage, idx) => {
              const isCompleted = idx < simStage;
              const isCurrent = idx === simStage;
              const StageIcon = stage.icon;
              return (
                <div key={idx} className="flex items-start gap-3 relative">
                  {/* Connector line */}
                  {idx < stages.length - 1 && (
                    <div className={`absolute left-[11px] top-6 w-px h-full ${isCompleted ? "bg-brand-500/50" : "bg-border"}`} />
                  )}
                  {/* Node */}
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 border ${
                    isCompleted ? "bg-brand-600 border-brand-500 text-white" :
                    isCurrent ? `${stage.bgColor} ${stage.color} animate-pulse` :
                    "bg-background border-border text-zinc-600"
                  }`}>
                    {isCompleted ? (
                      <CheckSquare className="w-3 h-3" />
                    ) : (
                      <StageIcon className="w-3 h-3" />
                    )}
                  </div>
                  {/* Label */}
                  <div className={`pb-3 ${isCurrent ? "" : ""}`}>
                    <div className={`text-xs font-semibold ${
                      isCompleted ? "text-muted line-through" : 
                      isCurrent ? `${stage.color} font-bold` : 
                      "text-zinc-600"
                    }`}>
                      {stage.label}
                    </div>
                    {isCurrent && (
                      <div className="text-[10px] text-muted mt-0.5 flex items-center gap-1">
                        <CircleDot className="w-2.5 h-2.5 text-brand-500 animate-pulse" />
                        Active now
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Main Manager Dashboard ---
export default function ManagerDashboard() {
  const transfers = useAppStore((state) => state.transfers);
  const user = useAppStore((state) => state.user);
  const fetchManagerStats = useAppStore((state) => state.fetchManagerStats);
  const managerStats = useAppStore((state) => state.managerStats);

  const [trackingTask, setTrackingTask] = useState<TransferTask | null>(null);

  const activeStoreId = user?.storeId || "ST-003";

  // Filter tasks to match the manager's store (LA Mega ST-003)
  const storeTasks = transfers.filter(t => t.storeId === activeStoreId);

  // Live polling for manager attendance stats (Phase 6 / 7)
  useEffect(() => {
    fetchManagerStats(activeStoreId);
    const interval = setInterval(() => {
      fetchManagerStats(activeStoreId);
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchManagerStats, activeStoreId]);

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto">
      
      {/* Tracking Simulation Overlay */}
      {trackingTask && (
        <TrackingSimulation task={trackingTask} onClose={() => setTrackingTask(null)} />
      )}

      {/* Top Header */}
      <div className="flex justify-between items-center pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Store Manager Dashboard</h1>
          <p className="text-muted text-sm mt-1">
            {user?.storeName || "LA Mega Store"} ({user?.storeId || "ST-003"}) • Operational Status: Normal
          </p>
        </div>
        <div className="bg-success-bg border border-success/20 text-success px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider flex items-center">
          <div className="w-1.5 h-1.5 rounded-full bg-success mr-2 animate-pulse" />
          System Synced
        </div>
      </div>

      {/* Attendance & Stats Row (Phase 1 / Phase 6) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AttendanceCard />

        {/* Manager Attendance Stats Card */}
        <div className="bg-surface border border-border rounded-xl p-5 shadow-md flex flex-col justify-between relative overflow-hidden">
          {/* Decorative soft gradients */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/5 rounded-full filter blur-xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-500/5 rounded-full filter blur-xl pointer-events-none" />

          <div className="flex justify-between items-center mb-4 z-10">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-400" />
              <span className="text-[10px] font-bold text-muted uppercase tracking-widest">
                Team Attendance Overview
              </span>
            </div>
            <span className="text-[10px] bg-brand-600/10 border border-brand-500/20 text-brand-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
              {user?.storeName || "LA Mega"}
            </span>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mt-2 z-10">
            <div className="bg-background border border-border rounded-xl p-3 text-center">
              <div className="text-2xl font-black font-mono text-foreground">
                {managerStats?.assignedWorkers ?? 0}
              </div>
              <div className="text-[9px] font-bold text-muted uppercase tracking-wider mt-1">Assigned</div>
            </div>
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 text-center">
              <div className="text-2xl font-black font-mono text-emerald-400">
                {managerStats?.workersActive ?? 0}
              </div>
              <div className="text-[9px] font-bold text-emerald-500/80 uppercase tracking-wider mt-1">Active</div>
            </div>
            <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-3 text-center">
              <div className="text-2xl font-black font-mono text-rose-400">
                {managerStats?.workersOffline ?? 0}
              </div>
              <div className="text-[9px] font-bold text-rose-500/80 uppercase tracking-wider mt-1">Offline</div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border flex justify-between items-center text-[10px] text-muted z-10">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Live synced with Databricks
            </span>
            <span>Store: {activeStoreId}</span>
          </div>
        </div>
      </div>

      {/* Analytics Module */}
      <div className="my-6">
        <AnalyticsView storeId={activeStoreId} />
      </div>

      {/* Grid Overview Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Store Inventory */}
        <div className="bg-surface border border-border rounded-xl shadow-sm flex flex-col h-80 overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex justify-between items-center bg-surface-hover/30">
            <div className="flex items-center">
              <Package className="w-4 h-4 mr-2 text-muted" />
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Local Inventory</h3>
            </div>
            <Link to="/manager/inventory" className="text-[10px] text-brand-500 hover:text-brand-400 font-semibold">
              Manage →
            </Link>
          </div>
          <div className="p-5 flex-1 flex flex-col justify-between">
            <div>
              <div className="text-4xl font-mono font-bold text-foreground">412,000</div>
              <div className="text-xs text-muted mt-1 uppercase font-semibold">Total Stock Units</div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-xs pb-2 border-b border-border">
                <span className="text-muted">High Movers</span>
                <span className="text-foreground font-mono font-semibold">14,200</span>
              </div>
              <div className="flex justify-between text-xs pb-2 border-b border-border">
                <span className="text-muted">Stagnant Stock</span>
                <span className="text-foreground font-mono font-semibold">1,150</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-danger font-semibold">Critical Low Stock</span>
                <span className="text-danger font-mono font-bold">35 SKUs</span>
              </div>
            </div>
          </div>
        </div>

        {/* Transfer Requests */}
        <div className="bg-surface border border-border rounded-xl shadow-sm flex flex-col h-80 overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex justify-between items-center bg-surface-hover/30">
            <div className="flex items-center">
              <ArrowRightLeft className="w-4 h-4 mr-2 text-muted" />
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Active Transfers</h3>
            </div>
            <span className="text-[10px] bg-brand-600 text-white font-mono font-bold px-2 py-0.5 rounded-full">
              {storeTasks.length} Live
            </span>
          </div>
          <div className="p-0 flex-1 overflow-y-auto flex flex-col justify-between">
            <ul className="divide-y divide-border">
              {storeTasks.map((t) => (
                <li key={t.id} className="p-4 hover:bg-surface-hover/20 text-xs flex justify-between items-center">
                  <div>
                    <div className="font-mono text-foreground font-bold text-sm mb-1">{t.id}</div>
                    <div className="text-muted text-[10px]">Status: {t.status}</div>
                  </div>
                  <button 
                    onClick={() => setTrackingTask(t)}
                    className="bg-brand-600/10 hover:bg-brand-600 text-brand-500 hover:text-white border border-brand-500/20 px-2.5 py-1 rounded-md transition-all font-semibold cursor-pointer flex items-center gap-1.5"
                  >
                    <Radio className="w-3 h-3" />
                    Track
                  </button>
                </li>
              ))}
              {storeTasks.length === 0 && (
                <li className="p-6 text-center text-muted text-xs italic">No active transfers currently mapped.</li>
              )}
            </ul>
          </div>
        </div>

        {/* Worker Assignments */}
        <div className="bg-surface border border-border rounded-xl shadow-sm flex flex-col h-80 overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex justify-between items-center bg-surface-hover/30">
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-2 text-muted" />
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Shift Workers</h3>
            </div>
            <span className="text-[10px] bg-success-bg text-success border border-success/20 font-bold px-2 py-0.5 rounded-full">
              42 Active
            </span>
          </div>
          <div className="p-0 flex-1 overflow-y-auto flex flex-col justify-between">
            <ul className="divide-y divide-border">
              {['Alex M.', 'Sarah K.', 'David W.', 'Emma T.', 'Mike J.'].map((name, i) => (
                <li key={i} className="p-3 hover:bg-surface-hover/20 text-xs flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-surface-hover border border-border flex items-center justify-center font-bold text-[10px] text-muted">
                      {name.split(' ')[0][0]}{name.split(' ')[1][0]}
                    </div>
                    <span className="text-foreground font-semibold">{name}</span>
                  </div>
                  <span className="text-muted text-[10px] uppercase border border-border px-1.5 py-0.5 rounded">
                    {i % 2 === 0 ? 'Picker' : 'Loader'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Incoming Deliveries */}
        <div className="bg-surface border border-border rounded-xl shadow-sm flex flex-col h-80 overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center bg-surface-hover/30">
            <Truck className="w-4 h-4 mr-2 text-muted" />
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Incoming Fleet</h3>
          </div>
          <div className="p-5 flex flex-col items-center justify-center h-full text-center text-muted">
            <Truck className="w-8 h-8 mb-3 opacity-40 text-brand-500" />
            <p className="text-xs leading-relaxed max-w-xs">Bulk restock freight scheduled to arrive at Loading Bay 4 at 14:30.</p>
          </div>
        </div>

        {/* Inventory Verification */}
        <div className="bg-surface border border-border rounded-xl shadow-sm flex flex-col h-80 overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center bg-surface-hover/30">
            <CheckSquare className="w-4 h-4 mr-2 text-muted" />
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Audit Queue</h3>
          </div>
          <div className="p-5 flex flex-col items-center justify-center h-full text-center text-muted">
             <div className="text-4xl font-mono font-bold text-warning mb-1">14</div>
             <p className="text-xs leading-relaxed max-w-xs mb-4">Inbound pallets awaiting manual verification scan.</p>
             <button className="bg-background border border-border hover:bg-surface-hover px-4 py-2 rounded-lg text-xs font-semibold text-foreground transition-colors cursor-pointer">
               Initialize Audit Scan
             </button>
          </div>
        </div>

        {/* Communication Panel */}
        <div className="bg-surface border border-border rounded-xl shadow-sm flex flex-col h-80 overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center bg-surface-hover/30">
            <MessageSquare className="w-4 h-4 mr-2 text-muted" />
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">HQ Comms Link</h3>
          </div>
          <div className="p-4 flex flex-col gap-3 overflow-y-auto flex-1">
            <div className="bg-background border border-border p-3 rounded-lg text-xs">
              <span className="font-bold text-brand-500 mb-1 block">Super Admin</span>
              <p className="text-muted leading-relaxed">Ensure Dock Bay 4 is completely cleared for direct replenishment delivery.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
