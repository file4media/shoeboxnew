import { getResendClient } from "./email";
import type { Newsletter } from "../drizzle/schema";

/**
 * Generate HTML for welcome email
 */
export function generateWelcomeEmailHtml(
  newsletter: Newsletter,
  subscriberName?: string
): string {
  const greeting = subscriberName ? `Hi ${subscriberName}` : "Hello";
  const primaryColor = newsletter.primaryColor || "#3b82f6";
  
  const defaultContent = `
    <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 16px;">
      Thank you for subscribing to ${newsletter.name}! We're excited to have you as part of our community.
    </p>
    <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 16px;">
      ${newsletter.description || "You'll receive regular updates with our latest content, insights, and news."}
    </p>
    <p style="font-size: 16px; line-height: 1.6; color: #374151;">
      Stay tuned for great content!
    </p>
  `;

  const content = newsletter.welcomeEmailContent || defaultContent;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to ${newsletter.name}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              
              <!-- Header -->
              <tr>
                <td style="padding: 40px 40px 32px; text-align: center; background: linear-gradient(135deg, ${primaryColor} 0%, ${adjustColorBrightness(primaryColor, -20)} 100%); border-radius: 8px 8px 0 0;">
                  ${newsletter.logoUrl ? `
                    <img src="${newsletter.logoUrl}" alt="${newsletter.name}" style="max-width: 200px; height: auto; margin-bottom: 16px;">
                  ` : `
                    <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700;">
                      ${newsletter.name}
                    </h1>
                  `}
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 40px;">
                  <h2 style="margin: 0 0 24px; color: #111827; font-size: 24px; font-weight: 600;">
                    ${greeting}, welcome aboard! 🎉
                  </h2>
                  
                  ${content}
                  
                  <div style="margin-top: 32px; padding-top: 32px; border-top: 1px solid #e5e7eb;">
                    <p style="font-size: 14px; line-height: 1.5; color: #6b7280; margin: 0;">
                      You're receiving this because you subscribed to ${newsletter.name}. 
                      If you didn't subscribe or want to unsubscribe, 
                      <a href="{{unsubscribe_url}}" style="color: ${primaryColor}; text-decoration: underline;">click here</a>.
                    </p>
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; text-align: center;">
                  <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                    © ${new Date().getFullYear()} ${newsletter.name}. All rights reserved.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

/**
 * Adjust color brightness for gradient effect
 */
function adjustColorBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = ((num >> 8) & 0x00ff) + amt;
  const B = (num & 0x0000ff) + amt;
  return (
    "#" +
    (
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    )
      .toString(16)
      .slice(1)
  );
}

/**
 * Send welcome email to a new subscriber
 */
export async function sendWelcomeEmail(
  newsletter: Newsletter,
  subscriberEmail: string,
  subscriberName?: string,
  baseUrl?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!newsletter.sendWelcomeEmail) {
      return { success: true }; // Welcome emails disabled for this newsletter
    }

    const resend = getResendClient();
    const htmlContent = generateWelcomeEmailHtml(newsletter, subscriberName);
    
    // Replace unsubscribe URL placeholder
    const unsubscribeUrl = baseUrl 
      ? `${baseUrl}/unsubscribe?email=${encodeURIComponent(subscriberEmail)}&newsletter=${newsletter.id}`
      : "#";
    const finalHtml = htmlContent.replace("{{unsubscribe_url}}", unsubscribeUrl);

    const subject = newsletter.welcomeEmailSubject || `Welcome to ${newsletter.name}!`;

    await resend.emails.send({
      from: `${newsletter.fromName} <${newsletter.fromEmail}>`,
      to: subscriberEmail,
      subject,
      html: finalHtml,
      replyTo: newsletter.replyToEmail || newsletter.fromEmail,
    });

    return { success: true };
  } catch (error) {
    console.error("[WelcomeEmail] Failed to send:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
