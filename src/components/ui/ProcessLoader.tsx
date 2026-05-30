import React from "react";
import { useAppStore } from "@/store/useAppStore";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Database, ShieldAlert } from "lucide-react";

export default function ProcessLoader() {
  const activeProcess = useAppStore((state) => state.activeProcess);

  return (
    <AnimatePresence>
      {activeProcess && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
          className="fixed bottom-6 right-6 z-[9999] max-w-sm"
        >
          <div className="bg-[#141822]/90 backdrop-blur-md border border-brand-500/30 rounded-xl p-4 shadow-2xl flex items-center gap-3.5 shadow-brand-950/20 relative overflow-hidden">
            {/* Top decorative pulsing laser bar */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-brand-600 via-brand-400 to-emerald-500 animate-pulse" />

            {/* Spinner Container */}
            <div className="w-9 h-9 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center shrink-0">
              <Loader2 className="w-5 h-5 text-brand-400 animate-spin" />
            </div>

            {/* Content text */}
            <div className="flex-1 min-w-0 pr-2">
              <div className="flex items-center gap-1.5">
                <Database className="w-3 h-3 text-muted-foreground" />
                <span className="text-[9px] font-black text-muted uppercase tracking-widest">
                  Databricks Engine Sync
                </span>
              </div>
              <h4 className="text-xs font-bold text-foreground truncate mt-0.5">
                {activeProcess}
              </h4>
              <p className="text-[9px] text-muted-foreground font-medium mt-0.5">
                Processing server transaction. Please wait...
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
