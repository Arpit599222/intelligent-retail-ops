"use client";

import { Search, Bell, Activity, ChevronDown } from 'lucide-react';
import { useAppStore, Role } from '@/store/useAppStore';

function getRoleLabel(role?: Role, designation?: string): string {
  if (role === "SUPER_ADMIN") return "Super Admin";
  if (role === "STORE_MANAGER") return "Store Manager";
  if (role === "OPERATIONS_STAFF" && designation) return designation;
  if (role === "OPERATIONS_STAFF") return "Operations Staff";
  return "User";
}

function getInitials(name?: string): string {
  if (!name) return "??";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function TopNav() {
  const user = useAppStore((state) => state.user);

  const displayName = user?.name || "Unknown User";
  const roleLabel = getRoleLabel(user?.role, user?.designation);
  const initials = getInitials(user?.name);

  return (
    <header className="h-14 bg-background/95 backdrop-blur-sm border-b border-border flex items-center justify-between px-6 sticky top-0 z-10 text-sm w-full">
      <div className="flex items-center flex-1 max-w-md">
        <div className="relative w-full group">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-foreground transition-colors" />
          <input 
            type="text" 
            placeholder="Search SKUs, transfers, or workers..." 
            className="w-full bg-surface hover:bg-surface-hover border border-transparent rounded-md pl-9 pr-14 py-1.5 text-sm text-foreground focus:outline-none focus:border-border focus:bg-background transition-all placeholder:text-muted/70 shadow-sm"
          />
          <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
            <kbd className="hidden sm:inline-flex items-center justify-center bg-background border border-border rounded px-1.5 h-5 text-[10px] font-medium text-muted shadow-sm">⌘</kbd>
            <kbd className="hidden sm:inline-flex items-center justify-center bg-background border border-border rounded px-1.5 h-5 text-[10px] font-medium text-muted shadow-sm">K</kbd>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-5">
        <div className="hidden md:flex items-center text-xs text-muted/80">
          <div className="w-1.5 h-1.5 rounded-full bg-success/80 shadow-[0_0_8px_rgba(16,185,129,0.4)] mr-2"></div>
          <span className="font-medium">Realtime Sync</span>
        </div>
        
        <button className="relative text-muted hover:text-foreground transition-colors p-1 rounded-md hover:bg-surface-hover">
          <Bell className="w-4 h-4" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-brand-500 rounded-full border border-background"></span>
        </button>

        <div className="h-4 w-px bg-border"></div>

        <button className="flex items-center space-x-2.5 text-foreground hover:bg-surface-hover transition-colors p-1 pr-2 rounded-md group">
          <div className="w-7 h-7 rounded bg-surface border border-border flex items-center justify-center text-xs font-semibold text-foreground uppercase group-hover:border-muted transition-colors shadow-sm">
            {initials}
          </div>
          <div className="hidden md:flex flex-col items-start text-left justify-center">
            <span className="text-[13px] font-medium leading-none">{displayName}</span>
            <span className="text-[10px] text-muted mt-1 leading-none tracking-wide">{roleLabel}</span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-muted ml-1 opacity-50 group-hover:opacity-100 transition-opacity" />
        </button>
      </div>
    </header>
  );
}
