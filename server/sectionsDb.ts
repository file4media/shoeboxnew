import { getDb } from "./db";
import { newsletterSections, type InsertNewsletterSection, type NewsletterSection } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

/**
 * Get all sections for an edition, ordered by displayOrder
 */
export async function getSectionsByEdition(editionId: number): Promise<NewsletterSection[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .select()
    .from(newsletterSections)
    .where(eq(newsletterSections.editionId, editionId))
    .orderBy(newsletterSections.displayOrder);
}

/**
 * Get a single section by ID
 */
export async function getSectionById(sectionId: number): Promise<NewsletterSection | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const sections = await db
    .select()
    .from(newsletterSections)
    .where(eq(newsletterSections.id, sectionId))
    .limit(1);
  
  return sections[0];
}

/**
 * Create a new section
 */
export async function createSection(data: InsertNewsletterSection): Promise<NewsletterSection> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(newsletterSections).values(data);
  const insertedId = result[0].insertId;
  
  const section = await getSectionById(insertedId);
  if (!section) {
    throw new Error("Failed to create section");
  }
  
  return section;
}

/**
 * Update a section
 */
export async function updateSection(
  sectionId: number,
  data: Partial<InsertNewsletterSection>
): Promise<NewsletterSection> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(newsletterSections)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(newsletterSections.id, sectionId));
  
  const section = await getSectionById(sectionId);
  if (!section) {
    throw new Error("Section not found after update");
  }
  
  return section;
}

/**
 * Delete a section
 */
export async function deleteSection(sectionId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .delete(newsletterSections)
    .where(eq(newsletterSections.id, sectionId));
}

/**
 * Reorder sections - update displayOrder for multiple sections
 */
export async function reorderSections(
  updates: Array<{ id: number; displayOrder: number }>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Use a transaction to update all sections atomically
  for (const update of updates) {
    await db
      .update(newsletterSections)
      .set({ displayOrder: update.displayOrder, updatedAt: new Date() })
      .where(eq(newsletterSections.id, update.id));
  }
}

/**
 * Duplicate a section
 */
export async function duplicateSection(sectionId: number): Promise<NewsletterSection> {
  const original = await getSectionById(sectionId);
  if (!original) {
    throw new Error("Section not found");
  }
  
  // Get the max displayOrder for this edition
  const sections = await getSectionsByEdition(original.editionId);
  const maxOrder = Math.max(...sections.map(s => s.displayOrder), 0);
  
  // Create a copy
  const { id, createdAt, updatedAt, ...copyData } = original;
  const newSection = await createSection({
    ...copyData,
    displayOrder: maxOrder + 1,
    title: original.title ? `${original.title} (Copy)` : null,
  });
  
  return newSection;
}
