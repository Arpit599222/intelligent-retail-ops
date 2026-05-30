import 'dotenv/config';
import { query, table } from '../server/database/databricks.js';

async function checkUsers() {
  try {
    const users = await query(`SELECT user_id, email, first_name, last_name, role, status FROM logistics_os.identity_management.users`);
    console.log('\n=== Users Table ===');
    console.log(users);

    const workforce = await query(`SELECT worker_id, user_id, designation, status, store_id FROM logistics_os.logistics_os.workforce`);
    console.log('\n=== Workforce Table ===');
    console.log(workforce);
  } catch (err: any) {
    console.error('Error checking users:', err);
  }
}

checkUsers();
