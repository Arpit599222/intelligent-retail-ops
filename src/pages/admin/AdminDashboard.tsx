import React, { useState, Suspense, useEffect } from "react";
import { KPICards } from "@/components/dashboard/KPICards";
import { InventoryTable } from "@/components/dashboard/InventoryTable";
import { LiveTransfers } from "@/components/dashboard/LiveTransfers";
import { WorkerActivity } from "@/components/dashboard/WorkerActivity";
import { AlertsPanel } from "@/components/dashboard/AlertsPanel";
import { LayoutDashboard, Activity, Users } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

// Lazy-load heavy map/gps control center
const LiveControlCenter = React.lazy(
  () => import("@/components/tracking/LiveControlCenter").then((mod) => ({ default: mod.LiveControlCenter }))
);

// Lazy-load heavy recharts chart
const AnalyticsCharts = React.lazy(
  () => import("@/components/dashboard/AnalyticsCharts").then((mod) => ({ default: mod.AnalyticsCharts }))
);

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'live'>('overview');
  const fetchAdminStats = useAppStore((state) => state.fetchAdminStats);
  const adminStats = useAppStore((state) => state.adminStats);

  // Live polling for admin stats (Phase 5 / 7)
  useEffect(() => {
    fetchAdminStats();
    const interval = setInterval(() => {
      fetchAdminStats();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchAdminStats]);

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto">
      
      {/* Top Header & Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Global Operations Dashboard</h1>
          <p className="text-muted text-[13px] mt-1">Super Admin Overview</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex bg-background border border-border p-1 rounded-lg shadow-sm">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-1.5 rounded-md text-[13px] font-semibold transition-all duration-200 flex items-center cursor-pointer ${activeTab === 'overview' ? 'bg-surface text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.12)] border border-border/50' : 'text-muted hover:text-foreground border border-transparent hover:bg-surface-hover'}`}
            >
              <LayoutDashboard className="w-4 h-4 mr-2" /> Overview
            </button>
            <button 
              onClick={() => setActiveTab('live')}
              className={`px-4 py-1.5 rounded-md text-[13px] font-semibold transition-all duration-200 flex items-center cursor-pointer ${activeTab === 'live' ? 'bg-surface text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.12)] border border-border/50' : 'text-muted hover:text-foreground border border-transparent hover:bg-surface-hover'}`}
            >
              <Activity className="w-4 h-4 mr-2" /> Live Map
            </button>
          </div>
        </div>
      </div>      {/* Admin Attendance Stats Grid (Phase 5) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 bg-surface border border-border rounded-xl p-4 shadow-sm relative overflow-hidden">
        {/* Decorative soft gradient background */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/5 rounded-full filter blur-2xl pointer-events-none" />

        {/* Total Workers */}
        <div className="bg-background border border-border rounded-xl p-3.5 flex flex-col shadow-sm relative">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] text-muted font-bold uppercase tracking-wider">Total Workers</span>
            <Users className="w-4 h-4 text-brand-400" />
          </div>
          <div className="text-2xl font-black font-mono text-foreground">{adminStats?.totalWorkers ?? 0}</div>
          <span className="text-[9px] text-muted mt-1">Operational Roster</span>
        </div>

        {/* Present Today */}
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3.5 flex flex-col shadow-sm relative">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] text-emerald-500/80 font-bold uppercase tracking-wider font-semibold">Present Today</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="text-2xl font-black font-mono text-emerald-400">{adminStats?.presentToday ?? 0}</div>
          <span className="text-[9px] text-emerald-500/60 mt-1">Clocked In Today</span>
        </div>

        {/* Absent Today */}
        <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-3.5 flex flex-col shadow-sm relative">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] text-rose-500/80 font-bold uppercase tracking-wider font-semibold">Absent Today</span>
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
          </div>
          <div className="text-2xl font-black font-mono text-rose-400">{adminStats?.absentToday ?? 0}</div>
          <span className="text-[9px] text-rose-500/60 mt-1">Roster Deficit</span>
        </div>

        {/* Workers Clocked In */}
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3.5 flex flex-col shadow-sm relative">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider font-semibold">Workers Clocked In</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <div className="text-2xl font-black font-mono text-emerald-400">{adminStats?.clockedIn ?? 0}</div>
          <span className="text-[9px] text-emerald-500/60 mt-1">On Shift Active</span>
        </div>

        {/* Workers Clocked Out */}
        <div className="bg-surface-hover/30 border border-border rounded-xl p-3.5 flex flex-col shadow-sm relative">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] text-muted font-bold uppercase tracking-wider font-semibold">Workers Clocked Out</span>
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
          </div>
          <div className="text-2xl font-black font-mono text-muted">{adminStats?.clockedOut ?? 0}</div>
          <span className="text-[9px] text-muted mt-1">On Shift Offline</span>
        </div>
      </div>

      <KPICards />
      
      {activeTab === 'live' ? (
        // LIVE OPERATIONS TAB
        <Suspense fallback={
          <div className="h-[450px] bg-surface border border-border rounded-xl animate-pulse flex items-center justify-center text-xs text-muted font-mono tracking-widest uppercase">
            Loading Operations Center...
          </div>
        }>
          <LiveControlCenter />
        </Suspense>
      ) : (
        // OVERVIEW TAB
        <>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-auto xl:h-[380px]">
            <div className="xl:col-span-2 h-full">
              <InventoryTable />
            </div>
            <div className="h-full min-h-[380px]">
              <LiveTransfers />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 h-auto xl:h-[340px]">
            <div className="lg:col-span-2 xl:col-span-2 h-full min-h-[340px]">
              <WorkerActivity />
            </div>
            <div className="h-full min-h-[340px]">
              <Suspense fallback={
                <div className="h-full min-h-[340px] bg-surface border border-border rounded-xl animate-pulse flex items-center justify-center text-xs text-muted font-mono tracking-widest uppercase">
                  Loading Analytics charts...
                </div>
              }>
                <AnalyticsCharts />
              </Suspense>
            </div>
            <div className="h-full min-h-[340px]">
              <AlertsPanel />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
