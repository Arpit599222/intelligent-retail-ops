import { Router, Request, Response } from 'express';
import { query, table } from '../db.js';
import { table as identityTable } from '../database/databricks.js';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

const router = Router();

// GET /api/workforce?storeId=ST-003
router.get('/', async (req: Request, res: Response) => {
  try {
    const storeId = req.query.storeId as string | undefined;

    let sql = `SELECT wf.worker_id, wf.designation, wf.status, wf.store_id,
                      wf.active_task_id, wf.shift_start, wf.shift_end,
                      u.first_name, u.last_name, u.email, u.role,
                      s.name as store_name
               FROM ${table('workforce')} wf
               JOIN ${identityTable('users')} u ON wf.user_id = u.user_id
               JOIN ${table('stores')} s ON wf.store_id = s.store_id`;

    if (storeId) {
      sql += ` WHERE wf.store_id = :storeId`;
    }

    const rows = await query(sql, storeId ? { storeId } : undefined);
    
    // Map first_name + last_name to name for the frontend
    const mappedRows = rows.map((r: any) => ({
      ...r,
      name: `${r.first_name} ${r.last_name}`.trim()
    }));
    
    return res.json(mappedRows);
  } catch (err) {
    console.error('[Workforce List Error]', err);
    return res.status(500).json({ error: 'Failed to fetch workforce' });
  }
});

function generateTemporaryPassword(): string {
  const length = 10;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let password = "";
  let hasUpper = false, hasLower = false, hasNumber = false;
  
  while (!hasUpper || !hasLower || !hasNumber) {
    password = "";
    hasUpper = false;
    hasLower = false;
    hasNumber = false;
    for (let i = 0, n = charset.length; i < length; ++i) {
      const char = charset.charAt(Math.floor(Math.random() * n));
      if (/[A-Z]/.test(char)) hasUpper = true;
      else if (/[a-z]/.test(char)) hasLower = true;
      else if (/[0-9]/.test(char)) hasNumber = true;
      password += char;
    }
  }
  return password;
}

