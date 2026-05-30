import React, { Suspense } from "react";

const AnalyticsView = React.lazy(
  () => import("@/components/dashboard/AnalyticsView").then((mod) => ({ default: mod.AnalyticsView }))
);

export default function AdminAnalytics() {
  return (
    <Suspense fallback={
      <div className="flex flex-col gap-6 max-w-[1600px] mx-auto animate-pulse">
        <div className="flex justify-between items-center pb-4 border-b border-border h-12">
          <div className="h-6 w-48 bg-border/40 rounded"></div>
          <div className="h-8 w-60 bg-border/40 rounded"></div>
        </div>
        
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 h-96">
          <div className="bg-surface border border-border rounded-xl h-full" />
          <div className="bg-surface border border-border rounded-xl h-full" />
        </div>
      </div>
    }>
      <AnalyticsView />
    </Suspense>
  );
}
