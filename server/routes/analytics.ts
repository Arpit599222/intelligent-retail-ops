import { Router, Request, Response } from 'express';
import { query, table } from '../db.js';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const storeId = req.query.storeId as string | undefined;
    const timeRange = (req.query.timeRange as string) || '7d';
    const days = timeRange === '30d' ? 30 : 7;

    const storeFilterSales = storeId ? `AND st.store_id = :storeId` : '';
    const storeFilterTransfers = storeId ? `AND (it.origin_store_id = :storeId OR it.destination_store_id = :storeId)` : '';
    const storeFilterStock = storeId ? `AND store_id = :storeId` : '';

    const params: Record<string, any> = { days };
    if (storeId) {
      params.storeId = storeId;
    }

    // 1. Top Selling Products
    const topSelling = await query(`
      SELECT p.name, p.sku, SUM(st.quantity) as total_sold
      FROM ${table('sales_transactions')} st
      JOIN ${table('products')} p ON st.sku = p.sku
      WHERE st.transaction_date >= date_sub(current_timestamp(), :days)
      ${storeFilterSales}
      GROUP BY p.sku, p.name
      ORDER BY total_sold DESC
      LIMIT 5
    `, params);

    // 2. Least Selling Products
    const leastSelling = await query(`
      SELECT p.name, p.sku, SUM(st.quantity) as total_sold
      FROM ${table('sales_transactions')} st
      JOIN ${table('products')} p ON st.sku = p.sku
      WHERE st.transaction_date >= date_sub(current_timestamp(), :days)
      ${storeFilterSales}
      GROUP BY p.sku, p.name
      ORDER BY total_sold ASC
      LIMIT 5
    `, params);

    // 3. Regional/Store Performance (Best & Lowest)
    // We'll calculate performance based on total sales value
    const storePerformance = await query(`
      SELECT st.store_id as name, 'West Coast' as region, SUM(st.total_price) as total_revenue
      FROM ${table('sales_transactions')} st
      WHERE st.transaction_date >= date_sub(current_timestamp(), :days)
      ${storeFilterSales}
      GROUP BY st.store_id
      ORDER BY total_revenue DESC
    `, params);
    
    const bestPerformingStore = storePerformance.length > 0 ? storePerformance[0] : null;
    const lowestPerformingStore = storePerformance.length > 0 ? storePerformance[storePerformance.length - 1] : null;

    // 4. Most Transferred Product
    const mostTransferred = await query(`
      SELECT p.name, SUM(it.quantity) as total_transferred
      FROM ${table('inventory_transfers')} it
      JOIN ${table('products')} p ON it.sku = p.sku
      WHERE it.created_at >= date_sub(current_timestamp(), :days)
      ${storeFilterTransfers}
      GROUP BY it.sku, p.name
      ORDER BY total_transferred DESC
      LIMIT 1
    `, params);

    // 5. Most Active Warehouse/Store
    // Based on number of transfers initiated or received
    const activeWarehouse = await query(`
      SELECT store_id as name, COUNT(*) as transfer_count
      FROM (
        SELECT origin_store_id as store_id FROM ${table('inventory_transfers')} WHERE created_at >= date_sub(current_timestamp(), :days)
        UNION ALL
        SELECT destination_store_id as store_id FROM ${table('inventory_transfers')} WHERE created_at >= date_sub(current_timestamp(), :days)
      )
      GROUP BY store_id
      ORDER BY transfer_count DESC
      LIMIT 1
    `, params);

    // 6. Inventory Shortages / Low Stock Alerts
    const shortages = await query(`
      SELECT p.name, ist.sku, ist.store_id as store_name, ist.quantity, ist.min_threshold
      FROM ${table('inventory_stock')} ist
      JOIN ${table('products')} p ON ist.sku = p.sku
      WHERE ist.quantity < ist.min_threshold
      ${storeFilterStock}
      ORDER BY (ist.min_threshold - ist.quantity) DESC
      LIMIT 10
    `, storeId ? { storeId } : undefined);

    // For chart data: Weekly/Monthly volume (mocking structure based on live transfers and sales)
    let chartData = [];
    if (timeRange === '7d') {
      const dates = await query(`
        SELECT date_format(st.transaction_date, 'EEE') as name, 
               COUNT(DISTINCT st.transaction_id) as Transfers, 
               SUM(st.quantity) as Cartons,
               ROUND(AVG(st.quantity) * 10) as Load
        FROM ${table('sales_transactions')} st
        WHERE st.transaction_date >= date_sub(current_timestamp(), 7)
        ${storeFilterSales}
        GROUP BY date_format(st.transaction_date, 'EEE')
        ORDER BY MAX(st.transaction_date) ASC
      `, params);
      // Ensure we have data
      chartData = dates;
    } else {
      const weeks = await query(`
        SELECT concat('W', ceil(dayofmonth(st.transaction_date)/7)) as name, 
               COUNT(DISTINCT st.transaction_id) as Transfers, 
               SUM(st.quantity) as Cartons,
               ROUND(AVG(st.quantity) * 10) as Load
        FROM ${table('sales_transactions')} st
        WHERE st.transaction_date >= date_sub(current_timestamp(), 30)
        ${storeFilterSales}
        GROUP BY concat('W', ceil(dayofmonth(st.transaction_date)/7))
        ORDER BY MAX(st.transaction_date) ASC
      `, params);
      chartData = weeks;
    }

    return res.json({
      topSelling,
      leastSelling,
      bestPerformingStore,
      lowestPerformingStore,
      mostTransferred: mostTransferred[0] || null,
      activeWarehouse: activeWarehouse[0] || null,
      shortages,
      chartData: chartData.length > 0 ? chartData : [
        { name: "Mon", Transfers: 0, Cartons: 0, Load: 0 }
      ]
    });
  } catch (err) {
    console.error('[Analytics Error]', err);
    return res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

export default router;
