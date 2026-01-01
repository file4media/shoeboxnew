import { eq, and, desc } from "drizzle-orm";
import { getDb } from "./db";
import { authors, type Author, type InsertAuthor } from "../drizzle/schema";

/**
 * Get all authors for a newsletter
 */
export async function getAuthorsByNewsletter(newsletterId: number): Promise<Author[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(authors)
    .where(eq(authors.newsletterId, newsletterId))
    .orderBy(desc(authors.createdAt));
}

/**
 * Get a single author by ID
 */
export async function getAuthorById(id: number): Promise<Author | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db
    .select()
    .from(authors)
    .where(eq(authors.id, id))
    .limit(1);
  
  return result[0] || null;
}

/**
 * Create a new author
 */
export async function createAuthor(data: InsertAuthor): Promise<Author> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db.insert(authors).values(data);
  const authorId = result.insertId;
  
  const author = await getAuthorById(authorId);
  if (!author) throw new Error("Failed to create author");
  
  return author;
}

/**
 * Update an author
 */
export async function updateAuthor(
  id: number,
  data: Partial<Omit<InsertAuthor, "newsletterId">>
): Promise<Author | null> {
  const db = await getDb();
  if (!db) return null;
  
  await db
    .update(authors)
    .set(data)
    .where(eq(authors.id, id));
  
  return await getAuthorById(id);
}

/**
 * Delete an author
 */
export async function deleteAuthor(id: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  await db.delete(authors).where(eq(authors.id, id));
  return true;
}