// POST /api/workforce/add — Provision a new worker
router.post('/add', async (req: Request, res: Response) => {
  try {
    const { name, email, designation, storeId, role } = req.body;

    if (!name || !email || !storeId || !role) {
      return res.status(400).json({ error: 'Missing required fields: name, email, storeId, role' });
    }

    // 1. Sanitize & Validate Email
    const emailClean = email.trim().toLowerCase();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(emailClean)) {
      return res.status(400).json({ error: 'Invalid email address format.' });
    }

    // 2. Sanitize & Validate Name (Only allow letters, spaces, hyphens, and apostrophes)
    const nameClean = name.replace(/[^\w\s\-\']/g, '').trim();
    if (!nameClean || nameClean.length < 2) {
      return res.status(400).json({ error: 'Name contains invalid characters or is too short.' });
    }

    // 3. Sanitize & Validate Role
    const allowedRoles = ['SUPER_ADMIN', 'STORE_MANAGER', 'OPERATIONS_STAFF'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role assignment.' });
    }

    // 4. Sanitize & Validate Store ID
    const storeIdRegex = /^ST-\d+$/;
    if (!storeIdRegex.test(storeId)) {
      return res.status(400).json({ error: 'Invalid Store ID format.' });
    }

    // 5. Sanitize & Validate Designation
    // 5. Sanitize & Validate Designation
    const allowedDesignations = ['Inventory Handler', 'Delivery Staff', 'Warehouse Staff', 'Store Manager', 'Super Admin'];
    let designationClean = designation ? designation.trim() : null;
    if (role === 'STORE_MANAGER') {
      designationClean = 'Store Manager';
    } else if (role === 'SUPER_ADMIN') {
      designationClean = 'Super Admin';
    } else if (!designationClean) {
      designationClean = 'Warehouse Staff'; // Safe fallback designation for operations staff
    }

    if (designationClean && !allowedDesignations.includes(designationClean)) {
      return res.status(400).json({ error: 'Invalid job designation.' });
    }

    // Check if user email already exists to prevent duplicate entries
    const existingUsers = await query<any>(
      `SELECT user_id FROM ${identityTable('users')} WHERE LOWER(email) = LOWER(:emailClean)`,
      { emailClean }
    );
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'An account with this email address already exists.' });
    }

    const tempPassword = generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 10);
    const userId = crypto.randomUUID();
    const credentialId = crypto.randomUUID();
    const resetId = crypto.randomUUID();
    const workerId = `W-${Math.floor(Math.random() * 9000) + 1000}`;
    const logId = `LOG-${Date.now()}`;
    const auditLogId = crypto.randomUUID();

    const username = emailClean.split('@')[0];
    const [firstName, ...lastNameParts] = nameClean.split(' ');
    const lastName = lastNameParts.join(' ') || 'User';

    try {
      // 1. Create user account
      await query(
        `INSERT INTO ${identityTable('users')}
         (user_id, email, username, first_name, last_name, role, status, must_change_password, created_at, updated_at)
         VALUES (:userId, :emailClean, :username, :firstName, :lastName, :role, 'ACTIVE', true, current_timestamp(), current_timestamp())`,
        { userId, emailClean, username, firstName, lastName, role }
      );

      // 2. Create credentials
      await query(
        `INSERT INTO ${identityTable('user_credentials')}
         (credential_id, user_id, password_hash, password_updated_at, failed_login_attempts, account_locked, created_at, updated_at)
         VALUES (:credentialId, :userId, :passwordHash, current_timestamp(), 0, false, current_timestamp(), current_timestamp())`,
        { credentialId, userId, passwordHash }
      );

      // 3. Create password reset history
      await query(
        `INSERT INTO ${identityTable('password_reset_history')}
         (reset_id, user_id, first_login_completed, temporary_password_issued_at)
         VALUES (:resetId, :userId, false, current_timestamp())`,
        { resetId, userId }
      );

      // 4. Create workforce entry
      await query(
        `INSERT INTO ${table('workforce')}
         (worker_id, user_id, designation, status, store_id, created_at)
         VALUES (:workerId, :userId, :designationClean, 'OFFLINE', :storeId, current_timestamp())`,
        { workerId, userId, designationClean, storeId }
      );

      // 5. Activity Log
      await query(
        `INSERT INTO ${table('activity_logs')} (log_id, store_id, message, type)
         VALUES (:logId, :storeId, :message, 'success')`,
        { logId, storeId, message: `Global personnel provisioning: ${nameClean} (${role}) registered with first-time activation` }
      );

      // 6. Audit Log
      await query(
        `INSERT INTO ${identityTable('audit_logs')} (audit_id, user_id, action_type, performed_at)
         VALUES (:auditLogId, :userId, 'ACCOUNT_CREATED', current_timestamp())`,
        { auditLogId, userId }
      );
    } catch (err) {
      console.error('[Workforce Add Error] Rollback initiated...', err);
      // Clean up/rollback partially created records to allow clean retry
      await query(`DELETE FROM ${identityTable('users')} WHERE user_id = :userId`, { userId }).catch(() => {});
      await query(`DELETE FROM ${identityTable('user_credentials')} WHERE user_id = :userId`, { userId }).catch(() => {});
      await query(`DELETE FROM ${identityTable('password_reset_history')} WHERE user_id = :userId`, { userId }).catch(() => {});
      await query(`DELETE FROM ${table('workforce')} WHERE user_id = :userId`, { userId }).catch(() => {});
      return res.status(500).json({ error: 'Failed to add worker due to database constraints.' });
    }

    return res.json({ success: true, workerId, userId, temporaryPassword: tempPassword });
  } catch (err) {
    console.error('[Workforce Add Route Error]', err);
    return res.status(500).json({ error: 'Failed to add worker' });
  }
});

