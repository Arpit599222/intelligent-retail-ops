import { Router, Request, Response } from 'express';
import { query, table } from '../db.js';

const router = Router();

// GET /api/transfers?storeId=ST-003
router.get('/', async (req: Request, res: Response) => {
  try {
    const storeId = req.query.storeId as string | undefined;

    let sql = `SELECT t.transfer_id, t.origin_store_id, t.destination_store_id,
                      t.worker_id, t.status, t.cartons, t.eta_minutes,
                      t.pickup_latitude, t.pickup_longitude,
                      t.destination_latitude, t.destination_longitude,
                      t.current_latitude, t.current_longitude,
                      t.notes, t.created_at, t.updated_at,
                      os.name as origin_store_name,
                      ds.name as destination_store_name,
                      w.worker_id as assigned_worker_id
               FROM ${table('inventory_transfers')} t
               JOIN ${table('stores')} os ON t.origin_store_id = os.store_id
               JOIN ${table('stores')} ds ON t.destination_store_id = ds.store_id
               LEFT JOIN ${table('workforce')} w ON t.worker_id = w.worker_id`;

    if (storeId) {
      sql += ` WHERE t.origin_store_id = :storeId OR t.destination_store_id = :storeId`;
    }
    sql += ` ORDER BY t.created_at DESC`;

    const rows = await query(sql, storeId ? { storeId } : undefined);

    // Get worker names
    for (const row of rows as Record<string, unknown>[]) {
      if (row.worker_id) {
        const workers = await query<{ name: string }>(
          `SELECT u.name FROM ${table('workforce')} wf
           JOIN ${table('users')} u ON wf.user_id = u.user_id
           WHERE wf.worker_id = :workerId`,
          { workerId: row.worker_id as string }
        );
        (row as Record<string, unknown>).worker_name = workers[0]?.name || 'Unknown';
      }
    }

    return res.json(rows);
  } catch (err) {
    console.error('[Transfers List Error]', err);
    return res.status(500).json({ error: 'Failed to fetch transfers' });
  }
});

// POST /api/transfers/approve/:id
router.post('/approve/:id', async (req: Request, res: Response) => {
  try {
    const transferId = req.params.id as string;

    // Validate transferId parameter format
    const transferIdRegex = /^[A-Z0-9\-]{5,50}$/i;
    if (!transferIdRegex.test(transferId)) {
      return res.status(400).json({ error: 'Invalid Transfer ID format.' });
    }

    // Get current status
    const transfers = await query<{ status: string }>(
      `SELECT status FROM ${table('inventory_transfers')} WHERE transfer_id = :transferId`,
      { transferId }
    );

    if (transfers.length === 0) return res.status(404).json({ error: 'Transfer not found' });

    const oldStatus = transfers[0].status;

    await query(
      `UPDATE ${table('inventory_transfers')}
       SET status = 'APPROVED', updated_at = current_timestamp()
       WHERE transfer_id = :transferId`,
      { transferId }
    );

    // Write status history
    const historyId = `HST-${Date.now()}`;
    await query(
      `INSERT INTO ${table('transfer_status_history')}
       (history_id, transfer_id, old_status, new_status, changed_at)
       VALUES (:historyId, :transferId, :oldStatus, 'APPROVED', current_timestamp())`,
      { historyId, transferId, oldStatus }
    );

    // Log it
    const logId = `LOG-${Date.now()}`;
    await query(
      `INSERT INTO ${table('activity_logs')} (log_id, message, type)
       VALUES (:logId, :message, 'info')`,
      { logId, message: `Transfer ${transferId} status updated to APPROVED` }
    );

    return res.json({ success: true });
  } catch (err) {
    console.error('[Transfer Approve Error]', err);
    return res.status(500).json({ error: 'Failed to approve transfer' });
  }
});

