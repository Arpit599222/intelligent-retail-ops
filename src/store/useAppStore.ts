"use client";

import { create } from "zustand";

export type Role = "SUPER_ADMIN" | "STORE_MANAGER" | "OPERATIONS_STAFF";
export type WorkerStatus = "ONLINE" | "OFFLINE" | "BUSY" | "ON_DELIVERY";
export type WorkerDesignation = "Inventory Handler" | "Delivery Staff" | "Warehouse Staff" | "Store Manager" | "Super Admin";

export interface User {
  userId?: string;
  email: string;
  name: string;
  role: Role;
  storeId?: string;
  storeName?: string;
  workerId?: string;
  designation?: WorkerDesignation;
  status?: WorkerStatus;
  firstLogin?: boolean;
}

export interface WorkforceMember {
  id: string;
  name: string;
  email: string;
  username?: string; // Username added for creation form sync
  password?: string; // Mock password field for authentication
  role: Role;
  designation?: WorkerDesignation;
  status: WorkerStatus;
  storeId: string;
  storeName: string;
  activeTaskId?: string;
  firstLogin?: boolean; // Mock first login flag
}

export type TransferStatus =
  | "PENDING"
  | "APPROVED"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "VERIFIED"
  | "COMPLETED"
  | "DELAYED";

export type Coordinate = [number, number];

export interface TransferTask {
  id: string;
  workerId?: string;
  workerName?: string;
  storeId: string;
  storeName: string;
  status: TransferStatus;
  pickupLocation: Coordinate;
  destinationLocation: Coordinate;
  currentLocation: Coordinate;
  route: Coordinate[];
  routeProgressIndex: number;
  eta: number; // minutes
  cartons: number;
  lastUpdate: string;
}

export interface ActivityLog {
  time: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
}

export interface Toast {
  id: string;
  message: string;
  type: "success" | "info" | "warning" | "error";
}

// Indian Route Approximation (Mumbai to Delhi)
const INDIAN_ROUTE: Coordinate[] = [
  [19.0760, 72.8777],
  [19.7180, 73.1593],
  [20.3600, 73.4409],
  [21.0020, 73.7225],
  [21.6440, 74.0041],
  [22.2860, 74.2857],
  [22.9280, 74.5673],
  [23.5700, 74.8489],
  [24.2120, 75.1305],
  [24.8540, 75.4121],
  [25.4960, 75.6937],
  [26.1380, 75.9753],
  [26.7800, 76.2569],
  [27.4220, 76.5385],
  [28.0640, 76.8201],
  [28.7041, 77.1025]
];

const INITIAL_TRANSFERS: TransferTask[] = [
  {
    id: "TRX-8821",
    workerId: "W-402",
    workerName: "Alex M.",
    storeId: "ST-003",
    storeName: "LA Mega Hub",
    status: "APPROVED",
    pickupLocation: INDIAN_ROUTE[0],
    destinationLocation: INDIAN_ROUTE[INDIAN_ROUTE.length - 1],
    currentLocation: INDIAN_ROUTE[0],
    route: INDIAN_ROUTE,
    routeProgressIndex: 0,
    eta: 14,
    cartons: 42,
    lastUpdate: new Date().toLocaleTimeString(),
  },
  {
    id: "TRX-9042",
    storeId: "ST-003",
    storeName: "LA Mega Hub",
    status: "PENDING",
    pickupLocation: INDIAN_ROUTE[0],
    destinationLocation: INDIAN_ROUTE[INDIAN_ROUTE.length - 1],
    currentLocation: INDIAN_ROUTE[0],
    route: INDIAN_ROUTE,
    routeProgressIndex: 0,
    eta: 25,
    cartons: 110,
    lastUpdate: new Date().toLocaleTimeString(),
  }
];

