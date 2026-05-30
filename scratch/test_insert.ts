import 'dotenv/config';
import { query, table } from '../server/database/databricks.js';
import crypto from 'crypto';

async function testInsert() {
  try {
    const userId = crypto.randomUUID();
    const workerId = `W-${Math.floor(Math.random() * 9000) + 1000}`;
    const designationClean = null;
    const storeId = "ST-003";

    console.log("TRYING USER INSERT...");
    await query(
      `INSERT INTO logistics_os.identity_management.users
       (user_id, email, username, first_name, last_name, role, status, must_change_password, created_at, updated_at)
       VALUES (:userId, 'testmanager@gmail.com', 'testmanager', 'Test', 'Manager', 'STORE_MANAGER', 'ACTIVE', true, current_timestamp(), current_timestamp())`,
      { userId }
    );
    console.log("USER INSERT SUCCEEDED!");

    console.log("TRYING WORKFORCE INSERT...");
    await query(
      `INSERT INTO logistics_os.logistics_os.workforce
       (worker_id, user_id, designation, status, store_id, created_at)
       VALUES (:workerId, :userId, :designationClean, 'OFFLINE', :storeId, current_timestamp())`,
      { workerId, userId, designationClean, storeId }
    );
    console.log("WORKFORCE INSERT SUCCEEDED!");
  } catch (error: any) {
    console.error('Error in test insert:', error.message || error);
  } finally {
    process.exit(0);
  }
}

testInsert();
