import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import { createContext } from "./context";
import type { inferProcedureInput } from "@trpc/server";
import type { AppRouter } from "./routers";
import { getDb } from "./db";
import { users, newsletters, authors } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Authors System", () => {
  let testUserId: number;
  let testNewsletterId: number;
  let testAuthorId: number;
  let authToken: string;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Clean up any existing test data
    await db.delete(users).where(eq(users.email, "author-test@example.com"));

    // Create test user
    const [userResult] = await db.insert(users).values({
      email: "author-test@example.com",
      passwordHash: "test-hash",
      name: "Author Test User",
      role: "admin",
    });
    testUserId = userResult.insertId;

    // Create test newsletter
    const [newsletterResult] = await db.insert(newsletters).values({
      userId: testUserId,
      name: "Test Newsletter for Authors",
      description: "Testing author system",
      fromName: "Test Sender",
      fromEmail: "test@example.com",
    });
    testNewsletterId = newsletterResult.insertId;

    // Generate auth token (simplified for testing)
    const jwt = await import("jsonwebtoken");
    authToken = jwt.sign(
      { userId: testUserId, email: "author-test@example.com" },
      process.env.JWT_SECRET || "test-secret",
      { expiresIn: "1h" }
    );
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    // Clean up test data
    if (testNewsletterId) {
      await db.delete(newsletters).where(eq(newsletters.id, testNewsletterId));
    }
    if (testUserId) {
      await db.delete(users).where(eq(users.id, testUserId));
    }
  });

  it("should create an author with writing style", async () => {
    const mockReq = {
      headers: { cookie: `auth_token=${authToken}` },
      cookies: { auth_token: authToken },
    } as any;
    const mockRes = {
      cookie: () => {},
      clearCookie: () => {},
    } as any;

    const ctx = await createContext({ req: mockReq, res: mockRes });
    const caller = appRouter.createCaller(ctx);

    type CreateAuthorInput = inferProcedureInput<AppRouter["authors"]["create"]>;
    const input: CreateAuthorInput = {
      newsletterId: testNewsletterId,
      name: "Sarah Chen",
      bio: "Tech analyst and writer",
      writingStyle: "technical",
      tone: "professional",
      personality: "Data-driven, uses statistics, prefers short paragraphs",
    };

    const author = await caller.authors.create(input);

    expect(author).toBeDefined();
    expect(author.name).toBe("Sarah Chen");
    expect(author.writingStyle).toBe("technical");
    expect(author.tone).toBe("professional");
    expect(author.personality).toBe("Data-driven, uses statistics, prefers short paragraphs");

    testAuthorId = author.id;
  });

  it("should list authors for a newsletter", async () => {
    const mockReq = {
      headers: { cookie: `auth_token=${authToken}` },
      cookies: { auth_token: authToken },
    } as any;
    const mockRes = {
      cookie: () => {},
      clearCookie: () => {},
    } as any;

    const ctx = await createContext({ req: mockReq, res: mockRes });
    const caller = appRouter.createCaller(ctx);

    const authorsList = await caller.authors.list({ newsletterId: testNewsletterId });

    expect(authorsList).toBeDefined();
    expect(authorsList.length).toBeGreaterThan(0);
    expect(authorsList[0].name).toBe("Sarah Chen");
  });

  it("should get author by ID", async () => {
    const mockReq = {
      headers: { cookie: `auth_token=${authToken}` },
      cookies: { auth_token: authToken },
    } as any;
    const mockRes = {
      cookie: () => {},
      clearCookie: () => {},
    } as any;

    const ctx = await createContext({ req: mockReq, res: mockRes });
    const caller = appRouter.createCaller(ctx);

    const author = await caller.authors.getById({ id: testAuthorId });

    expect(author).toBeDefined();
    expect(author?.name).toBe("Sarah Chen");
    expect(author?.writingStyle).toBe("technical");
  });

  it("should update author", async () => {
    const mockReq = {
      headers: { cookie: `auth_token=${authToken}` },
      cookies: { auth_token: authToken },
    } as any;
    const mockRes = {
      cookie: () => {},
      clearCookie: () => {},
    } as any;

    const ctx = await createContext({ req: mockReq, res: mockRes });
    const caller = appRouter.createCaller(ctx);

    const updated = await caller.authors.update({
      id: testAuthorId,
      name: "Sarah Chen, PhD",
      writingStyle: "academic",
      tone: "authoritative",
    });

    expect(updated).toBeDefined();
    expect(updated?.name).toBe("Sarah Chen, PhD");
    expect(updated?.writingStyle).toBe("academic");
    expect(updated?.tone).toBe("authoritative");
  });

  it("should create article with author assignment", async () => {
    const mockReq = {
      headers: { cookie: `auth_token=${authToken}` },
      cookies: { auth_token: authToken },
    } as any;
    const mockRes = {
      cookie: () => {},
      clearCookie: () => {},
    } as any;

    const ctx = await createContext({ req: mockReq, res: mockRes });
    const caller = appRouter.createCaller(ctx);

    type CreateArticleInput = inferProcedureInput<AppRouter["articles"]["create"]>;
    const input: CreateArticleInput = {
      newsletterId: testNewsletterId,
      title: "Test Article with Author",
      content: "This article is written by Sarah Chen",
      excerpt: "Test excerpt",
      category: "Tech",
      status: "draft",
      authorId: testAuthorId,
    };

    const article = await caller.articles.create(input);

    expect(article).toBeDefined();
    expect(article.title).toBe("Test Article with Author");
    expect(article.authorId).toBe(testAuthorId);
  });

  it("should delete author", async () => {
    const mockReq = {
      headers: { cookie: `auth_token=${authToken}` },
      cookies: { auth_token: authToken },
    } as any;
    const mockRes = {
      cookie: () => {},
      clearCookie: () => {},
    } as any;

    const ctx = await createContext({ req: mockReq, res: mockRes });
    const caller = appRouter.createCaller(ctx);

    // Create a new author to delete (so we don't delete the one used in article test)
    const tempAuthor = await caller.authors.create({
      newsletterId: testNewsletterId,
      name: "Temp Author",
      bio: "Temporary author for deletion test",
      writingStyle: "casual",
      tone: "friendly",
    });

    const result = await caller.authors.delete({ id: tempAuthor.id });

    expect(result.success).toBe(true);

    // Verify author is deleted
    const author = await caller.authors.getById({ id: tempAuthor.id });
    expect(author).toBeNull();
  });
});
