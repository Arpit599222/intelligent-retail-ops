"use client";

import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";
import { BarChart3, TrendingUp, RefreshCw, AlertTriangle, Package, Trophy, MapPin, TrendingDown, Factory } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

export function AnalyticsView({ storeId }: { storeId?: string }) {
  const addToast = useAppStore((state) => state.addToast);
  const [timeRange, setTimeRange] = useState<"7d" | "30d">("7d");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  const fetchAnalytics = async () => {
    try {
      let url = `/api/analytics?timeRange=${timeRange}`;
      if (storeId) {
        url += `&storeId=${storeId}`;
      }
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setAnalyticsData(data);
    } catch (error) {
      console.error(error);
      addToast("Failed to fetch analytics data", "error");
    }
  };

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange, storeId]);

  const handleRangeChange = (range: "7d" | "30d") => {
    setTimeRange(range);
    addToast(`Switched time range to past ${range === "7d" ? "7 Days" : "30 Days"}`, "info");
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAnalytics();
    setIsRefreshing(false);
    addToast("Analytics database refreshed", "success");
  };

  if (!analyticsData) {
    return (
      <div className="flex items-center justify-center h-64 text-muted font-mono tracking-widest uppercase">
        Loading Analytics...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto">
      <div className="flex justify-between items-center pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Operational Insights</h1>
          <p className="text-muted text-sm mt-1">Real-time inventory and sales metrics powered by Databricks.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-surface border border-border p-1 rounded-lg">
            <button 
              onClick={() => handleRangeChange("7d")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${timeRange === "7d" ? "bg-brand-600 text-white" : "text-muted hover:text-foreground"}`}
            >
              7 Days
            </button>
            <button 
              onClick={() => handleRangeChange("30d")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${timeRange === "30d" ? "bg-brand-600 text-white" : "text-muted hover:text-foreground"}`}
            >
              30 Days
            </button>
          </div>
          <button 
            onClick={handleRefresh}
            className="bg-surface border border-border hover:bg-surface-hover p-2 rounded-lg text-muted hover:text-foreground transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-brand-500" : ""}`} />
          </button>
        </div>
      </div>

      {/* KPI Highlight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Top Product */}
        <div className="bg-surface border border-border rounded-xl p-4 shadow-sm flex flex-col">
          <div className="flex items-center text-xs text-muted font-bold uppercase tracking-wider mb-2">
            <Trophy className="w-4 h-4 mr-2 text-yellow-500" />
            Top Selling Product
          </div>
          <div className="text-lg font-bold text-foreground truncate">
            {analyticsData.topSelling?.[0]?.name || "N/A"}
          </div>
          <div className="text-xs text-muted mt-1">
            {analyticsData.topSelling?.[0]?.total_sold || 0} units sold
          </div>
        </div>

        {/* Most Transferred */}
        <div className="bg-surface border border-border rounded-xl p-4 shadow-sm flex flex-col">
          <div className="flex items-center text-xs text-muted font-bold uppercase tracking-wider mb-2">
            <Package className="w-4 h-4 mr-2 text-blue-500" />
            Most Transferred
          </div>
          <div className="text-lg font-bold text-foreground truncate">
            {analyticsData.mostTransferred?.name || "N/A"}
          </div>
          <div className="text-xs text-muted mt-1">
            {analyticsData.mostTransferred?.total_transferred || 0} units moved
          </div>
        </div>

        {/* Active Store */}
        <div className="bg-surface border border-border rounded-xl p-4 shadow-sm flex flex-col">
          <div className="flex items-center text-xs text-muted font-bold uppercase tracking-wider mb-2">
            <Factory className="w-4 h-4 mr-2 text-purple-500" />
            Most Active Store
          </div>
          <div className="text-lg font-bold text-foreground truncate">
            {analyticsData.activeWarehouse?.name || "N/A"}
          </div>
          <div className="text-xs text-muted mt-1">
            {analyticsData.activeWarehouse?.transfer_count || 0} transfer ops
          </div>
        </div>

        {/* Region Performance */}
        <div className="bg-surface border border-border rounded-xl p-4 shadow-sm flex flex-col">
          <div className="flex items-center text-xs text-muted font-bold uppercase tracking-wider mb-2">
            <MapPin className="w-4 h-4 mr-2 text-emerald-500" />
            Best Region
          </div>
          <div className="text-lg font-bold text-foreground truncate">
            {analyticsData.bestPerformingStore?.region || "N/A"}
          </div>
          <div className="text-xs text-muted mt-1">
            {analyticsData.bestPerformingStore?.name} (${analyticsData.bestPerformingStore?.total_revenue || 0})
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Chart 1: Transfers & Volume */}
        <div className="bg-surface border border-border rounded-xl p-5 shadow-lg flex flex-col h-96">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-foreground flex items-center">
              <TrendingUp className="w-4 h-4 mr-2 text-brand-500" />
              Sales & Transfer Volume
            </h3>
            <p className="text-xs text-muted mt-0.5">Distribution of dispatched stock and carton counts.</p>
          </div>
          <div className="flex-1 w-full min-h-0 text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData.chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis dataKey="name" stroke="#666" />
                <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" />
                <YAxis yAxisId="right" orientation="right" stroke="#10b981" />
                <Tooltip contentStyle={{ backgroundColor: "#181a1f", borderColor: "#2e323a", color: "#e2e8f0" }} />
                <Legend />
                <Bar yAxisId="left" dataKey="Transfers" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="Cartons" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Shortages & Low Stock */}
        <div className="bg-surface border border-border rounded-xl p-5 shadow-lg flex flex-col h-96 overflow-hidden">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-rose-400 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2 text-rose-500" />
              Inventory Shortages & Low Stock Alerts
            </h3>
            <p className="text-xs text-muted mt-0.5">SKUs that have dropped below minimum thresholds.</p>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {analyticsData.shortages?.length > 0 ? (
              <div className="flex flex-col gap-3">
                {analyticsData.shortages.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center p-3 rounded-lg border border-rose-500/20 bg-rose-500/5">
                    <div>
                      <div className="font-bold text-sm text-foreground">{item.name}</div>
                      <div className="text-xs text-muted">{item.sku} &bull; {item.store_name}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-rose-400 font-bold text-lg">{item.quantity} / {item.min_threshold}</div>
                      <div className="text-[10px] text-rose-500/80 uppercase font-semibold">Current / Min</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted">
                <Package className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm">No inventory shortages detected.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {/* Least Selling */}
         <div className="bg-surface border border-border rounded-xl p-5 shadow-sm flex flex-col">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-foreground flex items-center">
              <TrendingDown className="w-4 h-4 mr-2 text-orange-400" />
              Least Selling Products
            </h3>
          </div>
          <div className="flex flex-col gap-2">
            {analyticsData.leastSelling?.map((p: any, i: number) => (
              <div key={i} className="flex justify-between p-2 hover:bg-surface-hover rounded-md transition-colors">
                <span className="text-sm text-foreground">{p.name}</span>
                <span className="text-sm font-mono text-muted">{p.total_sold} units</span>
              </div>
            ))}
          </div>
        </div>

        {/* Lowest Store */}
        <div className="bg-surface border border-border rounded-xl p-5 shadow-sm flex flex-col">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-foreground flex items-center">
              <MapPin className="w-4 h-4 mr-2 text-rose-400" />
              Lowest Performing Region
            </h3>
          </div>
          {analyticsData.lowestPerformingStore ? (
             <div className="flex flex-col gap-2">
               <div className="text-lg font-bold text-foreground">
                 {analyticsData.lowestPerformingStore.region}
               </div>
               <div className="text-sm text-muted">
                 {analyticsData.lowestPerformingStore.name} &mdash; ${analyticsData.lowestPerformingStore.total_revenue}
               </div>
             </div>
          ) : (
             <div className="text-sm text-muted">No data available.</div>
          )}
        </div>
      </div>
    </div>
  );
}
