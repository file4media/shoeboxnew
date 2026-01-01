import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../drizzle/schema";
import { verifyToken } from "./auth";
import { getUserById } from "./db";

const COOKIE_NAME = "auth_token";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    // Get token from cookie
    const token = opts.req.cookies?.[COOKIE_NAME];
    
    if (token) {
      // Verify token
      const payload = await verifyToken(token);
      
      if (payload) {
        // Get user from database
        const foundUser = await getUserById(payload.userId);
        if (foundUser) {
          user = foundUser;
        }
      }
    }
  } catch (error) {
    // Authentication is optional for public procedures
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
