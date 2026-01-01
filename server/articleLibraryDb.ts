import { eq, and, desc } from "drizzle-orm";
import { getDb } from "./db";
import { articles, editionArticles, type Article, type InsertArticle, type EditionArticle, type InsertEditionArticle } from "../drizzle/schema";

// ============================================
// Article Library Functions (newsletter-scoped)
// ============================================

/**
 * Get all articles for a newsletter
 */
export async function getArticlesByNewsletterId(newsletterId: number): Promise<Article[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(articles)
    .where(eq(articles.newsletterId, newsletterId))
    .orderBy(desc(articles.createdAt));
}

/**
 * Get a single article by ID
 */
export async function getArticleById(id: number): Promise<Article | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(articles).where(eq(articles.id, id)).limit(1);
  return result[0] || null;
}

/**
 * Create a new article
 */
export async function createArticle(article: InsertArticle): Promise<Article> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(articles).values(article);
  const insertedId = Number(result[0].insertId);
  
  const created = await getArticleById(insertedId);
  if (!created) {
    throw new Error("Failed to create article");
  }
  
  return created;
}

/**
 * Update an article
 */
export async function updateArticle(id: number, updates: Partial<InsertArticle>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(articles).set(updates).where(eq(articles.id, id));
}

/**
 * Delete an article
 */
export async function deleteArticle(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // First delete all edition_articles references
  await db.delete(editionArticles).where(eq(editionArticles.articleId, id));
  
  // Then delete the article
  await db.delete(articles).where(eq(articles.id, id));
}

// ============================================
// Edition-Article Junction Functions
// ============================================

/**
 * Get all articles for an edition (via junction table)
 */
export async function getArticlesForEdition(editionId: number): Promise<(Article & { displayOrder: number })[]> {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select({
      article: articles,
      displayOrder: editionArticles.displayOrder,
    })
    .from(editionArticles)
    .innerJoin(articles, eq(editionArticles.articleId, articles.id))
    .where(eq(editionArticles.editionId, editionId))
    .orderBy(editionArticles.displayOrder);
  
  return result.map(r => ({ ...r.article, displayOrder: r.displayOrder }));
}

/**
 * Add an article to an edition
 */
export async function addArticleToEdition(editionId: number, articleId: number, displayOrder?: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // If no display order specified, add to end
  if (displayOrder === undefined) {
    const existing = await db
      .select()
      .from(editionArticles)
      .where(eq(editionArticles.editionId, editionId));
    displayOrder = existing.length;
  }
  
  await db.insert(editionArticles).values({
    editionId,
    articleId,
    displayOrder,
  });
}

/**
 * Remove an article from an edition
 */
export async function removeArticleFromEdition(editionId: number, articleId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .delete(editionArticles)
    .where(
      and(
        eq(editionArticles.editionId, editionId),
        eq(editionArticles.articleId, articleId)
      )
    );
}

/**
 * Reorder articles in an edition
 */
export async function reorderEditionArticles(editionId: number, articleIds: number[]): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Update display order for each article
  for (let i = 0; i < articleIds.length; i++) {
    await db
      .update(editionArticles)
      .set({ displayOrder: i })
      .where(
        and(
          eq(editionArticles.editionId, editionId),
          eq(editionArticles.articleId, articleIds[i])
        )
      );
  }
}
