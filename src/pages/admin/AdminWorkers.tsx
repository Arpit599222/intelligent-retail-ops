import React, { useState, useEffect } from "react";
import { useAppStore, WorkerStatus, WorkerDesignation, Role } from "@/store/useAppStore";
import { 
  CheckCircle, 
  XCircle, 
  Plus, 
  X, 
  Mail, 
  Shield, 
  User, 
  Store,
  UserCheck,
  AlertCircle,
  Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminWorkers() {
  const workforce = useAppStore((state) => state.workforce);
  const clockIn = useAppStore((state) => state.clockIn);
  const clockOut = useAppStore((state) => state.clockOut);
  const addWorkforceMember = useAppStore((state) => state.addWorkforceMember);
  const removeWorkforceMember = useAppStore((state) => state.removeWorkforceMember);
  const fetchWorkforce = useAppStore((state) => state.fetchWorkforce);
  const addToast = useAppStore((state) => state.addToast);

  const [isModalOpen, setIsModalOpen] = useState(false);
  
  useEffect(() => {
    fetchWorkforce();
    const interval = setInterval(() => {
      fetchWorkforce();
    }, 5000); // Live status synchronization poll
    return () => clearInterval(interval);
  }, [fetchWorkforce]);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "OPERATIONS_STAFF" as Role,
    designation: "Inventory Handler" as WorkerDesignation,
    storeId: "ST-003"
  });

  const getStoreName = (id: string) => {
    const stores: Record<string, string> = {
      "ST-003": "LA Mega Hub",
      "ST-004": "NYC Hub",
      "ST-005": "Mumbai Central Hub",
      "ST-006": "Delhi NCR Hub",
      "ST-007": "Bangalore Tech Hub"
    };
    return stores[id] || id;
  };

  // Calculations based on live Zustand state
  const totalCount = workforce.length;
  const activeCount = workforce.filter(w => w.status !== "OFFLINE").length;
  const offlineCount = workforce.filter(w => w.status === "OFFLINE").length;
  const busyCount = workforce.filter(w => w.status === "BUSY" || w.status === "ON_DELIVERY").length;
  const utilization = activeCount > 0 ? Math.round((busyCount / activeCount) * 100) : 0;

  const [latestTempPassword, setLatestTempPassword] = useState("");
  const [latestCreatedName, setLatestCreatedName] = useState("");

  // Removed mock generation useEffect

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      addToast("Please fill in all required fields", "warning");
      return;
    }

    const isWorker = formData.role === "OPERATIONS_STAFF";

    const res = await addWorkforceMember({
      name: formData.name,
      email: formData.email,
      role: formData.role,
      designation: isWorker ? formData.designation : undefined,
      storeId: formData.storeId,
      storeName: getStoreName(formData.storeId)
    });

    if (res.success && res.temporaryPassword) {
      setLatestCreatedName(formData.name);
      setLatestTempPassword(res.temporaryPassword);
      setIsModalOpen(false);
      
      // Reset form
      setFormData({
        name: "",
        email: "",
        role: "OPERATIONS_STAFF",
        designation: "Inventory Handler",
        storeId: "ST-003"
      });
    }
  };

  const getStatusStyle = (status: WorkerStatus) => {
    switch (status) {
      case "ONLINE":
        return "bg-success-bg text-success border-success/20";
      case "BUSY":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "ON_DELIVERY":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "OFFLINE":
      default:
        return "bg-zinc-800 text-muted border-zinc-700";
    }
  };

  const getStatusLabel = (status: WorkerStatus) => {
    switch (status) {
      case "ONLINE":
        return "Online • Available";
      case "BUSY":
        return "On Task • Preparing";
      case "ON_DELIVERY":
        return "On Route • Transit";
      case "OFFLINE":
      default:
        return "Offline • Standby";
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto">
      {latestTempPassword && (
        <div className="bg-success-bg border border-success/20 p-5 rounded-xl shadow-sm flex justify-between items-start animate-fade-in shrink-0">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 shrink-0 text-success mt-0.5" />
            <div>
              <span className="font-bold text-sm block text-success mb-2">Account Provisioned for {latestCreatedName}!</span>
              <div className="bg-background border border-border rounded-lg p-3 flex items-center gap-3 w-fit mb-3">
                <span className="text-xs font-semibold text-muted">Temporary Password:</span>
                <span className="font-mono text-foreground font-bold select-all tracking-wider text-base">{latestTempPassword}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(latestTempPassword);
                    addToast("Password copied to clipboard!", "success");
                  }}
                  className="ml-2 bg-surface hover:bg-zinc-800 border border-border rounded px-3 py-1.5 text-xs font-bold text-muted hover:text-foreground transition-colors cursor-pointer"
                >
                  Copy Password
                </button>
              </div>
              <p className="text-xs font-medium text-amber-500/90 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" /> Share this password securely. The employee will be required to change it on first login.
              </p>
            </div>
          </div>
          <button 
            onClick={() => { setLatestTempPassword(""); setLatestCreatedName(""); }}
            className="text-muted hover:text-foreground cursor-pointer p-1.5 hover:bg-surface rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Personnel & Shifts</h1>
          <p className="text-muted text-sm mt-1">Provision workforce members, monitor shift attendance, and override active states across all hubs.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors cursor-pointer w-fit"
        >
          <Plus className="w-4 h-4" /> Provision Personnel
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-surface border border-border p-5 rounded-xl">
          <div className="text-xs text-muted uppercase font-bold tracking-wider mb-2">Total Personnel</div>
          <div className="text-3xl font-mono font-bold text-foreground">{totalCount}</div>
        </div>
        <div className="bg-surface border border-border p-5 rounded-xl">
          <div className="text-xs text-muted uppercase font-bold tracking-wider mb-2">On-Shift (Active)</div>
          <div className="text-3xl font-mono font-bold text-success">{activeCount}</div>
        </div>
        <div className="bg-surface border border-border p-5 rounded-xl">
          <div className="text-xs text-muted uppercase font-bold tracking-wider mb-2">Off-Shift (Offline)</div>
          <div className="text-3xl font-mono font-bold text-muted">{offlineCount}</div>
        </div>
        <div className="bg-surface border border-border p-5 rounded-xl">
          <div className="text-xs text-muted uppercase font-bold tracking-wider mb-2">Duty Utilization</div>
          <div className="text-3xl font-mono font-bold text-foreground">
            {utilization}% <span className="text-xs font-sans font-normal text-muted ml-1">of active roster</span>
          </div>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl shadow-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-border bg-surface-hover/30 flex justify-between items-center">
          <h2 className="font-bold text-foreground">Staff Directory</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface-hover/10 text-xs font-bold text-muted uppercase tracking-wider">
                <th className="p-4">Personnel ID</th>
                <th className="p-4">Full Name</th>
                <th className="p-4">Role / Designation</th>
                <th className="p-4">Assigned Store</th>
                <th className="p-4">Shift Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {workforce.map((w) => (
                <tr key={w.id} className="hover:bg-surface-hover/20 transition-colors">
                  <td className="p-4 font-mono font-bold text-foreground">{w.id}</td>
                  <td className="p-4 font-semibold text-foreground flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center font-bold text-muted text-xs">
                      {w.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div>
                      <div>{w.name}</div>
                      <div className="text-[10px] text-muted font-normal mt-0.5">{w.email}</div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-foreground text-xs font-medium">
                        {w.role === "SUPER_ADMIN" ? "Super Admin" : w.role === "STORE_MANAGER" ? "Store Manager" : "Ground Worker"}
                      </span>
                      {w.designation && (
                        <span className="text-[10px] text-brand-400 font-mono">
                          {w.designation.replace("_", " ")}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-muted">{w.storeName}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center w-fit gap-1.5 border ${getStatusStyle(w.status)}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${w.status === "OFFLINE" ? "bg-muted" : w.status === "ONLINE" ? "bg-success" : w.status === "ON_DELIVERY" ? "bg-blue-500 animate-pulse" : "bg-amber-400"}`} />
                      {getStatusLabel(w.status)}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => w.status === "OFFLINE" ? clockIn(w.id) : clockOut(w.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all inline-flex items-center cursor-pointer ${
                        w.status !== "OFFLINE" 
                          ? "bg-zinc-800 border border-zinc-700 text-muted hover:bg-zinc-700" 
                          : "bg-success-bg border border-success/30 text-success hover:bg-success hover:text-white"
                      }`}
                    >
                      {w.status !== "OFFLINE" ? (
                        <>
                          <XCircle className="w-3.5 h-3.5 mr-1" /> Override Clock-Out
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-3.5 h-3.5 mr-1" /> Override Clock-In
                        </>
                      )}
                    </button>
                    {w.role !== "SUPER_ADMIN" && (
                      <button 
                        onClick={() => {
                          if (confirm(`Security Override: Are you sure you want to permanently delete account ${w.name} (${w.id})?`)) {
                            removeWorkforceMember(w.id);
                          }
                        }}
                        className="bg-red-500/10 border border-red-500/20 hover:bg-red-600 hover:text-white text-red-400 p-2 rounded-lg text-xs font-bold transition-all inline-flex items-center cursor-pointer ml-2"
                        title="Delete Personnel Account"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ACCOUNT PROVISIONING MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface border border-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-border bg-surface-hover/50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-brand-500" />
                  <h3 className="text-base font-bold text-foreground">Provision New Personnel</h3>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="text-muted hover:text-foreground cursor-pointer p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleRegister} className="p-6 space-y-4">


                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                    <input 
                      required 
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-background border border-border rounded-lg text-sm pl-9 pr-3 py-2.5 text-foreground focus:outline-none focus:border-brand-500 transition-colors" 
                      placeholder="e.g. Liam Cooper" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                    <input 
                      required 
                      type="email" 
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full bg-background border border-border rounded-lg text-sm pl-9 pr-3 py-2.5 text-foreground focus:outline-none focus:border-brand-500 transition-colors" 
                      placeholder="employee@company.com" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1.5">Organizational Role</label>
                    <div className="relative">
                      <Shield className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                      <select 
                        value={formData.role}
                        onChange={(e) => setFormData({...formData, role: e.target.value as Role})}
                        className="w-full bg-background border border-border rounded-lg text-sm pl-9 pr-3 py-2.5 text-foreground focus:outline-none focus:border-brand-500 transition-colors cursor-pointer appearance-none"
                      >
                        <option value="OPERATIONS_STAFF">Ground Worker</option>
                        <option value="STORE_MANAGER">Store Manager</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-muted mb-1.5">Assigned Store Hub</label>
                    <div className="relative">
                      <Store className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                      <select 
                        value={formData.storeId}
                        onChange={(e) => setFormData({...formData, storeId: e.target.value})}
                        className="w-full bg-background border border-border rounded-lg text-sm pl-9 pr-3 py-2.5 text-foreground focus:outline-none focus:border-brand-500 transition-colors cursor-pointer appearance-none"
                      >
                        <option value="ST-003">LA Mega Hub</option>
                        <option value="ST-004">NYC Hub</option>
                        <option value="ST-005">Mumbai Central Hub</option>
                        <option value="ST-006">Delhi NCR Hub</option>
                        <option value="ST-007">Bangalore Tech Hub</option>
                      </select>
                    </div>
                  </div>
                </div>

                {formData.role === "OPERATIONS_STAFF" && (
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1.5">Job Designation</label>
                    <select 
                      value={formData.designation}
                      onChange={(e) => setFormData({...formData, designation: e.target.value as WorkerDesignation})}
                      className="w-full bg-background border border-border rounded-lg text-sm px-3 py-2.5 text-foreground focus:outline-none focus:border-brand-500 transition-colors cursor-pointer"
                    >
                      <option value="Inventory Handler">Inventory Handler</option>
                      <option value="Delivery Staff">Delivery Staff (Driver)</option>
                      <option value="Warehouse Staff">Warehouse Staff</option>
                    </select>
                  </div>
                )}

                <div className="flex gap-2 p-3 bg-brand-500/5 border border-brand-500/10 rounded-lg text-xs text-brand-400">
                  <AlertCircle className="w-4 h-4 shrink-0 text-brand-500" />
                  <span>Provisioned staff are registered in active database as **OFFLINE** and must clock in standard shifts to commence operations.</span>
                </div>

                {/* Footer Buttons */}
                <div className="flex gap-3 pt-4 border-t border-border mt-6 justify-end">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-muted px-4 py-2 rounded-lg font-bold text-xs cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-brand-600 hover:bg-brand-500 text-white px-5 py-2 rounded-lg font-bold text-xs cursor-pointer transition-colors"
                  >
                    Register & Activate Account
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
