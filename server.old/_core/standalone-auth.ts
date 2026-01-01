import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { users } from '../../drizzle/schema';
import { getDb } from '../db';

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-in-production';
const COOKIE_NAME = 'auth_token';

export interface AuthUser {
  id: number;
  email: string;
  name: string | null;
  role: 'user' | 'admin';
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

/**
 * Generate JWT token for user
 */
export function generateToken(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Hash password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Verify password
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Middleware to authenticate requests
 */
export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.cookies[COOKIE_NAME];
  
  if (!token) {
    req.user = undefined;
    return next();
  }

  const user = verifyToken(token);
  if (user) {
    req.user = user;
  }
  
  next();
}

/**
 * Middleware to require authentication
 */
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

/**
 * Middleware to require admin role
 */
export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

/**
 * Register new user
 */
export async function registerUser(email: string, password: string, name?: string): Promise<AuthUser | { error: string }> {
  const db = await getDb();
  if (!db) {
    return { error: 'Database not available' };
  }

  try {
    // Check if user already exists
    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing.length > 0) {
      return { error: 'Email already registered' };
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Check if this is the first user (make them admin)
    const allUsers = await db.select().from(users).limit(1);
    const role = allUsers.length === 0 ? 'admin' : 'user';

    // Create user
    const result = await db.insert(users).values({
      email,
      passwordHash,
      name: name || null,
      loginMethod: 'email',
      role,
      lastSignedIn: new Date(),
    });

    const userId = Number(result[0].insertId);

    return {
      id: userId,
      email,
      name: name || null,
      role,
    };
  } catch (error) {
    console.error('[Auth] Registration error:', error);
    return { error: 'Registration failed' };
  }
}

/**
 * Login user
 */
export async function loginUser(email: string, password: string): Promise<AuthUser | { error: string }> {
  const db = await getDb();
  if (!db) {
    return { error: 'Database not available' };
  }

  try {
    // Find user
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (result.length === 0) {
      return { error: 'Invalid email or password' };
    }

    const user = result[0];

    // Verify password
    if (!user.passwordHash) {
      return { error: 'Invalid email or password' };
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return { error: 'Invalid email or password' };
    }

    // Update last signed in
    await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, user.id));

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  } catch (error) {
    console.error('[Auth] Login error:', error);
    return { error: 'Login failed' };
  }
}

/**
 * Set auth cookie
 */
export function setAuthCookie(res: Response, token: string) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });
}

/**
 * Clear auth cookie
 */
export function clearAuthCookie(res: Response) {
  res.clearCookie(COOKIE_NAME);
}
