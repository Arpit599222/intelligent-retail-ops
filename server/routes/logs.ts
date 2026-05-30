import { Router, Request, Response } from 'express';
import { query, table } from '../db.js';

const router = Router();

// GET /api/logs?storeId=ST-003&limit=50
router.get('/', async (req: Request, res: Response) => {
  try {
    const storeId = req.query.storeId as string | undefined;
    const limit = parseInt(req.query.limit as string || '50', 10);

    let sql = `SELECT log_id, user_id, store_id, message, type, created_at
               FROM ${table('activity_logs')}`;

    if (storeId) {
      sql += ` WHERE store_id = :storeId OR store_id IS NULL`;
    }
    sql += ` ORDER BY created_at DESC LIMIT :limit`;

    const rows = await query(sql, { ...(storeId ? { storeId } : {}), limit });
    return res.json(rows);
  } catch (err) {
    console.error('[Logs Error]', err);
    return res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// POST /api/logs — Add a manual log entry
router.post('/', async (req: Request, res: Response) => {
  try {
    const { userId, storeId, message, type } = req.body;

    if (!message || !type) {
      return res.status(400).json({ error: 'Missing required fields: message, type' });
    }

    // 1. Validate userId (Must be valid UUID if provided)
    let userIdClean = null;
    if (userId) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(userId)) {
        return res.status(400).json({ error: 'Invalid User ID format.' });
      }
      userIdClean = userId;
    }

    // 2. Validate storeId (Must match ST-xxx if provided)
    let storeIdClean = null;
    if (storeId) {
      const storeIdRegex = /^ST-\d+$/;
      if (!storeIdRegex.test(storeId)) {
        return res.status(400).json({ error: 'Invalid Store ID format.' });
      }
      storeIdClean = storeId;
    }

    // 3. Sanitize Message
    const messageClean = message.replace(/[^\w\s\-\'\(\)\:\.\,\!\[\]]/g, '').trim();
    if (!messageClean || messageClean.length < 2) {
      return res.status(400).json({ error: 'Log message is too short or contains invalid characters.' });
    }

    // 4. Validate Type (Strict whitelist)
    const allowedTypes = ['success', 'warning', 'info', 'error'];
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid log type assignment.' });
    }

    const logId = `LOG-${Date.now()}`;
    await query(
      `INSERT INTO ${table('activity_logs')}
       (log_id, user_id, store_id, message, type, created_at)
       VALUES (:logId, :userIdClean, :storeIdClean, :messageClean, :type, current_timestamp())`,
      {
        logId,
        userIdClean,
        storeIdClean,
        messageClean,
        type,
      }
    );

    return res.json({ success: true, logId });
  } catch (err) {
    console.error('[Log Add Error]', err);
    return res.status(500).json({ error: 'Failed to add log' });
  }
});

export default router;
