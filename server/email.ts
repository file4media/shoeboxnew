import { Resend } from "resend";
import { nanoid } from "nanoid";
import * as db from "./db";
import { getSectionsByEdition } from "./sectionsDb";
import { generateEmailHtml } from "./emailTemplate";

let resendClient: Resend | null = null;

export function getResendClient(): Resend {
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
  const edition = await db.getEditionById(editionId);
  if (!edition) {
    throw new Error("Newsletter edition not found");
  }

  const newsletter = await db.getNewsletterById(edition.newsletterId);
  if (!newsletter) {
    throw new Error("Newsletter not found");
  }

  const subscribers = await db.getNewsletterSubscribers(edition.newsletterId);
  const activeSubscribers = subscribers.filter(
    (sub) => sub.subscriber.status === "active" && sub.subscription.status === "subscribed"
  );

  if (activeSubscribers.length === 0) {
    throw new Error("No active subscribers found");
  }

  // Update edition status to sending
  await db.updateEdition(editionId, {
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
          editionId: edition.id,
          subscriberId: subscriber.subscriber.id,
          trackingToken,
        });

        // Generate tracking pixel URL
        const trackingPixelUrl = generateTrackingPixelUrl(trackingToken, baseUrl);

        // Get articles for this edition
        const articles = await db.getArticlesByEditionId(edition.id);
        
        // Get sections for this edition
        const sections = await getSectionsByEdition(edition.id);

        // Generate HTML email with card-based template
        const htmlWithTracking = generateEmailHtml(
          newsletter,
          edition,
          articles,
          sections,
          trackingPixelUrl,
          baseUrl,
          subscriber.subscriber.id
        );

        // Send email via Resend
        await resend.emails.send({
          from: `${newsletter.fromName} <${newsletter.fromEmail}>`,
          to: subscriber.subscriber.email,
          subject: edition.subject,
          html: htmlWithTracking,
          replyTo: newsletter.replyToEmail || newsletter.fromEmail,
        });

        results.sent++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Failed to send to ${subscriber.subscriber.email}: ${error}`);
        console.error(`Failed to send email to ${subscriber.subscriber.email}:`, error);
      }
    }

    // Update edition status to sent
    await db.updateEdition(editionId, {
      status: "sent",
      sentAt: new Date(),
    });

    return results;
  } catch (error) {
    // Update edition status to failed
    await db.updateEdition(editionId, {
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
  const edition = await db.getEditionById(editionId);
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
  
  // Get articles for this edition
  const articles = await db.getArticlesByEditionId(edition.id);
  
  // Get sections for this edition
  const sections = await getSectionsByEdition(edition.id);

  // Generate HTML email with card-based template (use dummy subscriber ID for test)
  const htmlWithTracking = generateEmailHtml(
    newsletter,
    edition,
    articles,
    sections,
    trackingPixelUrl,
    baseUrl,
    0 // dummy subscriber ID for test emails
  );

  await resend.emails.send({
    from: `${newsletter.fromName} <${newsletter.fromEmail}>`,
    to: testEmail,
    subject: `[TEST] ${edition.subject}`,
    html: htmlWithTracking,
    replyTo: newsletter.replyToEmail || newsletter.fromEmail,
  });

  return { success: true };
}
