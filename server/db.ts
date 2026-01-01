import { eq, and, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users,
  newsletters,
  Newsletter,
  InsertNewsletter,
  subscribers,
  Subscriber,
  InsertSubscriber,
  newsletterSubscribers,
  NewsletterSubscriber,
  InsertNewsletterSubscriber,
  newsletterEditions,
  NewsletterEdition,
  InsertNewsletterEdition,
  emailTracking,
  EmailTracking,
  InsertEmailTracking,
  articles,
  Article,
  InsertArticle
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ User Functions ============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ Newsletter Functions ============

export async function createNewsletter(newsletter: InsertNewsletter): Promise<Newsletter> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(newsletters).values(newsletter);
  const insertedId = Number(result[0].insertId);
  
  const inserted = await db.select().from(newsletters).where(eq(newsletters.id, insertedId)).limit(1);
  if (!inserted[0]) throw new Error("Failed to retrieve inserted newsletter");
  
  return inserted[0];
}

export async function getNewslettersByUserId(userId: number): Promise<Newsletter[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(newsletters).where(eq(newsletters.userId, userId)).orderBy(desc(newsletters.createdAt));
}

export async function getNewsletterById(id: number): Promise<Newsletter | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(newsletters).where(eq(newsletters.id, id)).limit(1);
  return result[0];
}

export async function updateNewsletter(id: number, updates: Partial<InsertNewsletter>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(newsletters).set(updates).where(eq(newsletters.id, id));
}

export async function deleteNewsletter(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(newsletters).where(eq(newsletters.id, id));
}

// ============ Subscriber Functions ============

export async function createSubscriber(subscriber: InsertSubscriber): Promise<Subscriber> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(subscribers).values(subscriber);
  const insertedId = Number(result[0].insertId);
  
  const inserted = await db.select().from(subscribers).where(eq(subscribers.id, insertedId)).limit(1);
  if (!inserted[0]) throw new Error("Failed to retrieve inserted subscriber");
  
  return inserted[0];
}

export async function getSubscriberByEmail(email: string): Promise<Subscriber | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(subscribers).where(eq(subscribers.email, email)).limit(1);
  return result[0];
}

export async function getSubscriberById(id: number): Promise<Subscriber | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(subscribers).where(eq(subscribers.id, id)).limit(1);
  return result[0];
}

export async function updateSubscriber(id: number, updates: Partial<InsertSubscriber>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(subscribers).set(updates).where(eq(subscribers.id, id));
}

// ============ Newsletter Subscriber Functions ============

export async function subscribeToNewsletter(newsletterId: number, subscriberId: number): Promise<NewsletterSubscriber> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(newsletterSubscribers).values({
    newsletterId,
    subscriberId,
    status: "subscribed",
  });
  
  const insertedId = Number(result[0].insertId);
  const inserted = await db.select().from(newsletterSubscribers).where(eq(newsletterSubscribers.id, insertedId)).limit(1);
  if (!inserted[0]) throw new Error("Failed to retrieve inserted newsletter subscriber");
  
  return inserted[0];
}

export async function unsubscribeFromNewsletter(newsletterId: number, subscriberId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(newsletterSubscribers)
    .set({ status: "unsubscribed", unsubscribedAt: new Date() })
    .where(
      and(
        eq(newsletterSubscribers.newsletterId, newsletterId),
        eq(newsletterSubscribers.subscriberId, subscriberId)
      )
    );
}

export async function getNewsletterSubscribers(newsletterId: number): Promise<Array<Subscriber & { subscriptionStatus: string }>> {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      id: subscribers.id,
      email: subscribers.email,
      name: subscribers.name,
      status: subscribers.status,
      createdAt: subscribers.createdAt,
      updatedAt: subscribers.updatedAt,
      subscriptionStatus: newsletterSubscribers.status,
    })
    .from(newsletterSubscribers)
    .innerJoin(subscribers, eq(newsletterSubscribers.subscriberId, subscribers.id))
    .where(eq(newsletterSubscribers.newsletterId, newsletterId));

  return result;
}

export async function getSubscriberNewsletters(subscriberId: number): Promise<Newsletter[]> {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      id: newsletters.id,
      userId: newsletters.userId,
      name: newsletters.name,
      description: newsletters.description,
      fromName: newsletters.fromName,
      fromEmail: newsletters.fromEmail,
      replyToEmail: newsletters.replyToEmail,
      logoUrl: newsletters.logoUrl,
      primaryColor: newsletters.primaryColor,
      welcomeEmailSubject: newsletters.welcomeEmailSubject,
      welcomeEmailContent: newsletters.welcomeEmailContent,
      sendWelcomeEmail: newsletters.sendWelcomeEmail,
      isActive: newsletters.isActive,
      createdAt: newsletters.createdAt,
      updatedAt: newsletters.updatedAt,
    })
    .from(newsletterSubscribers)
    .innerJoin(newsletters, eq(newsletterSubscribers.newsletterId, newsletters.id))
    .where(
      and(
        eq(newsletterSubscribers.subscriberId, subscriberId),
        eq(newsletterSubscribers.status, "subscribed")
      )
    );

  return result;
}

// ============ Newsletter Edition Functions ============

export async function createNewsletterEdition(edition: InsertNewsletterEdition): Promise<NewsletterEdition> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(newsletterEditions).values(edition);
  const insertedId = Number(result[0].insertId);
  
  const inserted = await db.select().from(newsletterEditions).where(eq(newsletterEditions.id, insertedId)).limit(1);
  if (!inserted[0]) throw new Error("Failed to retrieve inserted edition");
  
  return inserted[0];
}

