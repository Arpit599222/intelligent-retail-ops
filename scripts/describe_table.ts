import 'dotenv/config';
import { query } from '../server/database/databricks.js';

async function describe() {
  const schemas = ['identity_management', 'logistics_os'];
  for (const s of schemas) {
    try {
      const res = await query(`SHOW TABLES IN logistics_os.${s}`);
      console.log(`\n=== Tables in schema logistics_os.${s} ===`);
      console.log(res);
    } catch (err: any) {
      console.error(`Error showing tables in ${s}:`, err);
    }
  }
}
describe();
