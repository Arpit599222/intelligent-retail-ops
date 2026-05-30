"use client";

import { useAppStore } from "@/store/useAppStore";
import { LiveMap } from "@/components/tracking/LiveMap";
import { Navigation, Clock, Activity, AlertTriangle } from "lucide-react";

export function LiveControlCenter() {
  const activeTasks = useAppStore((state) => state.transfers);
  const activityLogs = useAppStore((state) => state.activityLogs);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 h-[450px]">
      {/* LEFT: Global Map */}
      <div className="xl:col-span-3 h-full flex flex-col bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-surface flex justify-between items-center z-20">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-wider">
            <Activity className="w-4 h-4 text-brand-500" />
            Live Operations Control Center
          </h2>
          <div className="flex items-center gap-3 text-xs font-mono text-muted">
            <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-success mr-2 animate-pulse" /> {activeTasks.length} Active Routes</span>
          </div>
        </div>
        <div className="flex-1 relative z-10">
          <LiveMap className="w-full h-full border-0 rounded-none" />
        </div>
      </div>

      {/* RIGHT: Operational Timeline */}
      <div className="h-full flex flex-col bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-surface flex justify-between items-center z-20">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-wider">
            <Clock className="w-4 h-4 text-muted" />
            Live Feed
          </h2>
        </div>
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {activityLogs.length === 0 ? (
            <div className="text-xs text-muted text-center mt-10">Waiting for activity...</div>
          ) : (
            activityLogs.map((log, i) => (
              <div key={i} className="flex gap-3 text-xs">
                <div className="font-mono text-muted shrink-0 mt-0.5">{log.time}</div>
                <div className="text-foreground">
                  {log.message.includes("Delayed") ? (
                    <span className="flex items-center text-danger font-medium"><AlertTriangle className="w-3 h-3 mr-1" /> {log.message}</span>
                  ) : (
                    log.message
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
