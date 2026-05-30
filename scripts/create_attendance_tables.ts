import 'dotenv/config';
import { query } from '../server/database/databricks.js';

async function createTables() {
  try {
    console.log('Creating attendance_records table...');
    await query(`
      CREATE TABLE IF NOT EXISTS logistics_os.identity_management.attendance_records (
        record_id STRING,
        user_id STRING,
        worker_id STRING,
        clock_in_time TIMESTAMP,
        clock_out_time TIMESTAMP,
        total_hours DOUBLE
      ) USING delta
    `);
    console.log('attendance_records table created successfully or already exists.');

    console.log('Creating live_attendance_status table...');
    await query(`
      CREATE TABLE IF NOT EXISTS logistics_os.identity_management.live_attendance_status (
        status_id STRING,
        user_id STRING,
        worker_id STRING,
        current_status STRING,
        is_online BOOLEAN,
        last_clock_in TIMESTAMP,
        last_clock_out TIMESTAMP
      ) USING delta
    `);
    console.log('live_attendance_status table created successfully or already exists.');

  } catch (err: any) {
    console.error('Error creating attendance tables:', err);
  }
}

createTables();
