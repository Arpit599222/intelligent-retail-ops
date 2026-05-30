import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query, table } from '../database/databricks.js';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development';
const JWT_EXPIRES_IN = '24h';
const MAX_FAILED_ATTEMPTS = 5;

export interface AuthenticatedUser {
  user_id: string;
  email: string;
  name: string;
  role: string;
}

export const authService = {
  async logAudit(userId: string | null, actionType: string, oldValue: string | null = null, newValue: string | null = null) {
    try {
      const auditId = crypto.randomUUID();
      await query(
        `INSERT INTO ${table('audit_logs')} 
         (audit_id, user_id, action_type, old_value, new_value, performed_at) 
         VALUES (:auditId, :userId, :actionType, :oldValue, :newValue, current_timestamp())`,
        { auditId, userId, actionType, oldValue, newValue }
      );
    } catch (error) {
      console.error('[Audit Log Error]', error);
    }
  },

  async login(email: string, password: string, ipAddress: string = 'unknown', userAgent: string = 'unknown') {
    // 1. Search users table
    const users = await query<any>(
      `SELECT u.user_id, u.email, concat(u.first_name, ' ', u.last_name) as name, u.role, u.status, u.must_change_password, uc.password_hash, uc.failed_login_attempts as failed_attempts, uc.account_locked as is_locked
       FROM ${table('users')} u
       JOIN ${table('user_credentials')} uc ON u.user_id = uc.user_id
       WHERE LOWER(u.email) = LOWER(:email)`,
      { email }
    );

    if (users.length === 0) {
      throw new Error('Account not found');
    }

    const user = users[0];

    // 2. Verify status = ACTIVE
    if (user.status !== 'ACTIVE' || user.is_locked) {
      throw new Error('Account is locked or inactive');
    }

    // 3 & 4. Fetch user_credentials and Compare password hash
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      // 5 & 6. Increment failed attempts and lock if exceeded
      const newAttempts = (user.failed_attempts || 0) + 1;
      const isLocked = newAttempts >= MAX_FAILED_ATTEMPTS;

      await query(
        `UPDATE ${table('user_credentials')}
         SET failed_login_attempts = :newAttempts, account_locked = :isLocked, updated_at = current_timestamp()
         WHERE user_id = :userId`,
        { newAttempts, isLocked, userId: user.user_id }
      );

      if (isLocked) {
        await this.logAudit(user.user_id, 'ACCOUNT_LOCKED');
      }
      throw new Error('Invalid credentials');
    }

    // Reset failed attempts on success
    await query(
      `UPDATE ${table('user_credentials')}
       SET failed_login_attempts = 0, updated_at = current_timestamp()
       WHERE user_id = :userId`,
      { userId: user.user_id }
    );

    // If they must change password, abort JWT creation and return specific payload
    if (user.must_change_password) {
      return {
        requiresPasswordChange: true,
        user: {
          userId: user.user_id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      };
    }

    let designation = undefined;
    let storeId = undefined;
    if (user.role === 'OPERATIONS_STAFF' || user.role === 'STORE_MANAGER') {
      const workforce = await query<any>(
        `SELECT designation, store_id FROM ${table('workforce', 'logistics_os')} WHERE user_id = :userId`,
        { userId: user.user_id }
      );
      if (workforce.length > 0) {
        designation = workforce[0].designation;
        storeId = workforce[0].store_id;
      }
    }

    // 7. Create JWT
    const token = jwt.sign(
      { userId: user.user_id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // 8. Insert login_sessions record
    const sessionId = crypto.randomUUID();
    await query(
      `INSERT INTO ${table('login_sessions')}
       (session_id, user_id, login_time, device_type, browser, ip_address, session_status)
       VALUES (:sessionId, :userId, current_timestamp(), 'unknown', :browser, :ipAddress, 'ACTIVE')`,
      { sessionId, userId: user.user_id, browser: userAgent, ipAddress }
    );

    // 9. Insert audit_logs record
    await this.logAudit(user.user_id, 'LOGIN');

    // 10. Return authenticated user
    return {
      requiresPasswordChange: false,
      token,
      sessionId,
      user: {
        userId: user.user_id,
        email: user.email,
        name: user.name,
        role: user.role,
        designation,
        storeId
      }
    };
  },

  async firstLoginChangePassword(userId: string, temporaryPassword: string, newPassword: string, ipAddress: string = 'unknown', userAgent: string = 'unknown') {
    // 1. Fetch user to verify they need to change password
    const users = await query<any>(
      `SELECT u.email, concat(u.first_name, ' ', u.last_name) as name, u.role, u.must_change_password, uc.password_hash 
       FROM ${table('users')} u
       JOIN ${table('user_credentials')} uc ON u.user_id = uc.user_id
       WHERE u.user_id = :userId`,
      { userId }
    );

    if (users.length === 0) throw new Error('User not found');
    const user = users[0];

    if (!user.must_change_password) {
      throw new Error('User is not required to change password on first login.');
    }

    // 2. Validate temporary password
    const isValid = await bcrypt.compare(temporaryPassword, user.password_hash);
    if (!isValid) throw new Error('Invalid temporary password');

    if (temporaryPassword === newPassword) {
      throw new Error('New password must be different from the temporary password');
    }

    // Password complexity is also checked in frontend, but we add a safety check
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      throw new Error('Password does not meet complexity requirements');
    }

    // 3. Update databases
    const newHash = await bcrypt.hash(newPassword, 10);
    
    // Update user_credentials
    await query(
      `UPDATE ${table('user_credentials')} 
       SET password_hash = :newHash, password_updated_at = current_timestamp(), failed_login_attempts = 0, account_locked = false, updated_at = current_timestamp() 
       WHERE user_id = :userId`,
      { newHash, userId }
    );

    // Update users
    await query(
      `UPDATE ${table('users')} 
       SET must_change_password = false, updated_at = current_timestamp() 
       WHERE user_id = :userId`,
      { userId }
    );

    // Update password_reset_history
    await query(
      `UPDATE ${table('password_reset_history')} 
       SET first_login_completed = true, password_changed_at = current_timestamp() 
       WHERE user_id = :userId AND first_login_completed = false`,
      { userId }
    );

    // Audit log
    await this.logAudit(userId, 'PASSWORD_CHANGE');

    // 4. Generate Session and JWT
    const token = jwt.sign(
      { userId: userId, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const sessionId = crypto.randomUUID();
    await query(
      `INSERT INTO ${table('login_sessions')}
       (session_id, user_id, login_time, device_type, browser, ip_address, session_status)
       VALUES (:sessionId, :userId, current_timestamp(), 'unknown', :browser, :ipAddress, 'ACTIVE')`,
      { sessionId, userId, browser: userAgent, ipAddress }
    );

    await this.logAudit(userId, 'LOGIN');

    let designation = undefined;
    let storeId = undefined;
    if (user.role === 'OPERATIONS_STAFF' || user.role === 'STORE_MANAGER') {
      const workforce = await query<any>(
        `SELECT designation, store_id FROM ${table('workforce', 'logistics_os')} WHERE user_id = :userId`,
        { userId }
      );
      if (workforce.length > 0) {
        designation = workforce[0].designation;
        storeId = workforce[0].store_id;
      }
    }

    return {
      token,
      sessionId,
      user: {
        userId: userId,
        email: user.email,
        name: user.name,
        role: user.role,
        designation,
        storeId
      }
    };
  },

  async logout(userId: string, sessionId: string) {
    await query(
      `UPDATE ${table('login_sessions')}
       SET logout_time = current_timestamp(), session_status = 'CLOSED'
       WHERE session_id = :sessionId AND user_id = :userId`,
      { sessionId, userId }
    );
    await this.logAudit(userId, 'LOGOUT');
  },

  validateToken(token: string) {
    return jwt.verify(token, JWT_SECRET) as { userId: string, role: string, email: string };
  },

  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const users = await query<any>(
      `SELECT password_hash FROM ${table('user_credentials')} WHERE user_id = :userId`,
      { userId }
    );

    if (users.length === 0) throw new Error('User not found');

    const isValid = await bcrypt.compare(oldPassword, users[0].password_hash);
    if (!isValid) throw new Error('Invalid old password');

    const newHash = await bcrypt.hash(newPassword, 10);

    // Record to password_reset_history
    await query(
      `INSERT INTO ${table('password_reset_history')} (user_id, reset_at) VALUES (:userId, current_timestamp())`,
      { userId }
    );

    await query(
      `UPDATE ${table('user_credentials')} SET password_hash = :newHash, failed_login_attempts = 0, account_locked = false, updated_at = current_timestamp() WHERE user_id = :userId`,
      { newHash, userId }
    );

    await this.logAudit(userId, 'PASSWORD_CHANGE');
  }
};
