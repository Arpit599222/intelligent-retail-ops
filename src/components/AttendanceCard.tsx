import React, { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Clock, Calendar, Play, Square, Timer, Shield, Activity } from "lucide-react";
import { motion } from "framer-motion";

export default function AttendanceCard() {
  const user = useAppStore((state) => state.user);
  const attendanceStatus = useAppStore((state) => state.attendanceStatus);
  const clockIn = useAppStore((state) => state.clockIn);
  const clockOut = useAppStore((state) => state.clockOut);
  const fetchAttendanceStatus = useAppStore((state) => state.fetchAttendanceStatus);

  const [tickerDuration, setTickerDuration] = useState("00:00:00");
  const [isPending, setIsPending] = useState(false);

  const workerId = user?.workerId || user?.userId || user?.email || "";

  // 1. Fetch current status on mount and when workerId changes
  useEffect(() => {
    if (workerId) {
      fetchAttendanceStatus(workerId);
    }
  }, [workerId, fetchAttendanceStatus]);

  const currentStatus = attendanceStatus?.currentStatus || "CLOCKED_OUT";
  const clockInTime = attendanceStatus?.clockInTime ? new Date(attendanceStatus.clockInTime) : null;
  const clockOutTime = attendanceStatus?.clockOutTime ? new Date(attendanceStatus.clockOutTime) : null;

  // 2. Real-time duration ticker
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const formatDuration = (ms: number) => {
      const totalSecs = Math.floor(ms / 1000);
      const hrs = Math.floor(totalSecs / 3600);
      const mins = Math.floor((totalSecs % 3600) / 60);
      const secs = totalSecs % 60;
      return [
        hrs.toString().padStart(2, "0"),
        mins.toString().padStart(2, "0"),
        secs.toString().padStart(2, "0")
      ].join(":");
    };

    if (currentStatus === "CLOCKED_IN" && clockInTime) {
      const updateTicker = () => {
        const elapsed = Date.now() - clockInTime.getTime();
        setTickerDuration(formatDuration(Math.max(0, elapsed)));
      };
      updateTicker();
      interval = setInterval(updateTicker, 1000);
    } else if (currentStatus === "CLOCKED_OUT") {
      if (clockInTime && clockOutTime) {
        const elapsed = clockOutTime.getTime() - clockInTime.getTime();
        setTickerDuration(formatDuration(Math.max(0, elapsed)));
      } else {
        setTickerDuration("00:00:00");
      }
    } else {
      setTickerDuration("00:00:00");
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentStatus, clockInTime, clockOutTime]);

  const handleClockIn = async () => {
    if (!workerId || isPending) return;
    setIsPending(true);
    try {
      await clockIn(workerId);
    } finally {
      setIsPending(false);
    }
  };

  const handleClockOut = async () => {
    if (!workerId || isPending) return;
    setIsPending(true);
    try {
      await clockOut(workerId);
    } finally {
      setIsPending(false);
    }
  };

  const todayStr = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const getStatusBadge = () => {
    switch (currentStatus) {
      case "CLOCKED_IN":
        return {
          bg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
          text: "CLOCKED IN",
          dot: "bg-emerald-400 animate-ping",
        };
      case "BREAK":
        return {
          bg: "bg-amber-500/10 border-amber-500/20 text-amber-400",
          text: "ON BREAK",
          dot: "bg-amber-400",
        };
      case "ABSENT":
        return {
          bg: "bg-zinc-500/10 border-zinc-500/20 text-zinc-400",
          text: "ABSENT",
          dot: "bg-zinc-400",
        };
      case "CLOCKED_OUT":
      default:
        return {
          bg: "bg-rose-500/10 border-rose-500/20 text-rose-400",
          text: "CLOCKED OUT",
          dot: "bg-rose-400",
        };
    }
  };

  const badge = getStatusBadge();

  return (
    <div className="bg-surface/85 backdrop-blur-md border border-border/80 rounded-2xl p-5 shadow-xl relative overflow-hidden flex flex-col gap-4">
      {/* Background soft gradients */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/5 rounded-full filter blur-xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-500/5 rounded-full filter blur-xl pointer-events-none" />

      {/* Header */}
      <div className="flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-brand-400" />
          <span className="text-[10px] font-bold text-muted uppercase tracking-widest">
            Roster & Shift Control
          </span>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold tracking-wider ${badge.bg}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
          {badge.text}
        </div>
      </div>

      {/* Date & clock display */}
      <div className="flex flex-col gap-1 mt-1 z-10">
        <div className="flex items-center gap-2 text-muted text-xs">
          <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
          <span>{todayStr}</span>
        </div>
        <div className="text-3xl font-black font-mono text-foreground tracking-tight flex items-baseline gap-1 mt-2">
          {tickerDuration}
          <span className="text-[10px] font-bold text-muted uppercase tracking-wider ml-1.5 font-sans">
            duration
          </span>
        </div>
      </div>

      {/* Grid of times */}
      <div className="grid grid-cols-2 gap-3 mt-1 bg-surface-hover/30 border border-border/50 rounded-xl p-3 z-10">
        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] font-bold text-muted uppercase tracking-wider">Clock In Time</span>
          <span className="text-xs font-bold text-foreground font-mono">
            {clockInTime ? clockInTime.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : "--:--:--"}
          </span>
        </div>
        <div className="flex flex-col gap-0.5 border-l border-border/50 pl-3">
          <span className="text-[9px] font-bold text-muted uppercase tracking-wider">Clock Out Time</span>
          <span className="text-xs font-bold text-foreground font-mono">
            {clockOutTime ? clockOutTime.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : "--:--:--"}
          </span>
        </div>
      </div>

      {/* Interactive Controls */}
      <div className="mt-2 z-10 flex gap-3">
        {currentStatus === "CLOCKED_OUT" ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleClockIn}
            disabled={isPending}
            className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-xl py-3 px-4 text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/20 transition-all border border-emerald-500/20 cursor-pointer disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Clock In Shift</span>
          </motion.button>
        ) : (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleClockOut}
            disabled={isPending}
            className="flex-1 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white rounded-xl py-3 px-4 text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-rose-950/20 transition-all border border-rose-500/20 cursor-pointer disabled:opacity-50"
          >
            <Square className="w-3.5 h-3.5 fill-white" />
            <span>Clock Out Shift</span>
          </motion.button>
        )}
      </div>
    </div>
  );
}
