import 'dotenv/config';
import { query } from '../server/database/databricks.js';

async function checkAtul() {
  try {
    const testEmail = 'atul@gmail.com';
    const users = await query<any>(`SELECT user_id FROM logistics_os.identity_management.users WHERE email = :testEmail`, { testEmail });
    if (users.length === 0) return console.log('User not found.');
    const userId = users[0].user_id;

    const records = await query<any>(`SELECT record_id, clock_in_time, clock_out_time, total_hours FROM logistics_os.identity_management.attendance_records WHERE user_id = :userId`, { userId });
    console.log('\n=== attendance_records ===');
    console.log(records);

    const liveStatus = await query<any>(`SELECT * FROM logistics_os.identity_management.live_attendance_status WHERE user_id = :userId`, { userId });
    console.log('\n=== live_attendance_status ===');
    console.log(liveStatus);

  } catch (err: any) {
    console.error('Error:', err);
  }
}

checkAtul();
