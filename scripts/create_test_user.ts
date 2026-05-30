import 'dotenv/config';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { query, table } from '../server/database/databricks.js';

async function createTestUser() {
  try {
    const email = 'admin@company.com';
    const password = 'admin123';
    const role = 'SUPER_ADMIN';

    console.log(`Connecting to Databricks... Checking for user ${email}`);

    // Check if user exists
    const users = await query<any>(
      `SELECT user_id FROM ${table('users')} WHERE email = :email`,
      { email }
    );

    let userId = '';

    if (users.length > 0) {
      userId = users[0].user_id;
      console.log(`User found (ID: ${userId}). Updating password...`);
    } else {
      userId = crypto.randomUUID();
      console.log(`User not found. Creating new user (ID: ${userId})...`);
      
      // Insert user
      await query(
        `INSERT INTO ${table('users')} (user_id, email, username, first_name, last_name, role, status, must_change_password, created_at, updated_at) 
         VALUES (:userId, :email, 'admin', 'Super', 'Admin', :role, 'ACTIVE', false, current_timestamp(), current_timestamp())`,
        { userId, email, role }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Upsert credentials
    const creds = await query<any>(
      `SELECT user_id FROM ${table('user_credentials')} WHERE user_id = :userId`,
      { userId }
    );

    if (creds.length > 0) {
      await query(
        `UPDATE ${table('user_credentials')} 
         SET password_hash = :passwordHash, failed_login_attempts = 0, account_locked = false, updated_at = current_timestamp()
         WHERE user_id = :userId`,
        { passwordHash, userId }
      );
    } else {
      const credentialId = crypto.randomUUID();
      await query(
        `INSERT INTO ${table('user_credentials')} (credential_id, user_id, password_hash, password_updated_at, failed_login_attempts, account_locked, created_at, updated_at) 
         VALUES (:credentialId, :userId, :passwordHash, current_timestamp(), 0, false, current_timestamp(), current_timestamp())`,
        { credentialId, userId, passwordHash }
      );
    }

    console.log('✅ Success! You can now log in with:');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

createTestUser();
