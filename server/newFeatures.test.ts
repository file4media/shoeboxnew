import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Welcome Email System", () => {
  it("should create newsletter with welcome email fields", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const newsletter = await caller.newsletters.create({
      name: "Welcome Test Newsletter",
      description: "Testing welcome emails",
      fromName: "Test Sender",
      fromEmail: "sender@test.com",
      welcomeEmailSubject: "Welcome to our newsletter!",
      welcomeEmailContent: "Thanks for subscribing!",
    });

    expect(newsletter.id).toBeGreaterThan(0);
    expect(newsletter.name).toBe("Welcome Test Newsletter");
    expect(newsletter.welcomeEmailSubject).toBe("Welcome to our newsletter!");
    expect(newsletter.welcomeEmailContent).toBe("Thanks for subscribing!");
  });

  it("should update newsletter welcome email settings", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const newsletter = await caller.newsletters.create({
      name: "Update Welcome Test",
      description: "Testing welcome email updates",
      fromName: "Test Sender",
      fromEmail: "sender@test.com",
    });

    await caller.newsletters.update({
      id: newsletter.id,
      welcomeEmailSubject: "Updated Welcome!",
      welcomeEmailContent: "Updated content",
    });

    const updated = await caller.newsletters.getById({ id: newsletter.id });
    expect(updated.welcomeEmailSubject).toBe("Updated Welcome!");
    expect(updated.welcomeEmailContent).toBe("Updated content");
  });
});

describe("Article System", () => {
  it("should create article with all fields", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const newsletter = await caller.newsletters.create({
      name: "Article Test Newsletter",
      description: "Testing articles",
      fromName: "Test Sender",
      fromEmail: "sender@test.com",
    });

    const edition = await caller.editions.create({
      newsletterId: newsletter.id,
      subject: "Test Edition",
    });

    const article = await caller.articles.create({
      editionId: edition.id,
      title: "Test Article",
      category: "TECH",
      content: "This is test article content with more than enough words to test truncation.",
      imageUrl: "https://example.com/image.jpg",
      imageCaption: "Test caption",
    });

    expect(article.id).toBeGreaterThan(0);
    expect(article.title).toBe("Test Article");
    expect(article.category).toBe("TECH");
    expect(article.slug).toBeTruthy();
  });

  it("should list articles for edition in correct order", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const newsletter = await caller.newsletters.create({
      name: "Order Test Newsletter",
      description: "Testing article order",
      fromName: "Test Sender",
      fromEmail: "sender@test.com",
    });

    const edition = await caller.editions.create({
      newsletterId: newsletter.id,
      subject: "Order Test Edition",
    });

    const article1 = await caller.articles.create({
      editionId: edition.id,
      title: "First Article",
      content: "First article content",
    });

    const article2 = await caller.articles.create({
      editionId: edition.id,
      title: "Second Article",
      content: "Second article content",
    });

    const articles = await caller.articles.list({ editionId: edition.id });
    expect(articles).toHaveLength(2);
    expect(articles[0]?.title).toBe("First Article");
    expect(articles[1]?.title).toBe("Second Article");
  });

  it("should reorder articles", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const newsletter = await caller.newsletters.create({
      name: "Reorder Test Newsletter",
      description: "Testing article reordering",
      fromName: "Test Sender",
      fromEmail: "sender@test.com",
    });

    const edition = await caller.editions.create({
      newsletterId: newsletter.id,
      subject: "Reorder Test Edition",
    });

    const article1 = await caller.articles.create({
      editionId: edition.id,
      title: "Article 1",
      content: "Content 1",
    });

    const article2 = await caller.articles.create({
      editionId: edition.id,
      title: "Article 2",
      content: "Content 2",
    });

    // Reorder: swap them
    await caller.articles.reorder({
      editionId: edition.id,
      articleIds: [article2.id, article1.id],
    });

    const articles = await caller.articles.list({ editionId: edition.id });
    expect(articles[0]?.title).toBe("Article 2");
    expect(articles[1]?.title).toBe("Article 1");
  });

  it("should delete article", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const newsletter = await caller.newsletters.create({
      name: "Delete Test Newsletter",
      description: "Testing article deletion",
      fromName: "Test Sender",
      fromEmail: "sender@test.com",
    });

    const edition = await caller.editions.create({
      newsletterId: newsletter.id,
      subject: "Delete Test Edition",
    });

    const article = await caller.articles.create({
      editionId: edition.id,
      title: "Article to Delete",
      content: "This will be deleted",
    });

    await caller.articles.delete({ id: article.id });

    const articles = await caller.articles.list({ editionId: edition.id });
    expect(articles).toHaveLength(0);
  });
});

describe("Email Template System", () => {
  it("should create edition with template style", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const newsletter = await caller.newsletters.create({
      name: "Template Test Newsletter",
      description: "Testing templates",
      fromName: "Test Sender",
      fromEmail: "sender@test.com",
    });

    const edition = await caller.editions.create({
      newsletterId: newsletter.id,
      subject: "Template Test Edition",
    });

    await caller.editions.update({
      id: edition.id,
      templateStyle: "minimalist",
    });

    const updated = await caller.editions.getById({ id: edition.id });
    expect(updated.templateStyle).toBe("minimalist");
  });

  it("should support all template styles", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const newsletter = await caller.newsletters.create({
      name: "All Templates Test",
      description: "Testing all template styles",
      fromName: "Test Sender",
      fromEmail: "sender@test.com",
    });

    const templates = ["morning-brew", "minimalist", "bold", "magazine"] as const;

    for (const template of templates) {
      const edition = await caller.editions.create({
        newsletterId: newsletter.id,
        subject: `${template} Edition`,
      });

      await caller.editions.update({
        id: edition.id,
        templateStyle: template,
      });

      const updated = await caller.editions.getById({ id: edition.id });
      expect(updated.templateStyle).toBe(template);
    }
  });
});

describe("Scheduled Publishing", () => {
  it("should create edition with scheduled date", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const newsletter = await caller.newsletters.create({
      name: "Schedule Test Newsletter",
      description: "Testing scheduling",
      fromName: "Test Sender",
      fromEmail: "sender@test.com",
    });

    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow

    const edition = await caller.editions.create({
      newsletterId: newsletter.id,
      subject: "Scheduled Edition",
    });

    await caller.editions.update({
      id: edition.id,
      scheduledFor: futureDate,
      status: "scheduled",
    });

    const updated = await caller.editions.getById({ id: edition.id });
    expect(updated.status).toBe("scheduled");
    expect(updated.scheduledFor).toBeTruthy();
  });

  it("should update edition intro text", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const newsletter = await caller.newsletters.create({
      name: "Intro Test Newsletter",
      description: "Testing intro text",
      fromName: "Test Sender",
      fromEmail: "sender@test.com",
    });

    const edition = await caller.editions.create({
      newsletterId: newsletter.id,
      subject: "Intro Test Edition",
    });

    await caller.editions.update({
      id: edition.id,
      introText: "Good morning! Welcome to today's edition.",
    });

    const updated = await caller.editions.getById({ id: edition.id });
    expect(updated.introText).toBe("Good morning! Welcome to today's edition.");
  });
});
