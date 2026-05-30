import 'dotenv/config';
import { query, table } from '../server/database/databricks.js';

async function cleanupStale() {
  try {
    const staleEmails = ['richa.2001@gmail.com', 'grover20@gmail.com', 'grover@gmail.com', 'testmanager@gmail.com'];
    for (const email of staleEmails) {
      console.log(`Cleaning up ${email}...`);
      const users = await query<any>(
        `SELECT user_id FROM logistics_os.identity_management.users WHERE email = :email`,
        { email }
      );
      if (users.length > 0) {
        const userId = users[0].user_id;
        await query(`DELETE FROM logistics_os.identity_management.users WHERE user_id = :userId`, { userId });
        await query(`DELETE FROM logistics_os.identity_management.user_credentials WHERE user_id = :userId`, { userId });
        await query(`DELETE FROM logistics_os.identity_management.password_reset_history WHERE user_id = :userId`, { userId });
        console.log(`Successfully cleaned up ${email} (ID: ${userId})`);
      }
    }
  } catch (error: any) {
    console.error('Error in cleanup:', error.message || error);
  } finally {
    process.exit(0);
  }
}

cleanupStale();
