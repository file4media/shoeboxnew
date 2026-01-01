import { Resend } from "resend";
import { nanoid } from "nanoid";
import * as db from "./db";

let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY environment variable is not set");
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

/**
 * Generate a tracking pixel URL for email open tracking
 */
export function generateTrackingPixelUrl(trackingToken: string, baseUrl: string): string {
  return `${baseUrl}/api/track/pixel/${trackingToken}`;
}

/**
 * Embed tracking pixel in HTML content
 */
export function embedTrackingPixel(htmlContent: string, trackingPixelUrl: string): string {
  const trackingPixel = `<img src="${trackingPixelUrl}" width="1" height="1" alt="" style="display:none;" />`;
  
  // Try to insert before closing body tag, otherwise append
  if (htmlContent.includes("</body>")) {
    return htmlContent.replace("</body>", `${trackingPixel}</body>`);
  }
  return htmlContent + trackingPixel;
}

/**
 * Send a newsletter edition to all subscribers
 */
export async function sendNewsletterEdition(editionId: number, baseUrl: string) {
  const edition = await db.getNewsletterEditionById(editionId);
  if (!edition) {
    throw new Error("Newsletter edition not found");
  }

  const newsletter = await db.getNewsletterById(edition.newsletterId);
  if (!newsletter) {
    throw new Error("Newsletter not found");
  }

  const subscribers = await db.getNewsletterSubscribers(edition.newsletterId);
  const activeSubscribers = subscribers.filter(
    (sub) => sub.status === "active" && sub.subscriptionStatus === "subscribed"
  );

  if (activeSubscribers.length === 0) {
    throw new Error("No active subscribers found");
  }

  // Update edition status to sending
  await db.updateNewsletterEdition(editionId, {
    status: "sending",
    totalRecipients: activeSubscribers.length,
  });

  const resend = getResendClient();
  const results = {
    sent: 0,
    failed: 0,
    errors: [] as string[],
  };

  try {
    // Send emails to all subscribers
    for (const subscriber of activeSubscribers) {
      try {
        // Generate unique tracking token
        const trackingToken = nanoid(32);
        
        // Create tracking record
        await db.createEmailTracking({
          editionId,
          subscriberId: subscriber.id,
          trackingToken,
          openCount: 0,
        });

        // Generate tracking pixel URL
        const trackingPixelUrl = generateTrackingPixelUrl(trackingToken, baseUrl);
        
        // Embed tracking pixel in HTML content
        const htmlWithTracking = edition.contentHtml
          ? embedTrackingPixel(edition.contentHtml, trackingPixelUrl)
          : `<html><body>${edition.contentMarkdown || ""}<br/><img src="${trackingPixelUrl}" width="1" height="1" alt="" style="display:none;" /></body></html>`;

        // Send email via Resend
        await resend.emails.send({
          from: `${newsletter.fromName} <${newsletter.fromEmail}>`,
          to: subscriber.email,
          subject: edition.subject,
          html: htmlWithTracking,
          replyTo: newsletter.replyToEmail || newsletter.fromEmail,
        });

        results.sent++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Failed to send to ${subscriber.email}: ${error}`);
        console.error(`Failed to send email to ${subscriber.email}:`, error);
      }
    }

    // Update edition status to sent
    await db.updateNewsletterEdition(editionId, {
      status: "sent",
      sentAt: new Date(),
    });

    return results;
  } catch (error) {
    // Update edition status to failed
    await db.updateNewsletterEdition(editionId, {
      status: "failed",
    });
    throw error;
  }
}

/**
 * Send a test email to a specific address
 */
export async function sendTestEmail(
  editionId: number,
  testEmail: string,
  baseUrl: string
) {
  const edition = await db.getNewsletterEditionById(editionId);
  if (!edition) {
    throw new Error("Newsletter edition not found");
  }

  const newsletter = await db.getNewsletterById(edition.newsletterId);
  if (!newsletter) {
    throw new Error("Newsletter not found");
  }

  const resend = getResendClient();

  // Generate tracking token for test email
  const trackingToken = nanoid(32);
  const trackingPixelUrl = generateTrackingPixelUrl(trackingToken, baseUrl);
  
  const htmlWithTracking = edition.contentHtml
    ? embedTrackingPixel(edition.contentHtml, trackingPixelUrl)
    : `<html><body>${edition.contentMarkdown || ""}<br/><img src="${trackingPixelUrl}" width="1" height="1" alt="" style="display:none;" /></body></html>`;

  await resend.emails.send({
    from: `${newsletter.fromName} <${newsletter.fromEmail}>`,
    to: testEmail,
    subject: `[TEST] ${edition.subject}`,
    html: htmlWithTracking,
    replyTo: newsletter.replyToEmail || newsletter.fromEmail,
  });

  return { success: true };
}
