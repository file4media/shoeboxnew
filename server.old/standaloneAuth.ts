import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { User, users } from "../drizzle/schema";
import * as db from "./db";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "change-this-secret-in-production"
);

export interface AuthTokenPayload {
  userId: number;
  email: string;
  [key: string]: unknown;
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a JWT token for a user
 */
export async function generateToken(user: User): Promise<string> {
  const payload: AuthTokenPayload = {
    userId: user.id,
    email: user.email || "",
  };

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);

  return token;
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(token: string): Promise<AuthTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      userId: payload.userId as number,
      email: payload.email as string,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Register a new user
 */
export async function registerUser(
  email: string,
  password: string,
  name?: string
): Promise<User> {
  // Check if user already exists
  const existingUser = await db.getUserByEmail(email);
  if (existingUser) {
    throw new Error("User already exists");
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Check if this is the first user (should be admin)
  // For now, we'll make the first user an admin by checking if any users exist
  const testDb = await db.getDb();
  if (!testDb) {
    throw new Error("Database not available");
  }
  
  const allUsers = await testDb.select().from(users);
  const isFirstUser = allUsers.length === 0;

  // Create user
  const userId = await db.createUser({
    email,
    passwordHash,
    name: name || email.split("@")[0],
    loginMethod: "email",
    role: isFirstUser ? "admin" : "user",
    lastSignedIn: new Date(),
  });

  const user = await db.getUserById(userId);
  if (!user) {
    throw new Error("Failed to create user");
  }

  return user;
}

/**
 * Login a user with email and password
 */
export async function loginUser(email: string, password: string): Promise<User | null> {
  const user = await db.getUserByEmail(email);
  if (!user) {
    return null;
  }

  if (!user.passwordHash) {
    return null;
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return null;
  }

  // Update last signed in
  await db.updateUser(user.id, {
    lastSignedIn: new Date(),
  });

  return user;
}
