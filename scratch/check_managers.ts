import 'dotenv/config';
import { query, table } from '../server/database/databricks.js';

async function checkSchema() {
  try {
    const columns = await query<any>(
      `DESCRIBE TABLE logistics_os.logistics_os.workforce`
    );
    console.log("WORKFORCE SCHEMA:", columns);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkSchema();
