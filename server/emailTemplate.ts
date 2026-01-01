import { Newsletter, NewsletterEdition, Article, NewsletterSection } from "../drizzle/schema";
import { renderSections } from "./sectionRenderer";

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
export function generateMorningBrewTemplate(
  newsletter: Newsletter,
  edition: NewsletterEdition,
  articles: Article[],
  sections: NewsletterSection[],
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

  // Render sections if available, otherwise fall back to articles
  const contentHtml = sections.length > 0 
    ? renderSections(sections, primaryColor)
    : articles
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

          <!-- Content (Sections or Articles) -->
          <tr>
            <td>
              ${contentHtml}
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

/**
 * Generate Minimalist HTML email template
 */
export function generateMinimalistTemplate(
  newsletter: Newsletter,
  edition: NewsletterEdition,
  articles: Article[],
  sections: NewsletterSection[],
  trackingPixelUrl: string,
  baseUrl: string,
  subscriberId: number
): string {
  const unsubscribeUrl = generateUnsubscribeUrl(baseUrl, subscriberId, newsletter.id);

  const articleCardsHtml = articles
    .map((article) => {
      const truncatedContent = truncateToWords(article.content, 100);
      const articleUrl = generateArticleUrl(baseUrl, edition.id, article.slug);
      
      return `
        <div style="margin-bottom: 48px; padding-bottom: 48px; border-bottom: 1px solid #e5e7eb;">
          ${article.category ? `<p style="margin: 0 0 8px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #6b7280;">${article.category}</p>` : ""}
          <h2 style="margin: 0 0 16px; font-size: 24px; font-weight: 600; line-height: 1.3; color: #111827;">
            ${article.title}
          </h2>
          ${article.imageUrl ? `<img src="${article.imageUrl}" alt="${article.title}" style="width: 100%; max-width: 600px; height: auto; margin-bottom: 20px; border-radius: 4px;">` : ""}
          <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.7; color: #374151;">
            ${truncatedContent}
          </p>
          <a href="${articleUrl}" style="display: inline-block; font-size: 14px; font-weight: 500; color: #111827; text-decoration: none; border-bottom: 1px solid #111827;">
            Read more →
          </a>
        </div>
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
</head>
<body style="margin: 0; padding: 0; font-family: 'Georgia', serif; background-color: #ffffff;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 60px 20px 40px;">
        <table role="presentation" style="max-width: 600px; width: 100%;">
          
          <!-- Header -->
          <tr>
            <td style="padding-bottom: 40px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 400; letter-spacing: 2px; color: #111827;">
                ${newsletter.name}
              </h1>
            </td>
          </tr>

          <!-- Intro Text -->
          ${edition.introText ? `
          <tr>
            <td style="padding-bottom: 48px;">
              <p style="margin: 0; font-size: 18px; line-height: 1.7; color: #374151; font-style: italic;">
                ${edition.introText}
              </p>
            </td>
          </tr>
          ` : ""}

          <!-- Articles -->
          <tr>
            <td>
              ${articleCardsHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top: 48px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px; font-size: 12px; color: #9ca3af;">
                <a href="${unsubscribeUrl}" style="color: #6b7280; text-decoration: none;">Unsubscribe</a>
              </p>
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                © ${new Date().getFullYear()} ${newsletter.name}
              </p>
            </td>
          </tr>

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

/**
 * Generate Bold HTML email template
 */
export function generateBoldTemplate(
  newsletter: Newsletter,
  edition: NewsletterEdition,
  articles: Article[],
  sections: NewsletterSection[],
  trackingPixelUrl: string,
  baseUrl: string,
  subscriberId: number
): string {
  const primaryColor = newsletter.primaryColor || "#ff6b35";
  const unsubscribeUrl = generateUnsubscribeUrl(baseUrl, subscriberId, newsletter.id);

  const articleCardsHtml = articles
    .map((article) => {
      const truncatedContent = truncateToWords(article.content, 100);
      const articleUrl = generateArticleUrl(baseUrl, edition.id, article.slug);
      
      return `
        <div style="margin-bottom: 32px; background: linear-gradient(135deg, #f3f4f6 0%, #ffffff 100%); border-radius: 16px; overflow: hidden; border: 3px solid ${primaryColor};">
          ${article.imageUrl ? `<img src="${article.imageUrl}" alt="${article.title}" style="width: 100%; height: 250px; object-fit: cover;">` : ""}
          <div style="padding: 32px;">
            ${article.category ? `<span style="display: inline-block; padding: 6px 16px; background-color: ${primaryColor}; color: #ffffff; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; border-radius: 20px; margin-bottom: 16px;">${article.category}</span>` : ""}
            <h2 style="margin: 0 0 16px; font-size: 32px; font-weight: 900; line-height: 1.2; color: #111827;">
              ${article.title}
            </h2>
            <p style="margin: 0 0 24px; font-size: 18px; line-height: 1.6; color: #374151;">
              ${truncatedContent}
            </p>
            <a href="${articleUrl}" style="display: inline-block; padding: 14px 32px; background-color: ${primaryColor}; color: #ffffff; font-size: 16px; font-weight: 700; text-decoration: none; border-radius: 8px; text-transform: uppercase; letter-spacing: 1px;">
              Read Full Story
            </a>
          </div>
        </div>
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
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 700px; width: 100%; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 48px 40px; text-align: center; background: linear-gradient(135deg, ${primaryColor} 0%, #ff8c42 100%);">
              <h1 style="margin: 0; font-size: 48px; font-weight: 900; color: #ffffff; text-transform: uppercase; letter-spacing: 2px;">
                ${newsletter.name}
              </h1>
            </td>
          </tr>

          <!-- Intro Text -->
          ${edition.introText ? `
          <tr>
            <td style="padding: 40px; background-color: #fef3c7;">
              <p style="margin: 0; font-size: 20px; line-height: 1.6; color: #92400e; font-weight: 600; text-align: center;">
                ${edition.introText}
              </p>
            </td>
          </tr>
          ` : ""}

          <!-- Articles -->
          <tr>
            <td style="padding: 40px;">
              ${articleCardsHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 32px 40px; background-color: #111827; text-align: center;">
              <p style="margin: 0 0 12px; font-size: 14px; color: #9ca3af;">
                <a href="${unsubscribeUrl}" style="color: ${primaryColor}; text-decoration: none; font-weight: 600;">Unsubscribe</a>
              </p>
              <p style="margin: 0; font-size: 12px; color: #6b7280;">
                © ${new Date().getFullYear()} ${newsletter.name}. All rights reserved.
              </p>
            </td>
          </tr>

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

/**
 * Generate Magazine HTML email template
 */
export function generateMagazineTemplate(
  newsletter: Newsletter,
  edition: NewsletterEdition,
  articles: Article[],
  sections: NewsletterSection[],
  trackingPixelUrl: string,
  baseUrl: string,
  subscriberId: number
): string {
  const primaryColor = newsletter.primaryColor || "#dc2626";
  const unsubscribeUrl = generateUnsubscribeUrl(baseUrl, subscriberId, newsletter.id);

  const articleCardsHtml = articles
    .map((article, index) => {
      const truncatedContent = truncateToWords(article.content, 80);
      const articleUrl = generateArticleUrl(baseUrl, edition.id, article.slug);
      
      // First article gets featured treatment
      if (index === 0) {
        return `
          <div style="margin-bottom: 40px; border-bottom: 4px solid ${primaryColor}; padding-bottom: 40px;">
            ${article.imageUrl ? `<img src="${article.imageUrl}" alt="${article.title}" style="width: 100%; height: 400px; object-fit: cover; margin-bottom: 24px;">` : ""}
            ${article.category ? `<p style="margin: 0 0 12px; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: ${primaryColor};">${article.category}</p>` : ""}
            <h2 style="margin: 0 0 20px; font-size: 36px; font-weight: 700; line-height: 1.2; color: #111827;">
              ${article.title}
            </h2>
            <p style="margin: 0 0 20px; font-size: 18px; line-height: 1.7; color: #374151;">
              ${truncatedContent}
            </p>
            <a href="${articleUrl}" style="display: inline-block; padding: 12px 28px; background-color: ${primaryColor}; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; text-transform: uppercase; letter-spacing: 1px;">
              Continue Reading
            </a>
          </div>
        `;
      }
      
      // Other articles in two-column layout
      return `
        <div style="margin-bottom: 32px;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              ${article.imageUrl ? `
              <td style="width: 180px; vertical-align: top; padding-right: 20px;">
                <img src="${article.imageUrl}" alt="${article.title}" style="width: 180px; height: 120px; object-fit: cover;">
              </td>
              ` : ""}
              <td style="vertical-align: top;">
                ${article.category ? `<p style="margin: 0 0 8px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: ${primaryColor};">${article.category}</p>` : ""}
                <h3 style="margin: 0 0 12px; font-size: 20px; font-weight: 700; line-height: 1.3; color: #111827;">
                  ${article.title}
                </h3>
                <p style="margin: 0 0 12px; font-size: 15px; line-height: 1.6; color: #6b7280;">
                  ${truncatedContent}
                </p>
                <a href="${articleUrl}" style="font-size: 13px; font-weight: 600; color: ${primaryColor}; text-decoration: none; text-transform: uppercase; letter-spacing: 0.5px;">
                  Read More →
                </a>
              </td>
            </tr>
          </table>
        </div>
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
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 0;">
        <table role="presentation" style="max-width: 700px; width: 100%; background-color: #ffffff;">
          
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 32px; border-bottom: 4px solid ${primaryColor};">
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td style="vertical-align: middle;">
                    <h1 style="margin: 0; font-size: 32px; font-weight: 900; color: #111827; font-family: 'Georgia', serif;">
                      ${newsletter.name}
                    </h1>
                    <p style="margin: 8px 0 0; font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px;">
                      ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Intro Text -->
          ${edition.introText ? `
          <tr>
            <td style="padding: 32px 40px; background-color: #fef2f2; border-left: 4px solid ${primaryColor};">
              <p style="margin: 0; font-size: 16px; line-height: 1.7; color: #374151; font-style: italic;">
                ${edition.introText}
              </p>
            </td>
          </tr>
          ` : ""}

          <!-- Articles -->
          <tr>
            <td style="padding: 40px;">
              ${articleCardsHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 32px 40px; background-color: #111827; text-align: center;">
              <p style="margin: 0 0 8px; font-size: 12px; color: #9ca3af;">
                <a href="${unsubscribeUrl}" style="color: #d1d5db; text-decoration: none;">Unsubscribe</a>
              </p>
              <p style="margin: 0; font-size: 11px; color: #6b7280;">
                © ${new Date().getFullYear()} ${newsletter.name}. All rights reserved.
              </p>
            </td>
          </tr>

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

/**
 * Main template generator that selects the appropriate template based on style
 */
export function generateEmailHtml(
  newsletter: Newsletter,
  edition: NewsletterEdition,
  articles: Article[],
  sections: NewsletterSection[],
  trackingPixelUrl: string,
  baseUrl: string,
  subscriberId: number
): string {
  const templateStyle = edition.templateStyle || "morning-brew";

  switch (templateStyle) {
    case "minimalist":
      return generateMinimalistTemplate(newsletter, edition, articles, sections, trackingPixelUrl, baseUrl, subscriberId);
    case "bold":
      return generateBoldTemplate(newsletter, edition, articles, sections, trackingPixelUrl, baseUrl, subscriberId);
    case "magazine":
      return generateMagazineTemplate(newsletter, edition, articles, sections, trackingPixelUrl, baseUrl, subscriberId);
    case "morning-brew":
    default:
      return generateMorningBrewTemplate(newsletter, edition, articles, sections, trackingPixelUrl, baseUrl, subscriberId);
  }
}
