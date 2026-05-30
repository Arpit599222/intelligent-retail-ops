"use client";

import React, { useEffect, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { ToastContainer } from "@/components/ui/Toast";
import ProcessLoader from "@/components/ui/ProcessLoader";

export function AppInitializer({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const simulateGpsProgress = useAppStore((state) => state.simulateGpsProgress);
  const user = useAppStore((state) => state.user);

  // Sync state with localStorage only on client mount to bypass hydration bugs
  useEffect(() => {
    setMounted(true);
    
    // Load cached session safely
    const cachedUser = localStorage.getItem("amazon_cachedUser");
    if (cachedUser && !user) {
      try {
        const parsed = JSON.parse(cachedUser);
        useAppStore.setState({ user: parsed });
      } catch (e) {
        localStorage.removeItem("amazon_cachedUser");
      }
    }
  }, []);

  // Save session when user state shifts
  useEffect(() => {
    if (!mounted) return;
    if (user) {
      localStorage.setItem("amazon_cachedUser", JSON.stringify(user));
    } else {
      localStorage.removeItem("amazon_cachedUser");
    }
  }, [user, mounted]);

  // Run the operational mock simulation (GPS updates)
  useEffect(() => {
    const interval = setInterval(() => {
      simulateGpsProgress();
    }, 12000);

    return () => clearInterval(interval);
  }, [simulateGpsProgress]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#0f1115] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      {children}
      <ToastContainer />
      <ProcessLoader />
    </>
  );
}
