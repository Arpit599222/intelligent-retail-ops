import { Router, Request, Response } from 'express';
import { authService } from '../services/authService.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { rateLimiter } from '../middleware/rateLimiter.js';

const router = Router();
const authLimiter = rateLimiter(5 * 60 * 1000, 10); // 10 login/change attempts per 5 minutes

// POST /api/auth/login
router.post('/login', authLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, code: 'Please enter both credentials.' });
    }

    // 1. Validate Email format
    const emailClean = email.trim().toLowerCase();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(emailClean)) {
      return res.status(400).json({ success: false, code: 'Invalid email address format.' });
    }

    // 2. Validate Password length
    if (password.length < 6 || password.length > 100) {
      return res.status(400).json({ success: false, code: 'Password must be between 6 and 100 characters.' });
    }

    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    const authData = await authService.login(emailClean, password, ipAddress, userAgent);

    return res.json({
      success: true,
      code: 'SUCCESS',
      ...authData
    });
  } catch (err: any) {
    console.error('[Auth Login Error]', err);
    return res.status(401).json({ success: false, code: err.message || 'Authentication failed' });
  }
});

// POST /api/auth/logout
router.post('/logout', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ success: false, code: 'sessionId is required.' });
    }

    const sessionIdRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!sessionIdRegex.test(sessionId)) {
      return res.status(400).json({ success: false, code: 'Invalid Session ID format.' });
    }

    if (req.user && sessionId) {
      await authService.logout(req.user.userId, sessionId);
    }
    return res.json({ success: true });
  } catch (err) {
    console.error('[Auth Logout Error]', err);
    return res.status(500).json({ success: false, code: 'Server error' });
  }
});

// POST /api/auth/first-login-change-password
router.post('/first-login-change-password', authLimiter, async (req: Request, res: Response) => {
  try {
    const { userId, temporaryPassword, newPassword } = req.body;
    if (!userId || !temporaryPassword || !newPassword) {
      return res.status(400).json({ success: false, code: 'Missing fields' });
    }

    // 1. Validate User ID UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      return res.status(400).json({ success: false, code: 'Invalid User ID format.' });
    }

    // 2. Validate Temporary Password format (10-char alphanumeric)
    const tempPassRegex = /^[a-zA-Z0-9]{10}$/;
    if (!tempPassRegex.test(temporaryPassword)) {
      return res.status(400).json({ success: false, code: 'Invalid temporary password format.' });
    }

    // 3. Validate New Password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ success: false, code: 'New password does not meet strength requirements (min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character).' });
    }

    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    const authData = await authService.firstLoginChangePassword(userId, temporaryPassword, newPassword, ipAddress, userAgent);

    return res.json({
      success: true,
      code: 'SUCCESS',
      ...authData
    });
  } catch (err: any) {
    console.error('[Auth First Login Error]', err);
    return res.status(400).json({ success: false, code: err.message });
  }
});

// POST /api/auth/change-password
router.post('/change-password', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!req.user || !oldPassword || !newPassword) {
      return res.status(400).json({ success: false, code: 'Missing fields' });
    }
    await authService.changePassword(req.user.userId, oldPassword, newPassword);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(400).json({ success: false, code: err.message });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { targetUserId, newPassword } = req.body;
    if (!targetUserId || !newPassword) {
      return res.status(400).json({ success: false, code: 'Missing fields' });
    }
    if (req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, code: 'Forbidden' });
    }
    const bcrypt = (await import('bcrypt')).default;
    const { query, table } = await import('../database/databricks.js');
    const newHash = await bcrypt.hash(newPassword, 10);
    await query(`UPDATE ${table('user_credentials')} SET password_hash = :newHash, failed_attempts = 0, is_locked = false WHERE user_id = :userId`, { newHash, userId: targetUserId });
    await authService.logAudit(req.user.userId, 'ADMIN_RESET_PASSWORD', null, targetUserId);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ success: false, code: 'Server error' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false });
    }
    const { query, table } = await import('../database/databricks.js');
    const users = await query<any>(`SELECT user_id, email, concat(first_name, ' ', last_name) as name, role FROM ${table('users')} WHERE user_id = :userId`, { userId: req.user.userId });
    if (users.length === 0) return res.status(404).json({ success: false });
    return res.json({ success: true, user: users[0] });
  } catch (err) {
    return res.status(500).json({ success: false });
  }
});

export default router;