// POST /api/transfers/assign/:id
router.post('/assign/:id', async (req: Request, res: Response) => {
  try {
    const transferId = req.params.id as string;
    const { workerId } = req.body;

    // Validate transferId parameter format
    const transferIdRegex = /^[A-Z0-9\-]{5,50}$/i;
    if (!transferIdRegex.test(transferId)) {
      return res.status(400).json({ error: 'Invalid Transfer ID format.' });
    }

    if (!workerId) return res.status(400).json({ error: 'workerId required' });

    // Validate workerId parameter format
    const workerIdRegex = /^(W-\d+|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;
    if (!workerIdRegex.test(workerId)) {
      return res.status(400).json({ error: 'Invalid Worker ID format.' });
    }

    await query(
      `UPDATE ${table('inventory_transfers')}
       SET worker_id = :workerId, status = 'APPROVED', updated_at = current_timestamp()
       WHERE transfer_id = :transferId`,
      { transferId, workerId }
    );

    // Set worker to BUSY
    await query(
      `UPDATE ${table('workforce')}
       SET status = 'BUSY', active_task_id = :transferId
       WHERE worker_id = :workerId`,
      { transferId, workerId }
    );

    const logId = `LOG-${Date.now()}`;
    await query(
      `INSERT INTO ${table('activity_logs')} (log_id, message, type)
       VALUES (:logId, :message, 'info')`,
      { logId, message: `Worker ${workerId} assigned to transfer ${transferId}` }
    );

    return res.json({ success: true });
  } catch (err) {
    console.error('[Transfer Assign Error]', err);
    return res.status(500).json({ error: 'Failed to assign worker' });
  }
});

// POST /api/transfers/status/:id
router.post('/status/:id', async (req: Request, res: Response) => {
  try {
    const transferId = req.params.id as string;
    const { status } = req.body;

    // Validate transferId parameter format
    const transferIdRegex = /^[A-Z0-9\-]{5,50}$/i;
    if (!transferIdRegex.test(transferId)) {
      return res.status(400).json({ error: 'Invalid Transfer ID format.' });
    }

    const validStatuses = ['PENDING', 'APPROVED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'VERIFIED', 'COMPLETED', 'DELAYED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    // Get old status and worker
    const transfers = await query<{ status: string; worker_id: string | null }>(
      `SELECT status, worker_id FROM ${table('inventory_transfers')} WHERE transfer_id = :transferId`,
      { transferId }
    );

    if (transfers.length === 0) return res.status(404).json({ error: 'Transfer not found' });

    const oldStatus = transfers[0].status;
    const workerId = transfers[0].worker_id;

    // Update transfer status
    let updateFields = `status = :status, updated_at = current_timestamp()`;
    if (status === 'COMPLETED') updateFields += `, eta_minutes = 0`;

    await query(
      `UPDATE ${table('inventory_transfers')} SET ${updateFields} WHERE transfer_id = :transferId`,
      { status, transferId }
    );

    // Sync worker status
    if (workerId) {
      let workerStatus = 'ONLINE';
      if (status === 'PICKED_UP') workerStatus = 'BUSY';
      else if (status === 'IN_TRANSIT') workerStatus = 'ON_DELIVERY';
      else if (status === 'DELIVERED') workerStatus = 'BUSY';
      else if (status === 'COMPLETED') workerStatus = 'ONLINE';

      const activeTaskUpdate = status === 'COMPLETED' ? `, active_task_id = NULL` : '';

      await query(
        `UPDATE ${table('workforce')}
         SET status = :workerStatus ${activeTaskUpdate}
         WHERE worker_id = :workerId`,
        { workerStatus, workerId }
      );
    }

    // Write history
    const historyId = `HST-${Date.now()}`;
    await query(
      `INSERT INTO ${table('transfer_status_history')}
       (history_id, transfer_id, old_status, new_status, changed_at)
       VALUES (:historyId, :transferId, :oldStatus, :status, current_timestamp())`,
      { historyId, transferId, oldStatus, status }
    );

    // Log
    const logId = `LOG-${Date.now()}`;
    await query(
      `INSERT INTO ${table('activity_logs')} (log_id, message, type)
       VALUES (:logId, :message, :logType)`,
      {
        logId,
        message: `Transfer ${transferId} updated to ${status}`,
        logType: status === 'DELAYED' ? 'error' : 'info',
      }
    );

    return res.json({ success: true });
  } catch (err) {
    console.error('[Transfer Status Error]', err);
    return res.status(500).json({ error: 'Failed to update status' });
  }
});

// GET /api/transfers/history/:id — Audit trail
router.get('/history/:id', async (req: Request, res: Response) => {
  try {
    const transferId = req.params.id as string;

    // Validate transferId parameter format
    const transferIdRegex = /^[A-Z0-9\-]{5,50}$/i;
    if (!transferIdRegex.test(transferId)) {
      return res.status(400).json({ error: 'Invalid Transfer ID format.' });
    }

    const rows = await query(
      `SELECT * FROM ${table('transfer_status_history')}
       WHERE transfer_id = :transferId
       ORDER BY changed_at DESC`,
      { transferId }
    );
    return res.json(rows);
  } catch (err) {
    console.error('[Transfer History Error]', err);
    return res.status(500).json({ error: 'Failed to fetch history' });
  }
});

export default router;
