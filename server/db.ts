// Database query helpers - return raw Drizzle results
import { drizzle } from "drizzle-orm/mysql2";
import { eq, and, desc, asc, sql } from "drizzle-orm";
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

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result[0] || null;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0] || null;
}

export async function createUser(user: InsertUser) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(users).values(user);
  return Number(result[0].insertId);
}

export async function updateUser(id: number, updates: Partial<InsertUser>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(users).set(updates).where(eq(users.id, id));
}

// ============ Newsletter Functions ============

export async function getNewslettersByUserId(userId: number): Promise<Newsletter[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(newsletters).where(eq(newsletters.userId, userId));
}

export async function getNewsletterById(id: number): Promise<Newsletter | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(newsletters).where(eq(newsletters.id, id)).limit(1);
  return result[0] || null;
}

export async function createNewsletter(newsletter: InsertNewsletter): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(newsletters).values(newsletter);
  return Number(result[0].insertId);
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

export async function getSubscriberByEmail(email: string): Promise<Subscriber | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(subscribers).where(eq(subscribers.email, email)).limit(1);
  return result[0] || null;
}

export async function createSubscriber(subscriber: InsertSubscriber): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(subscribers).values(subscriber);
  return Number(result[0].insertId);
}

export async function updateSubscriber(id: number, updates: Partial<InsertSubscriber>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(subscribers).set(updates).where(eq(subscribers.id, id));
}

// ============ Newsletter Subscriber Functions ============

export async function getNewsletterSubscribers(newsletterId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select({
      subscriber: subscribers,
      subscription: newsletterSubscribers,
    })
    .from(newsletterSubscribers)
    .innerJoin(subscribers, eq(newsletterSubscribers.subscriberId, subscribers.id))
    .where(
      and(
        eq(newsletterSubscribers.newsletterId, newsletterId),
        eq(newsletterSubscribers.status, 'subscribed')
      )
    );
}

export async function subscribeToNewsletter(newsletterId: number, subscriberId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Check if subscription already exists
  const existing = await db
    .select()
    .from(newsletterSubscribers)
    .where(
      and(
        eq(newsletterSubscribers.newsletterId, newsletterId),
        eq(newsletterSubscribers.subscriberId, subscriberId)
      )
    )
    .limit(1);
  
  if (existing.length > 0) {
    // Reactivate if unsubscribed
    await db
      .update(newsletterSubscribers)
      .set({ status: 'subscribed', subscribedAt: new Date() })
      .where(
        and(
          eq(newsletterSubscribers.newsletterId, newsletterId),
          eq(newsletterSubscribers.subscriberId, subscriberId)
        )
      );
  } else {
    // Create new subscription
    await db.insert(newsletterSubscribers).values({
      newsletterId,
      subscriberId,
      status: 'subscribed',
      subscribedAt: new Date(),
    });
  }
}

export async function unsubscribeFromNewsletter(newsletterId: number, subscriberId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(newsletterSubscribers)
    .set({ status: 'unsubscribed', unsubscribedAt: new Date() })
    .where(
      and(
        eq(newsletterSubscribers.newsletterId, newsletterId),
        eq(newsletterSubscribers.subscriberId, subscriberId)
      )
    );
}

// ============ Edition Functions ============

export async function getEditionsByNewsletterId(newsletterId: number): Promise<NewsletterEdition[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(newsletterEditions)
    .where(eq(newsletterEditions.newsletterId, newsletterId))
    .orderBy(desc(newsletterEditions.createdAt));
}

export async function getEditionById(id: number): Promise<NewsletterEdition | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(newsletterEditions).where(eq(newsletterEditions.id, id)).limit(1);
  return result[0] || null;
}

export async function createEdition(edition: InsertNewsletterEdition): Promise<NewsletterEdition> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(newsletterEditions).values(edition);
  const insertedId = Number(result[0].insertId);
  
  const created = await getEditionById(insertedId);
  if (!created) {
    throw new Error("Failed to create edition");
  }
  
  return created;
}

export async function updateEdition(id: number, updates: Partial<InsertNewsletterEdition>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(newsletterEditions).set(updates).where(eq(newsletterEditions.id, id));
}

export async function deleteEdition(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(newsletterEditions).where(eq(newsletterEditions.id, id));
}

export async function getScheduledEditions(): Promise<NewsletterEdition[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(newsletterEditions)
    .where(
      and(
        eq(newsletterEditions.status, 'scheduled'),
        sql`${newsletterEditions.scheduledFor} <= NOW()`
      )
    );
}

// ============ Article Functions ============

export async function getArticlesByEditionId(editionId: number): Promise<Article[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(articles)
    .where(eq(articles.editionId, editionId))
    .orderBy(asc(articles.displayOrder));
}

export async function getArticleById(id: number): Promise<Article | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(articles).where(eq(articles.id, id)).limit(1);
  return result[0] || null;
}

export async function createArticle(article: InsertArticle): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(articles).values(article);
  return Number(result[0].insertId);
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
  
  // Update order index for each article
  for (let i = 0; i < articleIds.length; i++) {
    await db
      .update(articles)
      .set({ displayOrder: i })
      .where(
        and(
          eq(articles.id, articleIds[i]),
          eq(articles.editionId, editionId)
        )
      );
  }
}

// ============ Email Tracking Functions ============

export async function createEmailTracking(tracking: InsertEmailTracking): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(emailTracking).values(tracking);
  return Number(result[0].insertId);
}

export async function recordEmailOpen(trackingId: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(emailTracking)
    .set({ 
 
      openedAt: new Date(),
      openCount: sql`${emailTracking.openCount} + 1`
    })
    .where(eq(emailTracking.trackingToken, trackingId));
}

export async function getEmailTrackingStats(editionId: number) {
  const db = await getDb();
  if (!db) return { sent: 0, opened: 0, openRate: 0 };
  
  const stats = await db
    .select({
      sent: sql<number>`COUNT(*)`,
      opened: sql<number>`SUM(CASE WHEN ${emailTracking.openedAt} IS NOT NULL THEN 1 ELSE 0 END)`,
    })
    .from(emailTracking)
    .where(eq(emailTracking.editionId, editionId));
  
  const sent = stats[0]?.sent || 0;
  const opened = stats[0]?.opened || 0;
  const openRate = sent > 0 ? (opened / sent) * 100 : 0;
  
  return { sent, opened, openRate };
}
