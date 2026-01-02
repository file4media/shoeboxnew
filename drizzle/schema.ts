import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, index } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).unique(), // Optional for OAuth compatibility
  name: text("name"),
  email: varchar("email", { length: 320 }).notNull().unique(), // Required and unique
  passwordHash: varchar("passwordHash", { length: 255 }), // Required for email/password auth
  loginMethod: varchar("loginMethod", { length: 64 }).default("email").notNull(),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Newsletters table - each user can create multiple newsletters
 */
export const newsletters = mysqlTable("newsletters", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  fromName: varchar("fromName", { length: 255 }).notNull(),
  fromEmail: varchar("fromEmail", { length: 320 }).notNull(),
  replyToEmail: varchar("replyToEmail", { length: 320 }),
  // Branding and customization
  logoUrl: text("logoUrl"),
  primaryColor: varchar("primaryColor", { length: 7 }).default("#3b82f6"),
  // Welcome email
  welcomeEmailSubject: varchar("welcomeEmailSubject", { length: 255 }),
  welcomeEmailContent: text("welcomeEmailContent"),
  sendWelcomeEmail: boolean("sendWelcomeEmail").default(true).notNull(),
  // Status
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("userId_idx").on(table.userId),
}));

export type Newsletter = typeof newsletters.$inferSelect;
export type InsertNewsletter = typeof newsletters.$inferInsert;

/**
 * Subscribers table - global subscriber list
 */
export const subscribers = mysqlTable("subscribers", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  status: mysqlEnum("status", ["active", "unsubscribed", "bounced"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  emailIdx: index("email_idx").on(table.email),
}));

export type Subscriber = typeof subscribers.$inferSelect;
export type InsertSubscriber = typeof subscribers.$inferInsert;

/**
 * Newsletter subscribers junction table - many-to-many relationship
 */
export const newsletterSubscribers = mysqlTable("newsletter_subscribers", {
  id: int("id").autoincrement().primaryKey(),
  newsletterId: int("newsletterId").notNull(),
  subscriberId: int("subscriberId").notNull(),
  status: mysqlEnum("status", ["subscribed", "unsubscribed"]).default("subscribed").notNull(),
  subscribedAt: timestamp("subscribedAt").defaultNow().notNull(),
  unsubscribedAt: timestamp("unsubscribedAt"),
}, (table) => ({
  newsletterIdIdx: index("newsletterId_idx").on(table.newsletterId),
  subscriberIdIdx: index("subscriberId_idx").on(table.subscriberId),
  uniqueSubscription: index("unique_subscription_idx").on(table.newsletterId, table.subscriberId),
}));

export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;
export type InsertNewsletterSubscriber = typeof newsletterSubscribers.$inferInsert;

/**
 * Newsletter editions table - individual email campaigns
 */
export const newsletterEditions = mysqlTable("newsletter_editions", {
  id: int("id").autoincrement().primaryKey(),
  newsletterId: int("newsletterId").notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  previewText: varchar("previewText", { length: 500 }),
  // Intro text that appears before articles
  introText: text("introText"),
  // Legacy content fields (kept for backward compatibility)
  contentMarkdown: text("contentMarkdown"),
  contentHtml: text("contentHtml"),
  // Template style
  templateStyle: mysqlEnum("templateStyle", ["morning-brew", "minimalist", "bold", "magazine"]).default("morning-brew").notNull(),
  // Template-specific settings (JSON)
  templateSettings: text("templateSettings"),
  // Publishing
  status: mysqlEnum("status", ["draft", "scheduled", "sending", "sent", "failed"]).default("draft").notNull(),
  scheduledFor: timestamp("scheduledFor"),
  sentAt: timestamp("sentAt"),
  // Statistics
  totalRecipients: int("totalRecipients").default(0).notNull(),
  totalOpens: int("totalOpens").default(0).notNull(),
  uniqueOpens: int("uniqueOpens").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  newsletterIdIdx: index("newsletterId_idx").on(table.newsletterId),
  statusIdx: index("status_idx").on(table.status),
  scheduledForIdx: index("scheduledFor_idx").on(table.scheduledFor),
}));

export type NewsletterEdition = typeof newsletterEditions.$inferSelect;
export type InsertNewsletterEdition = typeof newsletterEditions.$inferInsert;

/**
 * Email tracking table - tracks individual email opens
 */
export const emailTracking = mysqlTable("email_tracking", {
  id: int("id").autoincrement().primaryKey(),
  editionId: int("editionId").notNull(),
  subscriberId: int("subscriberId").notNull(),
  // Tracking data
  openedAt: timestamp("openedAt"),
  openCount: int("openCount").default(0).notNull(),
  lastOpenedAt: timestamp("lastOpenedAt"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  // Unique tracking token
  trackingToken: varchar("trackingToken", { length: 64 }).notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  editionIdIdx: index("editionId_idx").on(table.editionId),
  subscriberIdIdx: index("subscriberId_idx").on(table.subscriberId),
  trackingTokenIdx: index("trackingToken_idx").on(table.trackingToken),
}));