// POST /api/workforce/remove/:workerId
router.post('/remove/:workerId', async (req: Request, res: Response) => {
  try {
    const workerId = req.params.workerId as string;

    // Validate workerId format
    const workerIdRegex = /^(W-\d+|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/i;
    if (!workerIdRegex.test(workerId)) {
      return res.status(400).json({ error: 'Invalid Worker ID format.' });
    }

    // Get user_id before deletion
    const workers = await query<{ user_id: string; store_id: string }>(
      `SELECT user_id, store_id FROM ${table('workforce')} WHERE worker_id = :workerId`,
      { workerId }
    );

    if (workers.length === 0) return res.status(404).json({ error: 'Worker not found' });

    const { user_id, store_id } = workers[0];

    // Get name for logging
    const users = await query<{ first_name: string; last_name: string }>(
      `SELECT first_name, last_name FROM ${identityTable('users')} WHERE user_id = :userId`,
      { userId: user_id }
    );
    const workerName = users.length > 0 ? `${users[0].first_name} ${users[0].last_name}`.trim() : 'Unknown';

    // Deactivate user
    await query(
      `UPDATE ${identityTable('users')} SET status = 'INACTIVE' WHERE user_id = :userId`,
      { userId: user_id }
    );

    // Log
    const logId = `LOG-${Date.now()}`;
    await query(
      `INSERT INTO ${table('activity_logs')} (log_id, store_id, message, type)
       VALUES (:logId, :storeId, :message, 'warning')`,
      { logId, storeId: store_id, message: `Personnel removed: ${workerName} (${workerId}) has been removed by supervisor/admin` }
    );

    return res.json({ success: true });
  } catch (err) {
    console.error('[Workforce Remove Error]', err);
    return res.status(500).json({ error: 'Failed to remove worker' });
  }
});

// GET /api/workforce/admin-stats
router.get('/admin-stats', async (req: Request, res: Response) => {
  try {
    const totalRes = await query<{ total: number }>(
      `SELECT count(*) as total FROM ${identityTable('users')} WHERE role IN ('OPERATIONS_STAFF', 'WORKER') AND status = 'ACTIVE'`
    );
    const activeRes = await query<{ clocked_in: number }>(
      `SELECT count(*) as clocked_in FROM ${identityTable('live_attendance_status')} WHERE current_status = 'CLOCKED_IN'`
    );
    const presentRes = await query<{ present_today: number }>(
      `SELECT count(distinct user_id) as present_today FROM ${identityTable('attendance_records')} WHERE to_date(clock_in_time) = current_date()`
    );

    const totalWorkers = totalRes[0]?.total || 0;
    const clockedIn = activeRes[0]?.clocked_in || 0;
    const presentToday = presentRes[0]?.present_today || 0;
    const clockedOut = Math.max(0, totalWorkers - clockedIn);
    const absentToday = Math.max(0, totalWorkers - presentToday);

    return res.json({
      success: true,
      totalWorkers,
      clockedIn,
      clockedOut,
      presentToday,
      absentToday
    });
  } catch (err) {
    console.error('[Admin Stats Error]', err);
    return res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
});

// GET /api/workforce/manager-stats/:storeId
router.get('/manager-stats/:storeId', async (req: Request, res: Response) => {
  try {
    const storeId = req.params.storeId as string;
    const storeIdRegex = /^ST-\d+$/;
    if (!storeIdRegex.test(storeId)) {
      return res.status(400).json({ error: 'Invalid Store ID format.' });
    }

    const assignedRes = await query<{ assigned: number }>(
      `SELECT count(*) as assigned 
       FROM ${table('workforce')} wf 
       JOIN ${identityTable('users')} u ON wf.user_id = u.user_id 
       WHERE wf.store_id = :storeId AND u.status = 'ACTIVE'`,
      { storeId }
    );

    const activeRes = await query<{ active: number }>(
      `SELECT count(*) as active 
       FROM ${table('workforce')} wf 
       JOIN ${identityTable('live_attendance_status')} las ON wf.user_id = las.user_id 
       JOIN ${identityTable('users')} u ON wf.user_id = u.user_id 
       WHERE wf.store_id = :storeId AND las.current_status = 'CLOCKED_IN' AND u.status = 'ACTIVE'`,
      { storeId }
    );

    const assigned = assignedRes[0]?.assigned || 0;
    const active = activeRes[0]?.active || 0;
    const offline = Math.max(0, assigned - active);

    return res.json({
      success: true,
      assignedWorkers: assigned,
      workersActive: active,
      workersOffline: offline
    });
  } catch (err) {
    console.error('[Manager Stats Error]', err);
    return res.status(500).json({ error: 'Failed to fetch manager stats' });
  }
});

// GET /api/workforce/attendance-status/:workerId
router.get('/attendance-status/:workerId', async (req: Request, res: Response) => {
  try {
    const workerId = req.params.workerId as string;
    const workerIdRegex = /^(W-\d+|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/i;
    if (!workerIdRegex.test(workerId)) {
      return res.status(400).json({ error: 'Invalid Worker ID format.' });
    }

    const userRes = await query<any>(
      `SELECT u.user_id, u.status, u.role, wf.worker_id
       FROM ${identityTable('users')} u
       LEFT JOIN ${table('workforce')} wf ON u.user_id = wf.user_id
       WHERE wf.worker_id = :workerId OR u.user_id = :workerId OR u.email = :workerId`,
      { workerId }
    );

    if (userRes.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const userId = userRes[0].user_id;

    // Fetch live status
    const statusRes = await query<any>(
      `SELECT current_status, is_online, last_clock_in, last_clock_out 
       FROM ${identityTable('live_attendance_status')}
       WHERE user_id = :userId`,
      { userId }
    );

    // Fetch today's latest record
    const recordRes = await query<any>(
      `SELECT clock_in_time, clock_out_time, total_hours 
       FROM ${identityTable('attendance_records')}
       WHERE user_id = :userId 
       ORDER BY clock_in_time DESC LIMIT 1`,
      { userId }
    );

    const currentStatus = statusRes.length > 0 ? statusRes[0].current_status : 'CLOCKED_OUT';
    const latestRecord = recordRes.length > 0 ? recordRes[0] : null;

    return res.json({
      success: true,
      currentStatus,
      isOnline: statusRes.length > 0 ? statusRes[0].is_online : false,
      clockInTime: latestRecord ? latestRecord.clock_in_time : null,
      clockOutTime: latestRecord ? latestRecord.clock_out_time : null,
      totalHours: latestRecord ? latestRecord.total_hours : null
    });
  } catch (err) {
    console.error('[Attendance Status Fetch Error]', err);
    return res.status(500).json({ error: 'Failed to fetch attendance status' });
  }
});

// POST /api/workforce/clock-in/:workerId
router.post('/clock-in/:workerId', async (req: Request, res: Response) => {
  try {
    const workerId = req.params.workerId as string;

    // Validate workerId format
    const workerIdRegex = /^(W-\d+|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/i;
    if (!workerIdRegex.test(workerId)) {
      return res.status(400).json({ error: 'Invalid Worker ID format.' });
    }

    // 1. Get logged-in user information & verify active user status
    const userRes = await query<any>(
      `SELECT u.user_id, u.status, u.role, wf.worker_id, wf.store_id
       FROM ${identityTable('users')} u
       LEFT JOIN ${table('workforce')} wf ON u.user_id = wf.user_id
       WHERE wf.worker_id = :workerId OR u.user_id = :workerId OR u.email = :workerId`,
      { workerId }
    );

    if (userRes.length === 0) {
      return res.status(404).json({ error: 'Deleted users clocking in is prohibited.' });
    }

    const user = userRes[0];
    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ error: 'Inactive users clocking in is prohibited.' });
    }

    const userId = user.user_id;
    const realWorkerId = user.worker_id || workerId;

    // 2. Verify no active attendance record exists (prevent double clock-in)
    const activeRecords = await query<any>(
      `SELECT record_id FROM ${identityTable('attendance_records')}
       WHERE user_id = :userId AND clock_out_time IS NULL`,
      { userId }
    );

    if (activeRecords.length > 0) {
      return res.status(400).json({ error: 'Double clock-in is prohibited.' });
    }

    // 3. Insert record into attendance_records
    const recordId = crypto.randomUUID();
    await query(
      `INSERT INTO ${identityTable('attendance_records')}
       (record_id, user_id, worker_id, clock_in_time, clock_out_time, total_hours)
       VALUES (:recordId, :userId, :realWorkerId, current_timestamp(), NULL, NULL)`,
      { recordId, userId, realWorkerId }
    );

    // 4. Update live_attendance_status
    const statusRes = await query<any>(
      `SELECT status_id FROM ${identityTable('live_attendance_status')} WHERE user_id = :userId`,
      { userId }
    );

    if (statusRes.length > 0) {
      await query(
        `UPDATE ${identityTable('live_attendance_status')}
         SET current_status = 'CLOCKED_IN', is_online = true, last_clock_in = current_timestamp()
         WHERE user_id = :userId`,
         { userId }
      );
    } else {
      const statusId = crypto.randomUUID();
      await query(
        `INSERT INTO ${identityTable('live_attendance_status')}
         (status_id, user_id, worker_id, current_status, is_online, last_clock_in, last_clock_out)
         VALUES (:statusId, :userId, :realWorkerId, 'CLOCKED_IN', true, current_timestamp(), NULL)`,
        { statusId, userId, realWorkerId }
      );
    }

    // Update old workforce table status for legacy sync
    await query(
      `UPDATE ${table('workforce')}
       SET status = 'ONLINE', shift_start = current_timestamp()
       WHERE user_id = :userId`,
      { userId }
    );

    // 5. Create audit log entry
    const auditLogId = crypto.randomUUID();
    await query(
      `INSERT INTO ${identityTable('audit_logs')} (audit_id, user_id, action_type, performed_at)
       VALUES (:auditLogId, :userId, 'CLOCK_IN', current_timestamp())`,
      { auditLogId, userId }
    );

    // Create activity log
    const logId = `LOG-${Date.now()}`;
    await query(
      `INSERT INTO ${table('activity_logs')} (log_id, store_id, message, type)
       VALUES (:logId, :storeId, :message, 'success')`,
      {
        logId,
        storeId: user.store_id || '',
        message: `Worker ${realWorkerId} clocked in for standard shift`,
      }
    );

    return res.json({ success: true });
  } catch (err) {
    console.error('[Clock In Error]', err);
    return res.status(500).json({ error: 'Failed to clock in' });
  }
});

// POST /api/workforce/clock-out/:workerId
router.post('/clock-out/:workerId', async (req: Request, res: Response) => {
  try {
    const workerId = req.params.workerId as string;

    // Validate workerId format
    const workerIdRegex = /^(W-\d+|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/i;
    if (!workerIdRegex.test(workerId)) {
      return res.status(400).json({ error: 'Invalid Worker ID format.' });
    }

    // 1. Get user details
    const userRes = await query<any>(
      `SELECT u.user_id, u.status, u.role, wf.worker_id, wf.store_id
       FROM ${identityTable('users')} u
       LEFT JOIN ${table('workforce')} wf ON u.user_id = wf.user_id
       WHERE wf.worker_id = :workerId OR u.user_id = :workerId OR u.email = :workerId`,
      { workerId }
    );

    if (userRes.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const user = userRes[0];
    const userId = user.user_id;
    const realWorkerId = user.worker_id || workerId;

    // 2. Find active attendance record
    const activeRecords = await query<any>(
      `SELECT record_id, clock_in_time FROM ${identityTable('attendance_records')}
       WHERE user_id = :userId AND clock_out_time IS NULL`,
      { userId }
    );

    if (activeRecords.length === 0) {
      return res.status(400).json({ error: 'Double clock-out is prohibited.' });
    }

    const activeRecord = activeRecords[0];
    const clockInTime = new Date(activeRecord.clock_in_time);
    const now = new Date();
    const totalHours = Math.max(0, (now.getTime() - clockInTime.getTime()) / (1000 * 60 * 60));

    // 3. Update attendance_records (clock_out_time, total_hours)
    await query(
      `UPDATE ${identityTable('attendance_records')}
       SET clock_out_time = current_timestamp(), total_hours = :totalHours
       WHERE record_id = :recordId`,
      { totalHours, recordId: activeRecord.record_id }
    );

    // 4. Update live_attendance_status
    await query(
      `UPDATE ${identityTable('live_attendance_status')}
       SET current_status = 'CLOCKED_OUT', is_online = false, last_clock_out = current_timestamp()
       WHERE user_id = :userId`,
       { userId }
    );

    // Update old workforce table status for legacy sync
    await query(
      `UPDATE ${table('workforce')}
       SET status = 'OFFLINE', shift_end = current_timestamp()
       WHERE user_id = :userId`,
      { userId }
    );

    // 5. Create audit log entry
    const auditLogId = crypto.randomUUID();
    await query(
      `INSERT INTO ${identityTable('audit_logs')} (audit_id, user_id, action_type, performed_at)
       VALUES (:auditLogId, :userId, 'CLOCK_OUT', current_timestamp())`,
      { auditLogId, userId }
    );

    // Create activity log
    const logId = `LOG-${Date.now()}`;
    await query(
      `INSERT INTO ${table('activity_logs')} (log_id, message, type)
       VALUES (:logId, :message, 'info')`,
      { logId, message: `Worker ${realWorkerId} clocked out from shift` }
    );

    return res.json({ success: true });
  } catch (err) {
    console.error('[Clock Out Error]', err);
    return res.status(500).json({ error: 'Failed to clock out' });
  }
});

// POST /api/workforce/status/:workerId
router.post('/status/:workerId', async (req: Request, res: Response) => {
  try {
    const workerId = req.params.workerId as string;
    const { status } = req.body;

    // Validate workerId format
    const workerIdRegex = /^(W-\d+|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/i;
    if (!workerIdRegex.test(workerId)) {
      return res.status(400).json({ error: 'Invalid Worker ID format.' });
    }

    const validStatuses = ['ONLINE', 'OFFLINE', 'BUSY', 'ON_DELIVERY'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status` });
    }

    await query(
      `UPDATE ${table('workforce')} SET status = :status WHERE worker_id = :workerId`,
      { status, workerId }
    );

    return res.json({ success: true });
  } catch (err) {
    console.error('[Worker Status Error]', err);
    return res.status(500).json({ error: 'Failed to update status' });
  }
});

export default router;
