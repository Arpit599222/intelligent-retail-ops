import 'dotenv/config';
import { query } from '../server/database/databricks.js';

async function resetAttendance() {
  try {
    const testEmail = 'atul@gmail.com';
    const users = await query<any>(`SELECT user_id FROM logistics_os.identity_management.users WHERE email = :testEmail`, { testEmail });
    if (users.length === 0) return console.log('User not found.');
    const userId = users[0].user_id;

    console.log('Resetting open shift sessions for Atul User...');
    // Delete any active open records or set them to completed
    await query(
      `UPDATE logistics_os.identity_management.attendance_records
       SET clock_out_time = current_timestamp(), total_hours = 0.1
       WHERE user_id = :userId AND clock_out_time IS NULL`,
      { userId }
    );

    // Reset live status
    await query(
      `UPDATE logistics_os.identity_management.live_attendance_status
       SET current_status = 'CLOCKED_OUT', is_online = false, last_clock_out = current_timestamp()
       WHERE user_id = :userId`,
      { userId }
    );

    // Sync old workforce status
    await query(
      `UPDATE logistics_os.logistics_os.workforce
       SET status = 'OFFLINE', shift_end = current_timestamp()
       WHERE user_id = :userId`,
      { userId }
    );

    console.log('✅ Successfully reset Atul User to CLOCKED_OUT state in the database.');
  } catch (err: any) {
    console.error('Error resetting attendance:', err);
  }
}

resetAttendance();
