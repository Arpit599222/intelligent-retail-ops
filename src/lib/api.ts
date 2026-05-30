/**
 * Frontend API client — communicates with the Express backend
 * which in turn queries Databricks.
 *
 * All calls go through the Vite proxy:  /api/* → http://localhost:3001/api/*
 */

const BASE = '/api';

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('jwt_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    (headers as any)['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${endpoint}`, {
    headers,
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || error.error || error.code || 'API request failed');
  }

  return res.json();
}

// ==================== AUTH ====================

export interface LoginResponse {
  success: boolean;
  code: string;
  requiresPasswordChange?: boolean;
  token?: string;
  sessionId?: string;
  user?: {
    userId: string;
    email: string;
    name: string;
    role: string;
    designation?: string;
    storeId?: string;
  };
}

export const authApi = {
  login: (email: string, password: string) =>
    request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  firstLoginChangePassword: (userId: string, temporaryPassword: string, newPassword: string) =>
    request<LoginResponse>('/auth/first-login-change-password', {
      method: 'POST',
      body: JSON.stringify({ userId, temporaryPassword, newPassword }),
    }),

  logout: (sessionId: string) =>
    request<{ success: boolean }>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    }),

  me: () =>
    request<{ success: boolean; user: any }>('/auth/me'),
};

// ==================== STORES ====================

export interface Store {
  store_id: string;
  name: string;
  type: string;
  address: string | null;
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
}

export const storesApi = {
  list: () => request<Store[]>('/stores'),
  get: (id: string) => request<Store>(`/stores/${id}`),
};

// ==================== INVENTORY ====================

export interface InventoryItem {
  inventory_id: string;
  sku: string;
  name: string;
  quantity: number;
  store_id: string;
  location: string;
  min_threshold: number;
  last_restocked_at: string | null;
  store_name: string;
}

export interface InventoryStats {
  totalSkus: number;
  totalUnits: number;
  lowStockCount: number;
}

export const inventoryApi = {
  list: (storeId?: string) =>
    request<InventoryItem[]>(`/inventory${storeId ? `?storeId=${storeId}` : ''}`),

  stats: (storeId?: string) =>
    request<InventoryStats>(`/inventory/stats${storeId ? `?storeId=${storeId}` : ''}`),

  addSku: (data: { sku: string; name: string; quantity: number; storeId: string; location?: string }) =>
    request<{ success: boolean; inventoryId: string }>('/inventory/add', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  restock: (data: { inventoryId?: string; sku?: string; storeId: string; quantity: number; location?: string }) =>
    request<{ success: boolean }>('/inventory/restock', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateQuantity: (data: { sku: string; storeId: string; quantity: number }) =>
    request<{ success: boolean }>('/inventory/update-quantity', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ==================== TRANSFERS ====================

export interface Transfer {
  transfer_id: string;
  origin_store_id: string;
  destination_store_id: string;
  origin_store_name: string;
  destination_store_name: string;
  worker_id: string | null;
  worker_name: string | null;
  status: string;
  cartons: number;
  eta_minutes: number | null;
  pickup_latitude: number | null;
  pickup_longitude: number | null;
  destination_latitude: number | null;
  destination_longitude: number | null;
  current_latitude: number | null;
  current_longitude: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TransferHistory {
  history_id: string;
  transfer_id: string;
  old_status: string | null;
  new_status: string;
  changed_by: string | null;
  changed_at: string;
  notes: string | null;
}

export const transfersApi = {
  list: (storeId?: string) =>
    request<Transfer[]>(`/transfers${storeId ? `?storeId=${storeId}` : ''}`),

  approve: (id: string) =>
    request<{ success: boolean }>(`/transfers/approve/${id}`, { method: 'POST' }),

  assign: (id: string, workerId: string) =>
    request<{ success: boolean }>(`/transfers/assign/${id}`, {
      method: 'POST',
      body: JSON.stringify({ workerId }),
    }),

  updateStatus: (id: string, status: string) =>
    request<{ success: boolean }>(`/transfers/status/${id}`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    }),

  history: (id: string) =>
    request<TransferHistory[]>(`/transfers/history/${id}`),
};

// ==================== WORKFORCE ====================

export interface Worker {
  worker_id: string;
  name: string;
  email: string;
  designation: string;
  status: string;
  store_id: string;
  store_name: string;
  active_task_id: string | null;
  shift_start: string | null;
  shift_end: string | null;
  role: string;
}

export const workforceApi = {
  list: (storeId?: string) =>
    request<Worker[]>(`/workforce${storeId ? `?storeId=${storeId}` : ''}`),

  add: (data: { name: string; email: string; designation?: string; storeId: string; role: string }) =>
    request<{ success: boolean; workerId: string; userId: string; temporaryPassword?: string }>('/workforce/add', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  remove: (workerId: string) =>
    request<{ success: boolean }>(`/workforce/remove/${workerId}`, { method: 'POST' }),

  clockIn: (workerId: string) =>
    request<{ success: boolean }>(`/workforce/clock-in/${workerId}`, { method: 'POST' }),

  clockOut: (workerId: string) =>
    request<{ success: boolean }>(`/workforce/clock-out/${workerId}`, { method: 'POST' }),

  updateStatus: (workerId: string, status: string) =>
    request<{ success: boolean }>(`/workforce/status/${workerId}`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    }),

  getAttendanceStatus: (workerId: string) =>
    request<{
      success: boolean;
      currentStatus: string;
      isOnline: boolean;
      clockInTime: string | null;
      clockOutTime: string | null;
      totalHours: number | null;
    }>(`/workforce/attendance-status/${workerId}`),

  getAdminStats: () =>
    request<{
      success: boolean;
      totalWorkers: number;
      clockedIn: number;
      clockedOut: number;
      presentToday: number;
      absentToday: number;
    }>('/workforce/admin-stats'),

  getManagerStats: (storeId: string) =>
    request<{
      success: boolean;
      assignedWorkers: number;
      workersActive: number;
      workersOffline: number;
    }>(`/workforce/manager-stats/${storeId}`),
};

// ==================== LOGS ====================

export interface ActivityLog {
  log_id: string;
  user_id: string | null;
  store_id: string | null;
  message: string;
  type: string;
  created_at: string;
}

export const logsApi = {
  list: (storeId?: string, limit = 50) =>
    request<ActivityLog[]>(`/logs?limit=${limit}${storeId ? `&storeId=${storeId}` : ''}`),

  add: (data: { userId?: string; storeId?: string; message: string; type: string }) =>
    request<{ success: boolean; logId: string }>('/logs', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ==================== HEALTH ====================

export const healthApi = {
  check: () => request<{ status: string; timestamp: string }>('/health'),
};
