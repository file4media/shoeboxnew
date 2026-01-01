import * as db from "./db";
import { sendNewsletterEdition } from "./email";

/**
 * Process scheduled editions that are due to be sent
 */
export async function processScheduledEditions(baseUrl: string): Promise<void> {
  try {
    const database = await db.getDb();
    if (!database) {
      console.warn("[Scheduler] Database not available");
      return;
    }

    // Find editions that are scheduled and due to be sent
    const now = new Date();
    const scheduledEditions = await database
      .select()
      .from(await import("../drizzle/schema").then(m => m.newsletterEditions))
      .where(
        (await import("drizzle-orm").then(m => m.and))(
          (await import("drizzle-orm").then(m => m.eq))(
            (await import("../drizzle/schema").then(m => m.newsletterEditions.status)),
            "scheduled"
          ),
          (await import("drizzle-orm").then(m => m.lte))(
            (await import("../drizzle/schema").then(m => m.newsletterEditions.scheduledFor)),
            now
          )
        )
      );

    if (scheduledEditions.length === 0) {
      return;
    }

    console.log(`[Scheduler] Found ${scheduledEditions.length} editions to send`);

    // Process each edition
    for (const edition of scheduledEditions) {
      try {
        // Update status to sending
        await db.updateEdition(edition.id, { status: "sending" });

        // Send the newsletter
        const result = await sendNewsletterEdition(edition.id, baseUrl);

        if (result.sent > 0 && result.failed === 0) {
          console.log(`[Scheduler] Successfully sent edition ${edition.id} to ${result.sent} subscribers`);
        } else if (result.failed > 0) {
          console.error(`[Scheduler] Edition ${edition.id} had ${result.failed} failures:`, result.errors);
          // Don't mark as failed if some emails were sent successfully
          if (result.sent === 0) {
            await db.updateEdition(edition.id, { status: "failed" });
          }
        }
      } catch (error) {
        console.error(`[Scheduler] Error processing edition ${edition.id}:`, error);
        await db.updateEdition(edition.id, { status: "failed" });
      }
    }
  } catch (error) {
    console.error("[Scheduler] Error in processScheduledEditions:", error);
  }
}

/**
 * Start the scheduler that runs every minute
 */
export function startScheduler(baseUrl: string): NodeJS.Timeout {
  console.log("[Scheduler] Starting automated scheduler");
  
  // Run immediately on start
  processScheduledEditions(baseUrl).catch(error => {
    console.error("[Scheduler] Initial run error:", error);
  });

  // Then run every minute
  const interval = setInterval(() => {
    processScheduledEditions(baseUrl).catch(error => {
      console.error("[Scheduler] Scheduled run error:", error);
    });
  }, 60 * 1000); // Every 60 seconds

  return interval;
}

/**
 * Stop the scheduler
 */
export function stopScheduler(interval: NodeJS.Timeout): void {
  clearInterval(interval);
  console.log("[Scheduler] Stopped automated scheduler");
}