const INITIAL_WORKFORCE: WorkforceMember[] = [
  { id: "W-402", name: "Alex M.", email: "alex@company.com", password: "worker123", role: "OPERATIONS_STAFF", designation: "Delivery Staff", status: "OFFLINE", storeId: "ST-003", storeName: "LA Mega Hub", activeTaskId: "TRX-8821", firstLogin: false },
  { id: "W-110", name: "Sarah K.", email: "sarah.k@company.com", password: "worker123", role: "OPERATIONS_STAFF", designation: "Inventory Handler", status: "ONLINE", storeId: "ST-003", storeName: "LA Mega Hub", firstLogin: false },
  { id: "W-884", name: "David W.", email: "david@company.com", password: "worker123", role: "OPERATIONS_STAFF", designation: "Warehouse Staff", status: "OFFLINE", storeId: "ST-003", storeName: "LA Mega Hub", firstLogin: false },
  { id: "W-902", name: "Emma T.", email: "emma@company.com", password: "worker123", role: "OPERATIONS_STAFF", designation: "Inventory Handler", status: "ONLINE", storeId: "ST-004", storeName: "NYC Hub", firstLogin: false },
  { id: "W-213", name: "Mike J.", email: "mike@company.com", password: "worker123", role: "OPERATIONS_STAFF", designation: "Delivery Staff", status: "OFFLINE", storeId: "ST-004", storeName: "NYC Hub", firstLogin: false },
  { id: "M-101", name: "Manager Sarah", email: "sarah@company.com", password: "worker123", role: "STORE_MANAGER", status: "ONLINE", storeId: "ST-003", storeName: "LA Mega Hub", firstLogin: false },
  { id: "W-314", name: "Rahul S.", email: "rahul@company.com", password: "worker123", role: "OPERATIONS_STAFF", designation: "Warehouse Staff", status: "ONLINE", storeId: "ST-005", storeName: "Mumbai Central Hub", firstLogin: false },
  { id: "W-512", name: "Priya M.", email: "priya@company.com", password: "worker123", role: "OPERATIONS_STAFF", designation: "Inventory Handler", status: "ONLINE", storeId: "ST-006", storeName: "Delhi NCR Hub", firstLogin: false },
];


export interface AttendanceStatus {
  currentStatus: string;
  isOnline: boolean;
  clockInTime: string | null;
  clockOutTime: string | null;
  totalHours: number | null;
}

export interface AdminStats {
  totalWorkers: number;
  clockedIn: number;
  clockedOut: number;
  presentToday: number;
  absentToday: number;
}

export interface ManagerStats {
  assignedWorkers: number;
  workersActive: number;
  workersOffline: number;
}

interface AppState {
  user: User | null;
  transfers: TransferTask[];
  activityLogs: ActivityLog[];
  toasts: Toast[];
  inventory: { sku: string; name: string; quantity: number; location: string }[];
  workforce: WorkforceMember[];
  
  sessionId: string | null;
  requiresPasswordChange: boolean;
  pendingUserId: string | null;

  attendanceStatus: AttendanceStatus | null;
  adminStats: AdminStats | null;
  managerStats: ManagerStats | null;

  activeProcess: string | null;

  // Actions
  setActiveProcess: (process: string | null) => void;
  login: (email: string, password: string) => Promise<{ success: boolean; code: string; redirectUrl?: string; requiresPasswordChange?: boolean; userId?: string }>;
  firstLoginChangePassword: (userId: string, tempPass: string, newPass: string) => Promise<{ success: boolean; code: string; redirectUrl?: string }>;
  logout: () => Promise<void>;
  setUser: (user: User | null, sessionId?: string | null) => void;
  addToast: (message: string, type: Toast["type"]) => void;
  removeToast: (id: string) => void;
  addLog: (message: string, type: ActivityLog["type"]) => void;
  
  // Workflows
  approveTransfer: (id: string) => void;
  assignWorker: (id: string, workerId: string, workerName: string) => void;
  updateTransferStatus: (id: string, status: TransferStatus) => void;
  simulateGpsProgress: () => void;

  // Workforce Actions
  clockIn: (workerId: string) => Promise<void>;
  clockOut: (workerId: string) => Promise<void>;
  updateWorkerStatus: (workerId: string, status: WorkerStatus) => Promise<void>;
  addWorkforceMember: (member: Omit<WorkforceMember, "id" | "status" | "activeTaskId">) => Promise<{ success: boolean; temporaryPassword?: string }>;
  removeWorkforceMember: (workerId: string) => Promise<void>;
  fetchWorkforce: (storeId?: string) => Promise<void>;

