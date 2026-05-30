import { query } from '../server/database/databricks.js';

async function testTransaction() {
  try {
    console.log('Testing BEGIN TRANSACTION...');
    await query('BEGIN TRANSACTION');
    console.log('BEGIN works!');
    await query('ROLLBACK');
    console.log('ROLLBACK works!');
  } catch (err) {
    console.error('Transaction failed:', err);
  }
}

testTransaction();
