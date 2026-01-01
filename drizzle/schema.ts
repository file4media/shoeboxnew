import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, index } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  passwordHash: varchar("passwordHash", { length: 255 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
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
 * Articles table - individual article cards within an edition
 */
export const articles = mysqlTable("articles", {
  id: int("id").autoincrement().primaryKey(),
  editionId: int("editionId").notNull(),
  // Article metadata
  category: varchar("category", { length: 100 }),
  title: varchar("title", { length: 500 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull(),
  // Content
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  imageUrl: text("imageUrl"),
  imageCaption: varchar("imageCaption", { length: 255 }),
  // Ordering
  displayOrder: int("displayOrder").default(0).notNull(),
  // Publishing
  isPublished: boolean("isPublished").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  editionIdIdx: index("editionId_idx").on(table.editionId),
  slugIdx: index("slug_idx").on(table.slug),
  editionSlugIdx: index("edition_slug_idx").on(table.editionId, table.slug),
}));

export type Article = typeof articles.$inferSelect;
export type InsertArticle = typeof articles.$inferInsert;

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
