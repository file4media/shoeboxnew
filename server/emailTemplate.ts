import type { Newsletter, NewsletterEdition, Article } from "../drizzle/schema";

/**
 * Truncate content to approximately N words
 */
export function truncateToWords(content: string, maxWords: number): string {
  const words = content.trim().split(/\s+/);
  if (words.length <= maxWords) {
    return content;
  }
  return words.slice(0, maxWords).join(" ") + "...";
}

/**
 * Generate unsubscribe URL
 */
export function generateUnsubscribeUrl(baseUrl: string, subscriberId: number, newsletterId: number): string {
  return `${baseUrl}/unsubscribe?sid=${subscriberId}&nid=${newsletterId}`;
}

/**
 * Generate article permalink URL
 */
export function generateArticleUrl(baseUrl: string, editionId: number, articleSlug: string): string {
  return `${baseUrl}/edition/${editionId}/article/${articleSlug}`;
}

/**
 * Generate Morning Brew-style HTML email template
 */
export function generateEmailHtml(
  newsletter: Newsletter,
  edition: NewsletterEdition,
  articles: Article[],
  trackingPixelUrl: string,
  baseUrl: string,
  subscriberId: number
): string {
  const primaryColor = newsletter.primaryColor || "#3b82f6";
  const logoUrl = newsletter.logoUrl || "";
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const unsubscribeUrl = generateUnsubscribeUrl(baseUrl, subscriberId, newsletter.id);

  // Generate article cards HTML
  const articleCardsHtml = articles
    .map((article) => {
      const articleUrl = generateArticleUrl(baseUrl, edition.id, article.slug);
      const truncatedContent = truncateToWords(article.content, 150); // ~600 words max

      return `
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px; background: #ffffff; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="padding: 0;">
              ${
                article.category
                  ? `<div style="padding: 16px 24px 0; font-size: 12px; font-weight: 600; color: ${primaryColor}; text-transform: uppercase; letter-spacing: 0.5px;">${article.category}</div>`
                  : ""
              }
              <div style="padding: ${article.category ? "8px" : "16px"} 24px 16px;">
                <h2 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; line-height: 1.3; color: #111827;">
                  <a href="${articleUrl}" style="color: #111827; text-decoration: none;">${article.title}</a>
                </h2>
                ${
                  article.imageUrl
                    ? `
                <div style="margin-bottom: 16px;">
                  <img src="${article.imageUrl}" alt="${article.title}" style="width: 100%; height: auto; border-radius: 8px; display: block;" />
                  ${article.imageCaption ? `<p style="margin: 8px 0 0; font-size: 13px; color: #6b7280; font-style: italic;">${article.imageCaption}</p>` : ""}
                </div>
                `
                    : ""
                }
                <div style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 16px;">
                  ${truncatedContent}
                </div>
                <a href="${articleUrl}" style="display: inline-block; padding: 10px 20px; background: ${primaryColor}; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">Read Full Article →</a>
              </div>
            </td>
          </tr>
        </table>
      `;
    })
    .join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${edition.subject}</title>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
    a { color: ${primaryColor}; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">
          
          <!-- Header Date and Links -->
          <tr>
            <td style="padding: 16px 0; text-align: center;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align: left; font-size: 13px; color: #6b7280;">${currentDate}</td>
                  <td style="text-align: right; font-size: 13px;">
                    <a href="${baseUrl}" style="color: #6b7280; text-decoration: none; margin-left: 16px;">View Online</a>
                    <a href="${baseUrl}/subscribe?nid=${newsletter.id}" style="color: #6b7280; text-decoration: none; margin-left: 16px;">Sign Up</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Logo Banner -->
          <tr>
            <td style="background: ${primaryColor}; padding: 48px 24px; text-align: center; border-radius: 12px;">
              ${
                logoUrl
                  ? `<img src="${logoUrl}" alt="${newsletter.name}" style="max-width: 300px; height: auto; display: block; margin: 0 auto;" />`
                  : `<h1 style="margin: 0; color: #ffffff; font-size: 48px; font-weight: 700; letter-spacing: -1px;">${newsletter.name}</h1>`
              }
            </td>
          </tr>

          <!-- Intro Text -->
          ${
            edition.introText
              ? `
          <tr>
            <td style="padding: 32px 24px; background: #ffffff; border-radius: 8px; margin-top: 16px;">
              <div style="font-size: 16px; line-height: 1.6; color: #374151;">
                ${edition.introText}
              </div>
            </td>
          </tr>
          `
              : ""
          }

          <!-- Spacer -->
          <tr><td style="height: 24px;"></td></tr>

          <!-- Article Cards -->
          <tr>
            <td>
              ${articleCardsHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 32px 24px; background: #1f2937; border-radius: 8px; text-align: center;">
              <!-- Social Links -->
              <div style="margin-bottom: 24px;">
                <a href="https://twitter.com/${newsletter.name.toLowerCase().replace(/\s+/g, "")}" style="display: inline-block; margin: 0 8px;">
                  <img src="https://cdn-icons-png.flaticon.com/512/733/733579.png" alt="Twitter" style="width: 32px; height: 32px;" />
                </a>
                <a href="https://facebook.com/${newsletter.name.toLowerCase().replace(/\s+/g, "")}" style="display: inline-block; margin: 0 8px;">
                  <img src="https://cdn-icons-png.flaticon.com/512/733/733547.png" alt="Facebook" style="width: 32px; height: 32px;" />
                </a>
                <a href="https://linkedin.com/company/${newsletter.name.toLowerCase().replace(/\s+/g, "")}" style="display: inline-block; margin: 0 8px;">
                  <img src="https://cdn-icons-png.flaticon.com/512/733/733561.png" alt="LinkedIn" style="width: 32px; height: 32px;" />
                </a>
              </div>

              <!-- Newsletter Info -->
              <div style="font-size: 14px; color: #9ca3af; line-height: 1.6; margin-bottom: 16px;">
                <strong style="color: #ffffff;">${newsletter.name}</strong><br/>
                ${newsletter.description || ""}
              </div>

              <!-- Unsubscribe -->
              <div style="font-size: 12px; color: #6b7280;">
                <a href="${unsubscribeUrl}" style="color: #9ca3af; text-decoration: underline;">Unsubscribe</a> | 
                <a href="${baseUrl}" style="color: #9ca3af; text-decoration: none;">Update preferences</a>
              </div>

              <!-- Copyright -->
              <div style="margin-top: 16px; font-size: 12px; color: #6b7280;">
                © ${new Date().getFullYear()} ${newsletter.name}. All rights reserved.
              </div>
            </td>
          </tr>

          <!-- Spacer -->
          <tr><td style="height: 24px;"></td></tr>

        </table>
      </td>
    </tr>
  </table>

  <!-- Tracking Pixel -->
  <img src="${trackingPixelUrl}" width="1" height="1" alt="" style="display:none;" />
</body>
</html>
  `.trim();
}
