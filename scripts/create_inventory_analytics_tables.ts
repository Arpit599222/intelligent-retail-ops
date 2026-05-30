import 'dotenv/config';
import { query } from '../server/database/databricks.js';

async function createTables() {
  try {
    console.log('Dropping existing tables...');
    await query(`DROP TABLE IF EXISTS logistics_os.products`);
    await query(`DROP TABLE IF EXISTS logistics_os.inventory_stock`);
    await query(`DROP TABLE IF EXISTS logistics_os.inventory_transfers`);
    await query(`DROP TABLE IF EXISTS logistics_os.sales_transactions`);

    console.log('Creating products table...');
    await query(`
      CREATE TABLE IF NOT EXISTS logistics_os.products (
        sku STRING,
        name STRING,
        category STRING,
        unit_price DOUBLE,
        created_at TIMESTAMP
      ) USING delta
    `);
    
    console.log('Creating inventory_stock table...');
    await query(`
      CREATE TABLE IF NOT EXISTS logistics_os.inventory_stock (
        stock_id STRING,
        sku STRING,
        store_id STRING,
        quantity INT,
        min_threshold INT,
        location STRING,
        last_restocked_at TIMESTAMP,
        updated_at TIMESTAMP
      ) USING delta
    `);

    console.log('Creating inventory_transfers table...');
    await query(`
      CREATE TABLE IF NOT EXISTS logistics_os.inventory_transfers (
        transfer_id STRING,
        sku STRING,
        origin_store_id STRING,
        destination_store_id STRING,
        quantity INT,
        cartons INT,
        status STRING,
        created_at TIMESTAMP,
        updated_at TIMESTAMP,
        eta_minutes INT,
        worker_id STRING,
        pickup_latitude DOUBLE,
        pickup_longitude DOUBLE,
        destination_latitude DOUBLE,
        destination_longitude DOUBLE,
        current_latitude DOUBLE,
        current_longitude DOUBLE,
        notes STRING
      ) USING delta
    `);

    console.log('Creating sales_transactions table...');
    await query(`
      CREATE TABLE IF NOT EXISTS logistics_os.sales_transactions (
        transaction_id STRING,
        store_id STRING,
        sku STRING,
        quantity INT,
        total_price DOUBLE,
        transaction_date TIMESTAMP
      ) USING delta
    `);

    console.log('Inserting demo products...');
    const products = [
      { sku: 'ECHO-DOT-5', name: 'Echo Dot (5th Gen)', category: 'Electronics', price: 49.99 },
      { sku: 'KINDLE-PW', name: 'Kindle Paperwhite', category: 'Electronics', price: 139.99 },
      { sku: 'FIRE-TV-4K', name: 'Fire TV Stick 4K', category: 'Electronics', price: 49.99 },
      { sku: 'AMZ-BASICS-CBL', name: 'Amazon Basics Lightning Cable', category: 'Accessories', price: 12.99 },
      { sku: 'BLINK-MINI', name: 'Blink Mini Camera', category: 'Smart Home', price: 29.99 },
    ];
    
    for (const p of products) {
      await query(`
        INSERT INTO logistics_os.products (sku, name, category, unit_price, created_at)
        VALUES (:sku, :name, :cat, :price, current_timestamp())
      `, { sku: p.sku, name: p.name, cat: p.category, price: p.price });
    }

    console.log('Inserting demo inventory stock...');
    const stores = ['ST-001', 'ST-002', 'ST-003', 'ST-004'];
    let stockIdCount = 1;
    for (const store of stores) {
      for (const p of products) {
        const qty = Math.floor(Math.random() * 500) + 5;
        const threshold = Math.floor(Math.random() * 20) + 10;
        await query(`
          INSERT INTO logistics_os.inventory_stock (stock_id, sku, store_id, quantity, min_threshold, location, last_restocked_at, updated_at)
          VALUES (:stock_id, :sku, :store_id, :qty, :threshold, 'A1', current_timestamp(), current_timestamp())
        `, { stock_id: `STK-${stockIdCount++}`, sku: p.sku, store_id: store, qty, threshold });
      }
    }

    console.log('Inserting demo inventory transfers...');
    for (let i = 0; i < 50; i++) {
        const p = products[Math.floor(Math.random() * products.length)];
        const origin = stores[Math.floor(Math.random() * stores.length)];
        let dest = stores[Math.floor(Math.random() * stores.length)];
        while (origin === dest) { dest = stores[Math.floor(Math.random() * stores.length)]; }
        
        const qty = Math.floor(Math.random() * 50) + 1;
        const daysAgo = Math.floor(Math.random() * 30);
        
        await query(`
            INSERT INTO logistics_os.inventory_transfers (transfer_id, sku, origin_store_id, destination_store_id, quantity, cartons, status, created_at, updated_at, eta_minutes, pickup_latitude, pickup_longitude, destination_latitude, destination_longitude, current_latitude, current_longitude)
            VALUES (:id, :sku, :origin, :dest, :qty, :cartons, 'COMPLETED', date_sub(current_timestamp(), :days), date_sub(current_timestamp(), :days), 0, 40.7128, -74.0060, 34.0522, -118.2437, 34.0522, -118.2437)
        `, { id: `TRF-${Date.now()}-${i}`, sku: p.sku, origin, dest, qty, cartons: Math.ceil(qty / 10), days: daysAgo });
    }

    console.log('Inserting demo sales transactions...');
    for (let i = 0; i < 200; i++) {
        const p = products[Math.floor(Math.random() * products.length)];
        const store = stores[Math.floor(Math.random() * stores.length)];
        const qty = Math.floor(Math.random() * 5) + 1;
        const daysAgo = Math.floor(Math.random() * 30);
        const totalPrice = qty * p.price;
        
        await query(`
            INSERT INTO logistics_os.sales_transactions (transaction_id, store_id, sku, quantity, total_price, transaction_date)
            VALUES (:id, :store, :sku, :qty, :totalPrice, date_sub(current_timestamp(), :days))
        `, { id: `TXN-${Date.now()}-${i}`, store, sku: p.sku, qty, totalPrice, days: daysAgo });
    }

    console.log('Successfully created tables and populated with demo data!');
  } catch (err) {
    console.error('Failed:', err);
  }
}
createTables();
