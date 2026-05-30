import { query } from '../server/database/databricks.js';

async function main() {
  const tables = ['users', 'user_credentials', 'password_reset_history', 'login_sessions', 'audit_logs'];
  for (const table of tables) {
    try {
      const res = await query(`DESCRIBE TABLE logistics_os.identity_management.${table}`);
      console.log(`\n=== Schema for ${table} ===`);
      res.forEach(row => console.log(`${row.col_name}: ${row.data_type}`));
    } catch (err) {
      console.error(`Error describing ${table}:`, err);
    }
  }
}

main().catch(console.error);
