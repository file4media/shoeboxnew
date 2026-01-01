import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `user${userId}@example.com`,
    name: `Test User ${userId}`,
    loginMethod: "manus",
    role: "user",
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

describe("newsletters", () => {
  it("should create a newsletter", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const newsletter = await caller.newsletters.create({
      name: "Test Newsletter",
      description: "A test newsletter",
      fromName: "Test Sender",
      fromEmail: "sender@example.com",
    });

    expect(newsletter).toBeDefined();
    expect(newsletter.id).toBeGreaterThan(0);
    expect(newsletter.name).toBe("Test Newsletter");
    expect(newsletter.fromEmail).toBe("sender@example.com");
  });

  it("should list newsletters for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a newsletter first
    await caller.newsletters.create({
      name: "Test Newsletter 1",
      description: "First test newsletter",
      fromName: "Test Sender",
      fromEmail: "sender@example.com",
    });

    const newsletters = await caller.newsletters.list();

    expect(newsletters).toBeDefined();
    expect(Array.isArray(newsletters)).toBe(true);
    expect(newsletters.length).toBeGreaterThan(0);
  });

  it("should get newsletter by id", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const created = await caller.newsletters.create({
      name: "Test Newsletter",
      description: "A test newsletter",
      fromName: "Test Sender",
      fromEmail: "sender@example.com",
    });

    const newsletter = await caller.newsletters.getById({ id: created.id });

    expect(newsletter).toBeDefined();
    expect(newsletter?.id).toBe(created.id);
    expect(newsletter?.name).toBe("Test Newsletter");
  });

  it("should update newsletter", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const created = await caller.newsletters.create({
      name: "Original Name",
      description: "Original description",
      fromName: "Test Sender",
      fromEmail: "sender@example.com",
    });

    await caller.newsletters.update({
      id: created.id,
      name: "Updated Name",
      description: "Updated description",
    });

    const updated = await caller.newsletters.getById({ id: created.id });

    expect(updated?.name).toBe("Updated Name");
    expect(updated?.description).toBe("Updated description");
  });
});

describe("editions", () => {
  it("should create an edition", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const newsletter = await caller.newsletters.create({
      name: "Test Newsletter",
      description: "A test newsletter",
      fromName: "Test Sender",
      fromEmail: "sender@example.com",
    });

    const edition = await caller.editions.create({
      newsletterId: newsletter.id,
      subject: "Test Edition",
      contentMarkdown: "# Hello World\n\nThis is a test.",
    });

    expect(edition).toBeDefined();
    expect(edition.id).toBeGreaterThan(0);
    expect(edition.subject).toBe("Test Edition");
    expect(edition.status).toBe("draft");
  });

  it("should list editions for a newsletter", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const newsletter = await caller.newsletters.create({
      name: "Test Newsletter",
      description: "A test newsletter",
      fromName: "Test Sender",
      fromEmail: "sender@example.com",
    });

    await caller.editions.create({
      newsletterId: newsletter.id,
      subject: "Edition 1",
      contentMarkdown: "Content 1",
    });

    await caller.editions.create({
      newsletterId: newsletter.id,
      subject: "Edition 2",
      contentMarkdown: "Content 2",
    });

    const editions = await caller.editions.list({ newsletterId: newsletter.id });

    expect(editions).toBeDefined();
    expect(Array.isArray(editions)).toBe(true);
    expect(editions.length).toBe(2);
  });

  it("should update edition content", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const newsletter = await caller.newsletters.create({
      name: "Test Newsletter",
      description: "A test newsletter",
      fromName: "Test Sender",
      fromEmail: "sender@example.com",
    });

    const edition = await caller.editions.create({
      newsletterId: newsletter.id,
      subject: "Original Subject",
      contentMarkdown: "Original content",
    });

    await caller.editions.update({
      id: edition.id,
      subject: "Updated Subject",
      contentMarkdown: "Updated content",
    });

    const updated = await caller.editions.getById({ id: edition.id });

    expect(updated?.subject).toBe("Updated Subject");
    expect(updated?.contentMarkdown).toBe("Updated content");
  });
});

describe("subscribers", () => {
  it("should add a subscriber to a newsletter", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const newsletter = await caller.newsletters.create({
      name: "Test Newsletter",
      description: "A test newsletter",
      fromName: "Test Sender",
      fromEmail: "sender@example.com",
    });

    const result = await caller.subscribers.add({
      newsletterId: newsletter.id,
      email: "subscriber@example.com",
      name: "Test Subscriber",
    });

    expect(result.success).toBe(true);
  });

  it("should list subscribers for a newsletter", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const newsletter = await caller.newsletters.create({
      name: "Test Newsletter",
      description: "A test newsletter",
      fromName: "Test Sender",
      fromEmail: "sender@example.com",
    });

    await caller.subscribers.add({
      newsletterId: newsletter.id,
      email: "subscriber1@example.com",
      name: "Subscriber 1",
    });

    await caller.subscribers.add({
      newsletterId: newsletter.id,
      email: "subscriber2@example.com",
      name: "Subscriber 2",
    });

    const subscribers = await caller.subscribers.getByNewsletter({
      newsletterId: newsletter.id,
    });

    expect(subscribers).toBeDefined();
    expect(Array.isArray(subscribers)).toBe(true);
    expect(subscribers.length).toBe(2);
  });

  it("should handle duplicate subscriber emails gracefully", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const newsletter = await caller.newsletters.create({
      name: "Test Newsletter",
      description: "A test newsletter",
      fromName: "Test Sender",
      fromEmail: "sender@example.com",
    });

    const first = await caller.subscribers.add({
      newsletterId: newsletter.id,
      email: "duplicate@example.com",
      name: "First Add",
    });

    // Try to add the same email again - should return existing subscriber
    const second = await caller.subscribers.add({
      newsletterId: newsletter.id,
      email: "duplicate@example.com",
      name: "Second Add",
    });

    expect(second.success).toBe(true);
    expect(second.subscriber.email).toBe("duplicate@example.com");
  });
});
