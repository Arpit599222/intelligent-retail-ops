import { Router, Request, Response } from 'express';
import { query, table } from '../db.js';

const router = Router();

// GET /api/inventory?storeId=ST-003
router.get('/', async (req: Request, res: Response) => {
  try {
    const storeId = req.query.storeId as string | undefined;

    let sql = `SELECT ist.stock_id as inventory_id, ist.sku, p.name, ist.quantity, ist.store_id, ist.location,
                      ist.min_threshold, ist.last_restocked_at, s.name as store_name
               FROM ${table('inventory_stock')} ist
               JOIN ${table('products')} p ON ist.sku = p.sku
               JOIN ${table('stores')} s ON ist.store_id = s.store_id`;

    if (storeId) {
      sql += ` WHERE ist.store_id = :storeId`;
    }
    sql += ` ORDER BY ist.sku`;

    const rows = await query(sql, storeId ? { storeId } : undefined);
    return res.json(rows);
  } catch (err) {
    console.error('[Inventory List Error]', err);
    return res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

// GET /api/inventory/stats?storeId=ST-003
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const storeId = req.query.storeId as string | undefined;
    const whereClause = storeId ? `WHERE store_id = :storeId` : '';

    const totalResult = await query<{ total_skus: number; total_units: number }>(
      `SELECT COUNT(DISTINCT sku) as total_skus, COALESCE(SUM(quantity), 0) as total_units
       FROM ${table('inventory_stock')} ${whereClause}`,
      storeId ? { storeId } : undefined
    );

    const lowStockResult = await query<{ low_stock_count: number }>(
      `SELECT COUNT(*) as low_stock_count
       FROM ${table('inventory_stock')}
       ${storeId ? 'WHERE store_id = :storeId AND' : 'WHERE'} quantity < min_threshold`,
      storeId ? { storeId } : undefined
    );

    return res.json({
      totalSkus: totalResult[0]?.total_skus || 0,
      totalUnits: totalResult[0]?.total_units || 0,
      lowStockCount: lowStockResult[0]?.low_stock_count || 0,
    });
  } catch (err) {
    console.error('[Inventory Stats Error]', err);
    return res.status(500).json({ error: 'Failed to fetch inventory stats' });
  }
});

// POST /api/inventory/add — Register a new SKU
router.post('/add', async (req: Request, res: Response) => {
  try {
    const { sku, name, quantity, storeId, location } = req.body;

    if (!sku || !name || quantity === undefined || !storeId) {
      return res.status(400).json({ error: 'Missing required fields: sku, name, quantity, storeId' });
    }

    const skuClean = sku.trim().toUpperCase();
    const nameClean = name.replace(/[^\w\s\-\'\(\)\:\.\,]/g, '').trim();
    const qtyNum = Number(quantity);
    const locationClean = location ? location.replace(/[^\w\s\-\'\(\)\:\.\,]/g, '').trim() : 'Unassigned';

    // Insert product if not exists
    const existingProducts = await query(`SELECT sku FROM ${table('products')} WHERE sku = :skuClean`, { skuClean });
    if (existingProducts.length === 0) {
      await query(`
        INSERT INTO ${table('products')} (sku, name, category, unit_price, created_at)
        VALUES (:skuClean, :nameClean, 'General', 0.0, current_timestamp())
      `, { skuClean, nameClean });
    }

    // Insert stock
    const stockId = `STK-${Date.now()}`;
    await query(
      `INSERT INTO ${table('inventory_stock')}
       (stock_id, sku, store_id, quantity, min_threshold, location, last_restocked_at, updated_at)
       VALUES (:stockId, :skuClean, :storeId, :qtyNum, 10, :locationClean, current_timestamp(), current_timestamp())`,
      { stockId, skuClean, storeId, qtyNum, locationClean }
    );

    // Log it
    const logId = `LOG-${Date.now()}`;
    await query(
      `INSERT INTO ${table('activity_logs')} (log_id, store_id, message, type)
       VALUES (:logId, :storeId, :message, 'success')`,
      { logId, storeId, message: `New SKU registered: ${skuClean} — ${nameClean}` }
    );

    return res.json({ success: true, inventoryId: stockId });
  } catch (err) {
    console.error('[Inventory Add Error]', err);
    return res.status(500).json({ error: 'Failed to add inventory item' });
  }
});

// POST /api/inventory/restock — Add stock to an existing SKU
router.post('/restock', async (req: Request, res: Response) => {
  try {
    const { inventoryId, sku, storeId, quantity, location } = req.body;

    if (!storeId || !quantity || (!inventoryId && !sku)) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const addQty = Number(quantity);
    const locationClean = location ? location.replace(/[^\w\s\-\'\(\)\:\.\,]/g, '').trim() : undefined;

    let whereField = '';
    let whereValue = '';

    if (inventoryId) {
      whereField = 'stock_id';
      whereValue = inventoryId;
    } else if (sku) {
      whereField = 'sku';
      whereValue = sku.trim().toUpperCase();
    }

    let updateSql = `UPDATE ${table('inventory_stock')}
                      SET quantity = quantity + :addQty,
                           last_restocked_at = current_timestamp(),
                           updated_at = current_timestamp()
                      WHERE ${whereField} = :whereValue AND store_id = :storeId`;

    if (locationClean) {
      updateSql = `UPDATE ${table('inventory_stock')}
                    SET quantity = quantity + :addQty,
                        location = :locationClean,
                        last_restocked_at = current_timestamp(),
                        updated_at = current_timestamp()
                    WHERE ${whereField} = :whereValue AND store_id = :storeId`;
    }

    await query(updateSql, {
      addQty,
      whereValue,
      storeId,
      ...(locationClean ? { locationClean } : {}),
    });

    const logId = `LOG-${Date.now()}`;
    await query(
      `INSERT INTO ${table('activity_logs')} (log_id, store_id, message, type)
       VALUES (:logId, :storeId, :message, 'success')`,
      { logId, storeId, message: `Stock adjustment: +${addQty} units for ${sku || inventoryId}` }
    );

    return res.json({ success: true });
  } catch (err) {
    console.error('[Inventory Restock Error]', err);
    return res.status(500).json({ error: 'Failed to restock' });
  }
});

// POST /api/inventory/update-quantity — Overwrite virtual stock with physical count
router.post('/update-quantity', async (req: Request, res: Response) => {
  try {
    const { sku, storeId, quantity } = req.body;

    if (!sku || !storeId || quantity === undefined) {
      return res.status(400).json({ error: 'Missing required fields: sku, storeId, quantity' });
    }

    const skuClean = sku.trim().toUpperCase();
    const qtyVal = Number(quantity);

    await query(
      `UPDATE ${table('inventory_stock')}
       SET quantity = :qtyVal,
           updated_at = current_timestamp()
       WHERE sku = :skuClean AND store_id = :storeId`,
      { qtyVal, skuClean, storeId }
    );

    const logId = `LOG-${Date.now()}`;
    await query(
      `INSERT INTO ${table('activity_logs')} (log_id, store_id, message, type)
       VALUES (:logId, :storeId, :message, 'success')`,
      { logId, storeId, message: `Inventory SKU physical audit: ${skuClean} updated to ${qtyVal} units` }
    );

    return res.json({ success: true });
  } catch (err) {
    console.error('[Inventory Update Qty Error]', err);
    return res.status(500).json({ error: 'Failed to update inventory quantity' });
  }
});

export default router;
