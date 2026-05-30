import { Router, Request, Response } from 'express';
import { query, table } from '../db.js';

const router = Router();

// GET /api/stores — List all active stores
router.get('/', async (_req: Request, res: Response) => {
  try {
    const rows = await query(
      `SELECT store_id, name, type, address, city, state, latitude, longitude
       FROM ${table('stores')}
       WHERE is_active = true
       ORDER BY name`
    );
    return res.json(rows);
  } catch (err) {
    console.error('[Stores Error]', err);
    return res.status(500).json({ error: 'Failed to fetch stores' });
  }
});

// GET /api/stores/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const rows = await query(
      `SELECT * FROM ${table('stores')} WHERE store_id = :storeId AND is_active = true`,
      { storeId: req.params.id }
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Store not found' });
    return res.json(rows[0]);
  } catch (err) {
    console.error('[Store Detail Error]', err);
    return res.status(500).json({ error: 'Failed to fetch store' });
  }
});

export default router;
