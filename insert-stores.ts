import { query } from './server/db.js';

async function run() {
  await query(`INSERT INTO logistics_os.stores (store_id, name, type, address, city, state, latitude, longitude, is_active, created_at, updated_at) VALUES ('ST-005', 'Mumbai Central Hub', 'RETAIL', '1 Mumbai St', 'Mumbai', 'MH', 19.0760, 72.8777, true, current_timestamp(), current_timestamp())`);
  await query(`INSERT INTO logistics_os.stores (store_id, name, type, address, city, state, latitude, longitude, is_active, created_at, updated_at) VALUES ('ST-006', 'Delhi NCR Hub', 'RETAIL', '2 Delhi Ave', 'Delhi', 'DL', 28.7041, 77.1025, true, current_timestamp(), current_timestamp())`);
  await query(`INSERT INTO logistics_os.stores (store_id, name, type, address, city, state, latitude, longitude, is_active, created_at, updated_at) VALUES ('ST-007', 'Bangalore Tech Hub', 'RETAIL', '3 Bangalore Rd', 'Bangalore', 'KA', 12.9716, 77.5946, true, current_timestamp(), current_timestamp())`);
  console.log("Inserted missing Indian stores into logistics_os.stores");
}

run().catch(console.error);