export async function getNewsletterEditions(newsletterId: number): Promise<NewsletterEdition[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(newsletterEditions)
    .where(eq(newsletterEditions.newsletterId, newsletterId))
    .orderBy(desc(newsletterEditions.createdAt));
}

export async function getNewsletterEditionById(id: number): Promise<NewsletterEdition | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(newsletterEditions).where(eq(newsletterEditions.id, id)).limit(1);
  return result[0];
}

export async function updateNewsletterEdition(id: number, updates: Partial<InsertNewsletterEdition>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(newsletterEditions).set(updates).where(eq(newsletterEditions.id, id));
}

export async function deleteNewsletterEdition(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(newsletterEditions).where(eq(newsletterEditions.id, id));
}

// ============ Email Tracking Functions ============

export async function createEmailTracking(tracking: InsertEmailTracking): Promise<EmailTracking> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(emailTracking).values(tracking);
  const insertedId = Number(result[0].insertId);
  
  const inserted = await db.select().from(emailTracking).where(eq(emailTracking.id, insertedId)).limit(1);
  if (!inserted[0]) throw new Error("Failed to retrieve inserted tracking");
  
  return inserted[0];
}

export async function getEmailTrackingByToken(token: string): Promise<EmailTracking | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(emailTracking).where(eq(emailTracking.trackingToken, token)).limit(1);
  return result[0];
}

export async function recordEmailOpen(token: string, ipAddress?: string, userAgent?: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const tracking = await getEmailTrackingByToken(token);
  if (!tracking) return;

  const updates: Partial<InsertEmailTracking> = {
    openCount: (tracking.openCount || 0) + 1,
    lastOpenedAt: new Date(),
  };

  if (!tracking.openedAt) {
    updates.openedAt = new Date();
  }

  if (ipAddress) updates.ipAddress = ipAddress;
  if (userAgent) updates.userAgent = userAgent;

  await db.update(emailTracking).set(updates).where(eq(emailTracking.trackingToken, token));
}

export async function getEditionAnalytics(editionId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select({
      totalSent: sql<number>`COUNT(*)`,
      totalOpens: sql<number>`SUM(${emailTracking.openCount})`,
      uniqueOpens: sql<number>`COUNT(CASE WHEN ${emailTracking.openedAt} IS NOT NULL THEN 1 END)`,
    })
    .from(emailTracking)
    .where(eq(emailTracking.editionId, editionId));

  return result[0];
}

export async function getNewsletterAnalytics(newsletterId: number) {
  const db = await getDb();
  if (!db) return null;

  // Get total active subscribers
  const subscribersResult = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(newsletterSubscribers)
    .where(
      and(
        eq(newsletterSubscribers.newsletterId, newsletterId),
        eq(newsletterSubscribers.status, "subscribed")
      )
    );
  
  const totalSubscribers = subscribersResult[0]?.count || 0;

  // Get all editions for this newsletter
  const editions = await db
    .select()
    .from(newsletterEditions)
    .where(eq(newsletterEditions.newsletterId, newsletterId))
    .orderBy(desc(newsletterEditions.createdAt));

  // Calculate total emails sent and opens
  let totalEmailsSent = 0;
  let totalOpens = 0;
  const recentEditions = [];

  for (const edition of editions.slice(0, 10)) {
    const trackingResult = await db
      .select({
        totalSent: sql<number>`COUNT(*)`,
        totalOpens: sql<number>`SUM(${emailTracking.openCount})`,
        uniqueOpens: sql<number>`COUNT(CASE WHEN ${emailTracking.openedAt} IS NOT NULL THEN 1 END)`,
      })
      .from(emailTracking)
      .where(eq(emailTracking.editionId, edition.id));

    const tracking = trackingResult[0];
    totalEmailsSent += tracking?.totalSent || 0;
    totalOpens += tracking?.totalOpens || 0;

    recentEditions.push({
      ...edition,
      totalRecipients: tracking?.totalSent || 0,
      uniqueOpens: tracking?.uniqueOpens || 0,
    });
  }

  return {
    totalSubscribers,
    totalEmailsSent,
    totalOpens,
    recentEditions,
  };
}

// ============ Article Functions ============

export async function createArticle(article: InsertArticle): Promise<Article> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const inserted = await db.insert(articles).values(article);
  const result = await db.select().from(articles).where(eq(articles.id, Number(inserted[0].insertId))).limit(1);
  
  return result[0]!;
}

export async function getArticlesByEdition(editionId: number): Promise<Article[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(articles).where(eq(articles.editionId, editionId)).orderBy(articles.displayOrder);
}

export async function getArticleById(id: number): Promise<Article | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(articles).where(eq(articles.id, id)).limit(1);
  return result[0];
}

export async function getArticleBySlug(editionId: number, slug: string): Promise<Article | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(articles)
    .where(and(eq(articles.editionId, editionId), eq(articles.slug, slug)))
    .limit(1);
  
  return result[0];
}

export async function updateArticle(id: number, updates: Partial<InsertArticle>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(articles).set(updates).where(eq(articles.id, id));
}

export async function deleteArticle(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(articles).where(eq(articles.id, id));
}

export async function reorderArticles(editionId: number, articleIds: number[]): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Update display order for each article
  for (let i = 0; i < articleIds.length; i++) {
    await db
      .update(articles)
      .set({ displayOrder: i })
      .where(and(eq(articles.id, articleIds[i]!), eq(articles.editionId, editionId)));
  }
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const database = await getDb();
  if (!database) {
    console.warn("[Database] Cannot get users: database not available");
    return [];
  }
  return database.select().from(users);
}
