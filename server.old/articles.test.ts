import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "sample-user",
    email: "sample@example.com",
    name: "Sample User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return ctx;
}

describe("Article System", () => {
  let newsletterId: number;
  let editionId: number;
  let articleId: number;

  it("should create a newsletter for testing", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const newsletter = await caller.newsletters.create({
      name: "Article Test Newsletter",
      description: "Testing article system",
      fromName: "Test Sender",
      fromEmail: "test@example.com",
    });

    expect(newsletter).toBeDefined();
    expect(newsletter.id).toBeGreaterThan(0);
    newsletterId = newsletter.id;
  });

  it("should create an edition for testing", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const edition = await caller.editions.create({
      newsletterId,
      subject: "Test Edition with Articles",
      previewText: "Testing article cards",
    });

    expect(edition).toBeDefined();
    expect(edition.id).toBeGreaterThan(0);
    editionId = edition.id;
  });

  it("should create an article", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const article = await caller.articles.create({
      editionId,
      category: "TECH",
      title: "AI Breakthrough in 2025",
      slug: "ai-breakthrough-2025",
      content: "This is a test article about AI developments. ".repeat(50),
      imageUrl: "https://example.com/image.jpg",
      imageCaption: "AI visualization",
      displayOrder: 0,
    });

    expect(article).toBeDefined();
    expect(article.id).toBeGreaterThan(0);
    expect(article.title).toBe("AI Breakthrough in 2025");
    expect(article.category).toBe("TECH");
    expect(article.slug).toBe("ai-breakthrough-2025");
    articleId = article.id;
  });

  it("should list articles for an edition", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const articles = await caller.articles.list({ editionId });

    expect(articles).toBeDefined();
    expect(articles.length).toBeGreaterThan(0);
    expect(articles[0]?.title).toBe("AI Breakthrough in 2025");
  });

  it("should get article by ID", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const article = await caller.articles.getById({ id: articleId });

    expect(article).toBeDefined();
    expect(article.id).toBe(articleId);
    expect(article.title).toBe("AI Breakthrough in 2025");
  });

  it("should update an article", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.articles.update({
      id: articleId,
      title: "Updated AI Article Title",
      category: "SCIENCE",
    });

    expect(result.success).toBe(true);

    const updated = await caller.articles.getById({ id: articleId });
    expect(updated.title).toBe("Updated AI Article Title");
    expect(updated.category).toBe("SCIENCE");
  });

  it("should create multiple articles and reorder them", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const article2 = await caller.articles.create({
      editionId,
      title: "Second Article",
      slug: "second-article",
      content: "Second article content",
      displayOrder: 1,
    });

    const article3 = await caller.articles.create({
      editionId,
      title: "Third Article",
      slug: "third-article",
      content: "Third article content",
      displayOrder: 2,
    });

    expect(article2.id).toBeGreaterThan(0);
    expect(article3.id).toBeGreaterThan(0);

    // Reorder: swap first and second
    await caller.articles.reorder({
      editionId,
      articleIds: [article2.id, articleId, article3.id],
    });

    const articles = await caller.articles.list({ editionId });
    expect(articles[0]?.id).toBe(article2.id);
    expect(articles[1]?.id).toBe(articleId);
    expect(articles[2]?.id).toBe(article3.id);
  });

  it("should update edition with intro text and schedule", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const scheduledDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow

    const result = await caller.editions.update({
      id: editionId,
      introText: "Good morning! Welcome to today's edition.",
      scheduledFor: scheduledDate,
    });

    expect(result.success).toBe(true);

    const edition = await caller.editions.getById({ id: editionId });
    expect(edition.introText).toBe("Good morning! Welcome to today's edition.");
    expect(edition.scheduledFor).toBeDefined();
  });

  it("should delete an article", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.articles.delete({ id: articleId });
    expect(result.success).toBe(true);

    // Verify it's deleted
    await expect(
      caller.articles.getById({ id: articleId })
    ).rejects.toThrow();
  });
});
