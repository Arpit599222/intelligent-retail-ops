import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService.js';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
    email: string;
  };
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Missing or invalid token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = authService.validateToken(token);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Token expired or invalid' });
  }
}

function requireRole(roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized', message: 'User not authenticated' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden', message: 'Insufficient permissions' });
    }
    next();
  };
}

export const requireSuperAdmin = [requireAuth, requireRole(['SUPER_ADMIN'])];
export const requireAdmin = [requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN'])];
export const requireManager = [requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STORE_MANAGER'])];
export const requireWorker = [requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STORE_MANAGER', 'WORKER', 'OPERATIONS_STAFF'])];