export type EmailTracking = typeof emailTracking.$inferSelect;
export type InsertEmailTracking = typeof emailTracking.$inferInsert;

/**
 * Authors table - writing personas with distinct styles
 */
export const authors = mysqlTable("authors", {
  id: int("id").autoincrement().primaryKey(),
  newsletterId: int("newsletterId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  bio: text("bio"),
  writingStyle: varchar("writingStyle", { length: 100 }).notNull(),
  tone: varchar("tone", { length: 100 }).notNull(),
  personality: text("personality"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  newsletterIdIdx: index("newsletterId_idx").on(table.newsletterId),
}));

export type Author = typeof authors.$inferSelect;
export type InsertAuthor = typeof authors.$inferInsert;

/**
 * Articles table - standalone article library (newsletter-scoped)
 * Articles can be reused across multiple editions
 */
export const articles = mysqlTable("articles", {
  id: int("id").autoincrement().primaryKey(),
  newsletterId: int("newsletterId").notNull(),
  authorId: int("authorId"),
  // Article metadata
  category: varchar("category", { length: 100 }),
  title: varchar("title", { length: 500 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull(),
  // Content
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  imageUrl: text("imageUrl"),
  imageCaption: varchar("imageCaption", { length: 255 }),
  // Status
  status: mysqlEnum("status", ["draft", "published", "archived"]).default("draft").notNull(),
  // Publishing
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  newsletterIdIdx: index("newsletterId_idx").on(table.newsletterId),
  slugIdx: index("slug_idx").on(table.slug),
  statusIdx: index("status_idx").on(table.status),
}));

/**
 * Edition articles junction table - many-to-many relationship
 * Allows reusing articles across multiple editions
 */
export const editionArticles = mysqlTable("edition_articles", {
  id: int("id").autoincrement().primaryKey(),
  editionId: int("editionId").notNull(),
  articleId: int("articleId").notNull(),
  displayOrder: int("displayOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  editionIdIdx: index("editionId_idx").on(table.editionId),
  articleIdIdx: index("articleId_idx").on(table.articleId),
  uniqueEditionArticle: index("unique_edition_article_idx").on(table.editionId, table.articleId),
}));

export type EditionArticle = typeof editionArticles.$inferSelect;
export type InsertEditionArticle = typeof editionArticles.$inferInsert;

export type Article = typeof articles.$inferSelect;
export type InsertArticle = typeof articles.$inferInsert;

/**
 * Newsletter sections table - modular content blocks for editions
 * Replaces/enhances articles with more flexible section types
 */
export const newsletterSections = mysqlTable("newsletter_sections", {
  id: int("id").autoincrement().primaryKey(),
  editionId: int("editionId").notNull(),
  // Section type determines layout and behavior
  sectionType: mysqlEnum("sectionType", [
    "header",      // Title + subtitle
    "text",        // Rich text content
    "article",     // Article card with image
    "quote",       // Blockquote
    "image",       // Full-width image
    "cta",         // Call-to-action button
    "divider",     // Visual separator
    "list",        // Bullet/numbered list
    "code",        // Code snippet
    "video",       // Embedded video
  ]).notNull(),
  // Content fields (flexible based on section type)
  title: varchar("title", { length: 500 }),
  subtitle: text("subtitle"),
  content: text("content"),
  imageUrl: text("imageUrl"),
  imageCaption: varchar("imageCaption", { length: 255 }),
  buttonText: varchar("buttonText", { length: 100 }),
  buttonUrl: text("buttonUrl"),
  // AI generation metadata
  aiGenerated: boolean("aiGenerated").default(false).notNull(),
  aiPrompt: text("aiPrompt"),
  // Ordering and display
  displayOrder: int("displayOrder").default(0).notNull(),
  isVisible: boolean("isVisible").default(true).notNull(),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  editionIdIdx: index("editionId_idx").on(table.editionId),
  displayOrderIdx: index("displayOrder_idx").on(table.editionId, table.displayOrder),
}));

export type NewsletterSection = typeof newsletterSections.$inferSelect;
export type InsertNewsletterSection = typeof newsletterSections.$inferInsert;

/**
 * Scheduled jobs table - tracks automated email sends
 */
export const scheduledJobs = mysqlTable("scheduled_jobs", {
  id: int("id").autoincrement().primaryKey(),
  editionId: int("editionId").notNull(),
  scheduledFor: timestamp("scheduledFor").notNull(),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  attempts: int("attempts").default(0).notNull(),
  lastAttemptAt: timestamp("lastAttemptAt"),
  completedAt: timestamp("completedAt"),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  editionIdIdx: index("editionId_idx").on(table.editionId),
  statusIdx: index("status_idx").on(table.status),
  scheduledForIdx: index("scheduledFor_idx").on(table.scheduledFor),
}));

export type ScheduledJob = typeof scheduledJobs.$inferSelect;
export type InsertScheduledJob = typeof scheduledJobs.$inferInsert;
