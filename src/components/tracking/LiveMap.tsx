import React, { Suspense } from 'react';

// Dynamically import the map for code splitting and identical skeleton loading behavior
const Map = React.lazy(() => import('./Map'));

export function LiveMap({ taskId, className }: { taskId?: string; className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-md border border-border ${className}`}>
      <Suspense fallback={
        <div className="w-full h-full bg-[#111113] flex items-center justify-center border border-border">
          <div className="flex flex-col items-center">
            <div className="w-6 h-6 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin mb-3"></div>
            <div className="text-xs text-muted font-mono tracking-widest">INITIALIZING GPS...</div>
          </div>
        </div>
      }>
        <Map taskId={taskId} />
      </Suspense>
    </div>
  );
}
