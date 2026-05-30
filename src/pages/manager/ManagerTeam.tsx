import React, { useState } from "react";
import { useAppStore, WorkerStatus, WorkerDesignation } from "@/store/useAppStore";
import { 
  Users, 
  Bell, 
  Search, 
  Store,
  Clock,
  Activity,
  Plus,
  X,
  User,
  Mail,
  UserCheck,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ManagerTeam() {
  const workforce = useAppStore((state) => state.workforce);
  const user = useAppStore((state) => state.user);
  const addToast = useAppStore((state) => state.addToast);
  const addLog = useAppStore((state) => state.addLog);
  const transfers = useAppStore((state) => state.transfers);
  const addWorkforceMember = useAppStore((state) => state.addWorkforceMember);
  const removeWorkforceMember = useAppStore((state) => state.removeWorkforceMember);
  const fetchWorkforce = useAppStore((state) => state.fetchWorkforce);

  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [latestTempPassword, setLatestTempPassword] = useState("");
  const [latestCreatedName, setLatestCreatedName] = useState("");
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  const activeStoreId = user?.storeId || "ST-003";

  React.useEffect(() => {
    fetchWorkforce(activeStoreId);
    const interval = setInterval(() => {
      fetchWorkforce(activeStoreId);
    }, 5000); // Live status synchronization poll
    return () => clearInterval(interval);
  }, [fetchWorkforce, activeStoreId]);

  const togglePasswordVisibility = (workerId: string) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [workerId]: !prev[workerId],
    }));
  };

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    designation: "Inventory Handler" as WorkerDesignation
  });

  // Get active store context (fallback to ST-003 LA Mega Hub if storeId is missing)
  const activeStoreName = user?.storeName || "LA Mega Hub";

  // Filter roster by store assignment and operations role, matching search query
  const localStaff = workforce.filter((w) => {
    const matchesStore = w.storeId === activeStoreId;
    const isGroundStaff = w.role === "OPERATIONS_STAFF";
    const matchesSearch = w.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          w.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStore && isGroundStaff && matchesSearch;
  });

  const getActiveTask = (workerId: string) => {
    const task = transfers.find(t => t.workerId === workerId && t.status !== "COMPLETED");
    return task ? task.id : "None";
  };

  const handleAssignShift = (id: string, name: string) => {
    addToast(`Broadcast alert dispatched to ${name}: Verify loading manifest`, "success");
    addLog(`Broadcast dispatch alert sent to local personnel ${id} (${name})`, "info");
  };

  const handleRegisterWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      addToast("Please fill in all required fields", "warning");
      return;
    }

    const res = await addWorkforceMember({
      name: formData.name,
      email: formData.email,
      role: "OPERATIONS_STAFF",
      designation: formData.designation,
      storeId: activeStoreId,
      storeName: activeStoreName
    });

    if (res.success && res.temporaryPassword) {
      setLatestCreatedName(formData.name);
      setLatestTempPassword(res.temporaryPassword);
      setIsModalOpen(false);

      // Reset form
      setFormData({
        name: "",
        email: "",
        designation: "Inventory Handler"
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
        return "Clocked In • Ready";
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
        <div className="bg-success-bg border border-success/20 text-success p-4 rounded-xl shadow-sm flex justify-between items-center animate-fade-in shrink-0">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 shrink-0 text-success animate-pulse" />
            <div>
              <span className="font-bold text-sm block">Worker Provisioned for {latestCreatedName}!</span>
              <span className="text-xs text-muted">Activation Required on first login. Temporary Password: <span className="font-mono bg-zinc-900 border border-zinc-800 text-white px-2 py-0.5 rounded font-bold ml-1 text-xs select-all">{latestTempPassword}</span></span>
            </div>
          </div>
          <button 
            onClick={() => { setLatestTempPassword(""); setLatestCreatedName(""); }}
            className="text-muted hover:text-foreground cursor-pointer text-xs font-bold font-mono px-2 py-1 bg-surface border border-border rounded"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Workforce Coordinator</h1>
          <p className="text-muted text-sm mt-1">
            Manage local personnel schedules, track attendance states, and dispatch dispatch checklists for Store Hub: **{activeStoreName}**.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-500/5 border border-brand-500/15 rounded-lg text-xs font-semibold text-brand-400">
            <Store className="w-4 h-4 text-brand-500" />
            <span>Active Context: {activeStoreName} Hub</span>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer w-fit"
          >
            <Plus className="w-4 h-4" /> Provision Worker
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface border border-border p-4 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-[10px] text-muted uppercase font-bold tracking-wider mb-1">Local Roster Size</div>
            <div className="text-2xl font-mono font-bold text-foreground">{localStaff.length} Workers</div>
          </div>
          <Users className="w-8 h-8 text-brand-500/30" />
        </div>

        <div className="bg-surface border border-border p-4 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-[10px] text-muted uppercase font-bold tracking-wider mb-1">Active Shifts (Online)</div>
            <div className="text-2xl font-mono font-bold text-success">
              {localStaff.filter(w => w.status !== "OFFLINE").length} On-Shift
            </div>
          </div>
          <Clock className="w-8 h-8 text-success/30" />
        </div>

        <div className="bg-surface border border-border p-4 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-[10px] text-muted uppercase font-bold tracking-wider mb-1">Outbound Delivery Staff</div>
            <div className="text-2xl font-mono font-bold text-blue-400">
              {localStaff.filter(w => w.status === "ON_DELIVERY").length} In Transit
            </div>
          </div>
          <Activity className="w-8 h-8 text-blue-400/30 animate-pulse" />
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl shadow-lg overflow-hidden">
        {/* Roster Header with Search */}
        <div className="px-5 py-4 border-b border-border bg-surface-hover/30 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <h2 className="font-bold text-foreground flex items-center gap-2">
            Local Team Directory
          </h2>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search local roster..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-background border border-border text-xs rounded-lg pl-9 pr-3 py-2 text-foreground focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface-hover/10 text-xs font-bold text-muted uppercase tracking-wider">
                <th className="p-4">Staff ID</th>
                <th className="p-4">Full Name</th>
                <th className="p-4">Job Designation</th>
                <th className="p-4">Shift Attendance</th>
                <th className="p-4">Active Task</th>
                <th className="p-4">Credentials</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {localStaff.length > 0 ? (
                localStaff.map((w) => (
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
                    <td className="p-4 text-muted font-mono text-xs">
                      {w.designation || "UNASSIGNED"}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center w-fit gap-1.5 border ${getStatusStyle(w.status)}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${w.status === "OFFLINE" ? "bg-muted" : w.status === "ONLINE" ? "bg-success" : w.status === "ON_DELIVERY" ? "bg-blue-500 animate-pulse" : "bg-amber-400"}`} />
                        {getStatusLabel(w.status)}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-xs font-bold text-foreground">
                      {getActiveTask(w.id)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 font-mono text-xs">
                        {visiblePasswords[w.id] ? (
                          <span className="text-white bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded font-bold select-all">{w.password || "worker123"}</span>
                        ) : (
                          <span className="text-zinc-600 tracking-widest font-bold">••••••••</span>
                        )}
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility(w.id)}
                          className="text-muted hover:text-foreground transition-colors p-1 cursor-pointer focus:outline-none"
                          title={visiblePasswords[w.id] ? "Hide Password" : "Show Password"}
                        >
                          {visiblePasswords[w.id] ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2 items-center">
                        <button 
                          onClick={() => handleAssignShift(w.id, w.name)}
                          className="bg-brand-600/10 border border-brand-500/30 hover:bg-brand-600 hover:text-white text-brand-500 px-3 py-1.5 rounded-lg text-xs font-bold transition-all inline-flex items-center cursor-pointer gap-1"
                        >
                          <Bell className="w-3.5 h-3.5" /> Broadcast Alert
                        </button>
                        <button 
                          onClick={() => {
                            if (confirm(`Roster Override: Are you sure you want to permanently remove worker ${w.name} (${w.id})?`)) {
                              removeWorkforceMember(w.id);
                            }
                          }}
                          className="bg-red-500/10 border border-red-500/20 hover:bg-red-600 hover:text-white text-red-400 p-2 rounded-lg text-xs font-bold transition-all inline-flex items-center cursor-pointer"
                          title="Delete Worker Account"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center p-8 text-muted">
                    No workforce members found matching search parameters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DOCK PROVISIONING MODAL FOR STORE MANAGERS */}
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
                  <h3 className="text-base font-bold text-foreground">Provision Local Worker</h3>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="text-muted hover:text-foreground cursor-pointer p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleRegisterWorker} className="p-6 space-y-4">
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
                      placeholder="e.g. Marcus Miller" 
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

                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">Ground Job Designation</label>
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

                <div className="flex gap-2 p-3 bg-brand-500/5 border border-brand-500/10 rounded-lg text-xs text-brand-400">
                  <AlertCircle className="w-4 h-4 shrink-0 text-brand-500" />
                  <span>The new worker will be assigned to **{activeStoreName} Hub** with first-time password setup enabled.</span>
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
                    Activate & Generate Temp Password
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