  // Attendance & Stats Actions
  fetchAttendanceStatus: (workerId: string) => Promise<void>;
  fetchAdminStats: () => Promise<void>;
  fetchManagerStats: (storeId: string) => Promise<void>;

  // Inventory Actions
  fetchInventory: (storeId?: string) => Promise<void>;
  addInventoryItem: (data: { sku: string; name: string; quantity: number; storeId: string; location?: string }) => Promise<{ success: boolean }>;
  restockInventoryItem: (data: { inventoryId?: string; sku?: string; storeId: string; quantity: number; location?: string }) => Promise<{ success: boolean }>;
  updateInventoryQuantity: (data: { sku: string; storeId: string; quantity: number }) => Promise<{ success: boolean }>;
}

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  transfers: INITIAL_TRANSFERS,
  toasts: [],
  activityLogs: [
    { time: "19:00:00", message: "System Initialized", type: "info" },
  ],
  inventory: [
    { sku: "SKU-9901", name: "Eco Packaging Cartons (Large)", quantity: 2450, location: "Aisle 4, Shelf A" },
    { sku: "SKU-4820", name: "Heavy Duty Strapping Tape", quantity: 840, location: "Aisle 12, Shelf C" },
    { sku: "SKU-3129", name: "Industrial Stretch Wrap Roll", quantity: 180, location: "Dock Area" },
  ],
  workforce: INITIAL_WORKFORCE,

  sessionId: localStorage.getItem('sessionId'),
  requiresPasswordChange: false,
  pendingUserId: null,

  attendanceStatus: null,
  adminStats: null,
  managerStats: null,

  activeProcess: null,

  setUser: (user, sessionId) => set({ user, sessionId: sessionId || null }),
  setActiveProcess: (process) => set({ activeProcess: process }),

  login: async (email, password) => {
    get().setActiveProcess('Logging you in...');
    try {
      const { authApi } = await import('@/lib/api');
      const res = await authApi.login(email, password);
      if (res.success && res.requiresPasswordChange && res.user) {
        set({ 
          requiresPasswordChange: true, 
          pendingUserId: res.user.userId 
        });
        return { 
          success: true, 
          code: 'PASSWORD_CHANGE_REQUIRED',
          requiresPasswordChange: true,
          userId: res.user.userId
        };
      } else if (res.success && res.token && res.user) {
        localStorage.setItem('jwt_token', res.token);
        if (res.sessionId) {
          localStorage.setItem('sessionId', res.sessionId);
          set({ sessionId: res.sessionId });
        }
        
        set({ 
          user: res.user as any, 
          requiresPasswordChange: false,
          pendingUserId: null
        });
        
        let redirectUrl = '/login';
        if (res.user.role === 'SUPER_ADMIN') {
          redirectUrl = '/admin';
        } else if (res.user.role === 'STORE_MANAGER') {
          redirectUrl = '/manager';
        } else if (res.user.role === 'OPERATIONS_STAFF' || res.user.role === 'WORKER') {
          const designation = res.user.designation;
          if (designation === 'Delivery Staff') {
            redirectUrl = '/delivery-staff';
          } else if (designation === 'Warehouse Staff') {
            redirectUrl = '/warehouse-staff';
          } else {
            redirectUrl = '/inventory-handler';
          }
        }
        
        get().addToast(`Logged in successfully as ${res.user.name}`, 'success');
        get().addLog(`${res.user.name} logged into the system`, 'info');
        return { success: true, code: 'SUCCESS', redirectUrl };
      }
      return { success: false, code: res.code || 'Failed to login' };
    } catch (err: any) {
      return { success: false, code: err.message || 'Server error' };
    } finally {
      get().setActiveProcess(null);
    }
  },

  firstLoginChangePassword: async (userId, tempPass, newPass) => {
    get().setActiveProcess('Saving your new password...');
    try {
      const { authApi } = await import('@/lib/api');
      const res = await authApi.firstLoginChangePassword(userId, tempPass, newPass);
      if (res.success && res.token && res.user) {
        localStorage.setItem('jwt_token', res.token);
        if (res.sessionId) {
          localStorage.setItem('sessionId', res.sessionId);
          set({ sessionId: res.sessionId });
        }
        
        set({ 
          user: res.user as any, 
          requiresPasswordChange: false,
          pendingUserId: null
        });
        
        let redirectUrl = '/login';
        if (res.user.role === 'SUPER_ADMIN') {
          redirectUrl = '/admin';
        } else if (res.user.role === 'STORE_MANAGER') {
          redirectUrl = '/manager';
        } else if (res.user.role === 'OPERATIONS_STAFF' || res.user.role === 'WORKER') {
          const designation = res.user.designation;
          if (designation === 'Delivery Staff') {
            redirectUrl = '/delivery-staff';
          } else if (designation === 'Warehouse Staff') {
            redirectUrl = '/warehouse-staff';
          } else {
            redirectUrl = '/inventory-handler';
          }
        }
        
        get().addToast('Password changed successfully!', 'success');
        return { success: true, code: 'SUCCESS', redirectUrl };
      }
      return { success: false, code: res.code || 'UNKNOWN_ERROR' };
    } catch (err: any) {
      return { success: false, code: err.message || 'Password change failed' };
    } finally {
      get().setActiveProcess(null);
    }
  },

  logout: async () => {
    try {
      const { authApi } = await import('@/lib/api');
      const sessionId = get().sessionId;
      if (sessionId) {
        await authApi.logout(sessionId).catch(() => {});
      }
    } finally {
      localStorage.removeItem('jwt_token');
      const prevUser = get().user;
      set({ user: null, sessionId: null });
      if (prevUser) {
        get().addToast('Logged out successfully', 'info');
      }
    }
  },

  addToast: (message, type) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
    setTimeout(() => get().removeToast(id), 4000);
  },

  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },

  addLog: (message, type) => {
    const time = new Date().toLocaleTimeString();
    set((state) => ({
      activityLogs: [{ time, message, type }, ...state.activityLogs].slice(0, 50),
    }));
  },

  approveTransfer: (id) => {
    set((state) => ({
      transfers: state.transfers.map((t) =>
        t.id === id ? { ...t, status: "APPROVED", lastUpdate: new Date().toLocaleTimeString() } : t
      ),
    }));
    get().addToast(`Transfer request ${id} Approved by HQ`, "success");
    get().addLog(`Transfer ${id} status updated to APPROVED`, "info");
  },

  assignWorker: (id, workerId, workerName) => {
    set((state) => ({
      transfers: state.transfers.map((t) =>
        t.id === id
          ? {
              ...t,
              status: "APPROVED",
              workerId,
              workerName,
              lastUpdate: new Date().toLocaleTimeString(),
            }
          : t
      ),
      workforce: state.workforce.map((w) =>
        w.id === workerId ? { ...w, activeTaskId: id, status: "BUSY" } : w
      ),
    }));
    
    // Update active user status if they are the one assigned
    const currentUser = get().user;
    if (currentUser && currentUser.workerId === workerId) {
      set({ user: { ...currentUser, status: "BUSY" } });
    }

    get().addToast(`${workerName} assigned to transfer ${id}`, "info");
    get().addLog(`${workerName} assigned to ${id}`, "info");
  },

  updateTransferStatus: (id, status) => {
    let assignedWorkerId: string | undefined = undefined;

    set((state) => {
      const updatedTransfers = state.transfers.map((t) => {
        if (t.id === id) {
          assignedWorkerId = t.workerId;
          const updateData: Partial<TransferTask> = { status, lastUpdate: new Date().toLocaleTimeString() };
          if (status === "PICKED_UP") {
            updateData.routeProgressIndex = 0;
            updateData.currentLocation = t.route[0];
          } else if (status === "IN_TRANSIT") {
            updateData.routeProgressIndex = 1;
            updateData.currentLocation = t.route[1];
          } else if (status === "COMPLETED") {
            updateData.eta = 0;
          }
          return { ...t, ...updateData };
        }
        return t;
      });

      // Synchronize worker status
      let updatedWorkforce = state.workforce;
      if (assignedWorkerId) {
        let newWorkerStatus: WorkerStatus = "ONLINE";
        if (status === "PICKED_UP") newWorkerStatus = "BUSY";
        else if (status === "IN_TRANSIT") newWorkerStatus = "ON_DELIVERY";
        else if (status === "DELIVERED") newWorkerStatus = "BUSY";
        else if (status === "COMPLETED") newWorkerStatus = "ONLINE";

        updatedWorkforce = state.workforce.map((w) =>
          w.id === assignedWorkerId
            ? {
                ...w,
                status: newWorkerStatus,
                activeTaskId: status === "COMPLETED" ? undefined : w.activeTaskId,
              }
            : w
        );

        // Update active user status if it's them
        const currentUser = state.user;
        if (currentUser && currentUser.workerId === assignedWorkerId) {
          setTimeout(() => {
            set({ user: { ...currentUser, status: newWorkerStatus } });
          }, 0);
        }
      }

      return { transfers: updatedTransfers, workforce: updatedWorkforce };
    });
    
    let toastType: Toast["type"] = "info";
    if (status === "COMPLETED") toastType = "success";
    if (status === "DELAYED") toastType = "error";

    get().addToast(`Transfer ${id} is now ${status}`, toastType);
    get().addLog(`Transfer ${id} updated to ${status}`, toastType === "error" ? "error" : "info");
  },

  simulateGpsProgress: () => {
    set((state) => {
      let stateChanged = false;
      let targetWorkerId: string | undefined = undefined;
      let finalStatus: TransferStatus | undefined = undefined;

      const updatedTransfers = state.transfers.map((t): TransferTask => {
        if (t.status === "IN_TRANSIT") {
          stateChanged = true;
          targetWorkerId = t.workerId;
          if (t.routeProgressIndex < t.route.length - 1) {
            const nextIdx = t.routeProgressIndex + 1;
            return {
              ...t,
              routeProgressIndex: nextIdx,
              currentLocation: t.route[nextIdx],
              eta: Math.max(1, t.eta - 1),
              lastUpdate: new Date().toLocaleTimeString(),
            };
          } else {
            get().addLog(`${t.workerName || "Driver"} reached destination`, "success");
            finalStatus = "DELIVERED";
            return { ...t, status: "DELIVERED", lastUpdate: new Date().toLocaleTimeString() };
          }
        }
        return t;
      });

      let updatedWorkforce = state.workforce;
      if (stateChanged && targetWorkerId && finalStatus === "DELIVERED") {
        updatedWorkforce = state.workforce.map((w) =>
          w.id === targetWorkerId ? { ...w, status: "BUSY" } : w
        );
        
        const currentUser = state.user;
        if (currentUser && currentUser.workerId === targetWorkerId) {
          setTimeout(() => {
            set({ user: { ...currentUser, status: "BUSY" } });
          }, 0);
        }
      }

      return stateChanged ? { transfers: updatedTransfers, workforce: updatedWorkforce } : {};
    });
  },

  clockIn: async (workerId) => {
    get().setActiveProcess('Clocking in shift...');
    try {
      const { workforceApi } = await import('@/lib/api');
      const res = await workforceApi.clockIn(workerId);
      if (res.success) {
        await get().fetchAttendanceStatus(workerId);
        
        const currentUser = get().user;
        if (currentUser) {
          if (currentUser.role === 'SUPER_ADMIN') {
            await get().fetchAdminStats();
          } else if (currentUser.role === 'STORE_MANAGER' && currentUser.storeId) {
            await get().fetchManagerStats(currentUser.storeId);
          }
        }

        set((state) => {
          const updatedWorkforce = state.workforce.map((w) =>
            w.id === workerId ? { ...w, status: "ONLINE" as WorkerStatus } : w
          );
          return { workforce: updatedWorkforce };
        });

        const worker = get().workforce.find((w) => w.id === workerId) || { name: currentUser?.name || workerId };
        get().addToast(`${worker.name} clocked in`, "success");
        get().addLog(`${worker.name} clocked in for standard shift`, "success");
      }
    } catch (err: any) {
      get().addToast(err.message || 'Clock in failed', 'error');
    } finally {
      get().setActiveProcess(null);
    }
  },

  clockOut: async (workerId) => {
    get().setActiveProcess('Clocking out shift...');
    try {
      const { workforceApi } = await import('@/lib/api');
      const res = await workforceApi.clockOut(workerId);
      if (res.success) {
        await get().fetchAttendanceStatus(workerId);
        
        const currentUser = get().user;
        if (currentUser) {
          if (currentUser.role === 'SUPER_ADMIN') {
            await get().fetchAdminStats();
          } else if (currentUser.role === 'STORE_MANAGER' && currentUser.storeId) {
            await get().fetchManagerStats(currentUser.storeId);
          }
        }

        set((state) => {
          const updatedWorkforce = state.workforce.map((w) =>
            w.id === workerId ? { ...w, status: "OFFLINE" as WorkerStatus } : w
          );
          return { workforce: updatedWorkforce };
        });

        const worker = get().workforce.find((w) => w.id === workerId) || { name: currentUser?.name || workerId };
        get().addToast(`${worker.name} clocked out`, "info");
        get().addLog(`${worker.name} clocked out from shift`, "info");
      }
    } catch (err: any) {
      get().addToast(err.message || 'Clock out failed', 'error');
    } finally {
      get().setActiveProcess(null);
    }
  },

  fetchAttendanceStatus: async (workerId) => {
    try {
      const { workforceApi } = await import('@/lib/api');
      const res = await workforceApi.getAttendanceStatus(workerId);
      if (res.success) {
        set({ attendanceStatus: res });
        
        const mappedStatus = res.currentStatus === 'CLOCKED_IN' ? 'ONLINE' : 'OFFLINE';
        set((state) => {
          const currentUser = state.user;
          const updatedUser =
            currentUser && (currentUser.workerId === workerId || currentUser.email === workerId || currentUser.userId === workerId)
              ? { ...currentUser, status: mappedStatus as WorkerStatus }
              : currentUser;
          return { user: updatedUser };
        });
      }
    } catch (err) {
      console.error('Failed to fetch attendance status', err);
    }
  },

  fetchAdminStats: async () => {
    try {
      const { workforceApi } = await import('@/lib/api');
      const res = await workforceApi.getAdminStats();
      if (res.success) {
        set({ adminStats: res });
      }
    } catch (err) {
      console.error('Failed to fetch admin stats', err);
    }
  },

  fetchManagerStats: async (storeId) => {
    try {
      const { workforceApi } = await import('@/lib/api');
      const res = await workforceApi.getManagerStats(storeId);
      if (res.success) {
        set({ managerStats: res });
      }
    } catch (err) {
      console.error('Failed to fetch manager stats', err);
    }
  },

  updateWorkerStatus: async (workerId, status) => {
    try {
      const { workforceApi } = await import('@/lib/api');
      const res = await workforceApi.updateStatus(workerId, status);
      if (res.success) {
        set((state) => {
          const updatedWorkforce = state.workforce.map((w) =>
            w.id === workerId ? { ...w, status } : w
          );

          const currentUser = state.user;
          const updatedUser =
            currentUser && currentUser.workerId === workerId
              ? { ...currentUser, status }
              : currentUser;

          return { workforce: updatedWorkforce, user: updatedUser };
        });
        const worker = get().workforce.find((w) => w.id === workerId);
        if (worker) {
          get().addToast(`${worker.name} status updated to ${status}`, "info");
          get().addLog(`${worker.name} set to ${status}`, "info");
        }
      }
    } catch (err: any) {
      get().addToast(err.message || 'Failed to update status', 'error');
    }
  },

  addWorkforceMember: async (member) => {
    get().setActiveProcess(`Creating profile of ${member.name}...`);
    try {
      const { workforceApi } = await import('@/lib/api');
      const res = await workforceApi.add({
        name: member.name,
        email: member.email,
        designation: member.designation,
        storeId: member.storeId,
        role: member.role
      });
      
      if (res.success && res.workerId) {
        const newMember: WorkforceMember = {
          ...member,
          id: res.workerId,
          status: "OFFLINE",
          firstLogin: true
        };
        set((state) => ({
          workforce: [...state.workforce, newMember],
        }));
        get().addToast(`Account created for ${member.name}`, "success");
        get().addLog(`Global personnel provisioning: ${res.workerId} registered`, "success");
        return { success: true, temporaryPassword: res.temporaryPassword };
      }
      return { success: false };
    } catch (err: any) {
      get().addToast(err.message || 'Failed to provision account', 'error');
      console.error(err);
      return { success: false };
    } finally {
      get().setActiveProcess(null);
    }
  },

  removeWorkforceMember: async (workerId) => {
    try {
      const { workforceApi } = await import('@/lib/api');
      const res = await workforceApi.remove(workerId);
      if (res.success) {
        const worker = get().workforce.find((w) => w.id === workerId);
        set((state) => ({
          workforce: state.workforce.filter((w) => w.id !== workerId),
        }));
        if (worker) {
          get().addToast(`Account removed for ${worker.name}`, "warning");
          get().addLog(`Personnel removed: ${worker.name} (${worker.id}) has been removed by supervisor/admin`, "warning");
        }
      }
    } catch (err: any) {
      get().addToast(err.message || 'Failed to remove worker', 'error');
    }
  },

  fetchWorkforce: async (storeId) => {
    try {
      const { workforceApi } = await import('@/lib/api');
      const data = await workforceApi.list(storeId);
      const mapped = data.map((item: any) => ({
        id: item.worker_id,
        name: item.name || `${item.first_name || ''} ${item.last_name || ''}`.trim(),
        email: item.email,
        role: item.role as Role,
        designation: item.designation as WorkerDesignation,
        status: (item.status || 'OFFLINE') as WorkerStatus,
        storeId: item.store_id,
        storeName: item.store_name,
        activeTaskId: item.active_task_id || undefined,
        firstLogin: item.must_change_password === true
      }));
      set({ workforce: mapped });
    } catch (err) {
      console.error('Failed to fetch workforce', err);
    }
  },

  fetchInventory: async (storeId) => {
    try {
      const { inventoryApi } = await import('@/lib/api');
      const data = await inventoryApi.list(storeId);
      set({ inventory: data.map((item: any) => ({
        sku: item.sku,
        name: item.name,
        quantity: item.quantity,
        location: item.location || 'Unassigned',
      })) });
    } catch (err) {
      console.error('Failed to fetch inventory', err);
    }
  },

  addInventoryItem: async (data) => {
    try {
      const { inventoryApi } = await import('@/lib/api');
      const res = await inventoryApi.addSku(data);
      if (res.success) {
        await get().fetchInventory(data.storeId);
        return { success: true };
      }
      return { success: false };
    } catch (err: any) {
      get().addToast(err.message || 'Failed to add SKU', 'error');
      return { success: false };
    }
  },

  restockInventoryItem: async (data) => {
    try {
      const { inventoryApi } = await import('@/lib/api');
      const res = await inventoryApi.restock(data);
      if (res.success) {
        await get().fetchInventory(data.storeId);
        return { success: true };
      }
      return { success: false };
    } catch (err: any) {
      get().addToast(err.message || 'Failed to restock inventory', 'error');
      return { success: false };
    }
  },

  updateInventoryQuantity: async (data) => {
    try {
      const { inventoryApi } = await import('@/lib/api');
      const res = await inventoryApi.updateQuantity(data);
      if (res.success) {
        await get().fetchInventory(data.storeId);
        return { success: true };
      }
      return { success: false };
    } catch (err: any) {
      get().addToast(err.message || 'Failed to update audited quantity', 'error');
      return { success: false };
    }
  },
}));
