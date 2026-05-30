"use client";

import React from "react";
import { useAppStore } from "@/store/useAppStore";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export function ToastContainer() {
  const toasts = useAppStore((state) => state.toasts);
  const removeToast = useAppStore((state) => state.removeToast);

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-warning" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-danger" />;
      default:
        return <Info className="w-4 h-4 text-info" />;
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="flex items-center justify-between bg-surface border border-border px-4 py-3 rounded-lg shadow-2xl relative overflow-hidden pointer-events-auto"
          >
            {/* Status bar */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${
              toast.type === 'success' ? 'bg-success' :
              toast.type === 'warning' ? 'bg-warning' :
              toast.type === 'error' ? 'bg-danger' : 'bg-info'
            }`} />
            
            <div className="flex items-center gap-3 pl-1">
              {getIcon(toast.type)}
              <span className="text-xs text-foreground font-medium">{toast.message}</span>
            </div>
            
            <button
              onClick={() => removeToast(toast.id)}
              className="text-muted hover:text-foreground transition-colors ml-4 shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
