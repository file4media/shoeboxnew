import { NewsletterSection } from "../drizzle/schema";
import { marked } from "marked";

/**
 * Render a section to HTML for email
 */
export function renderSection(section: NewsletterSection, primaryColor: string): string {
  if (!section.isVisible) {
    return "";
  }

  const { sectionType } = section;

  switch (sectionType) {
    case "header":
      return renderHeaderSection(section, primaryColor);
    case "text":
      return renderTextSection(section);
    case "article":
      return renderArticleSection(section, primaryColor);
    case "quote":
      return renderQuoteSection(section, primaryColor);
    case "image":
      return renderImageSection(section);
    case "cta":
      return renderCTASection(section, primaryColor);
    case "divider":
      return renderDividerSection();
    case "list":
      return renderListSection(section);
    default:
      return "";
  }
}

/**
 * Render all sections for an edition
 */
export function renderSections(sections: NewsletterSection[], primaryColor: string): string {
  return sections
    .filter(s => s.isVisible)
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map(section => renderSection(section, primaryColor))
    .join("\n");
}

function renderHeaderSection(section: NewsletterSection, primaryColor: string): string {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
      <tr>
        <td style="text-align: center; padding: 32px 24px;">
          <h1 style="margin: 0 0 12px; font-size: 36px; font-weight: 800; line-height: 1.2; color: #111827;">
            ${section.title || ""}
          </h1>
          ${section.subtitle ? `
            <p style="margin: 0; font-size: 18px; line-height: 1.5; color: #6b7280;">
              ${section.subtitle}
            </p>
          ` : ""}
        </td>
      </tr>
    </table>
  `;
}

function renderTextSection(section: NewsletterSection): string {
  const contentHtml = section.content ? marked(section.content) : "";
  
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
      <tr>
        <td style="padding: 0 24px;">
          ${section.title ? `
            <h2 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; line-height: 1.3; color: #111827;">
              ${section.title}
            </h2>
          ` : ""}
          <div style="font-size: 16px; line-height: 1.6; color: #374151;">
            ${contentHtml}
          </div>
        </td>
      </tr>
    </table>
  `;
}

function renderArticleSection(section: NewsletterSection, primaryColor: string): string {
  const contentHtml = section.content ? marked(section.content) : "";
  
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px; background: #ffffff; border-radius: 8px; overflow: hidden;">
      <tr>
        <td style="padding: 24px;">
          ${section.title ? `
            <h2 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; line-height: 1.3; color: #111827;">
              ${section.title}
            </h2>
          ` : ""}
          ${section.imageUrl ? `
            <div style="margin-bottom: 16px;">
              <img src="${section.imageUrl}" alt="${section.title || ""}" style="width: 100%; height: auto; border-radius: 8px; display: block;" />
              ${section.imageCaption ? `
                <p style="margin: 8px 0 0; font-size: 13px; color: #6b7280; font-style: italic;">
                  ${section.imageCaption}
                </p>
              ` : ""}
            </div>
          ` : ""}
          <div style="font-size: 16px; line-height: 1.6; color: #374151;">
            ${contentHtml}
          </div>
        </td>
      </tr>
    </table>
  `;
}

function renderQuoteSection(section: NewsletterSection, primaryColor: string): string {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
      <tr>
        <td style="padding: 0 24px;">
          <div style="border-left: 4px solid ${primaryColor}; padding: 20px 24px; background: #f9fafb; border-radius: 0 8px 8px 0;">
            <p style="margin: 0; font-size: 18px; line-height: 1.6; color: #374151; font-style: italic;">
              ${section.content || ""}
            </p>
          </div>
        </td>
      </tr>
    </table>
  `;
}

function renderImageSection(section: NewsletterSection): string {
  if (!section.imageUrl) return "";
  
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
      <tr>
        <td style="padding: 0;">
          <img src="${section.imageUrl}" alt="${section.imageCaption || ""}" style="width: 100%; height: auto; display: block;" />
          ${section.imageCaption ? `
            <p style="margin: 12px 24px 0; font-size: 14px; color: #6b7280; text-align: center; font-style: italic;">
              ${section.imageCaption}
            </p>
          ` : ""}
        </td>
      </tr>
    </table>
  `;
}

function renderCTASection(section: NewsletterSection, primaryColor: string): string {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
      <tr>
        <td style="text-align: center; padding: 32px 24px; background: #f9fafb; border-radius: 8px;">
          ${section.content ? `
            <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.5; color: #374151;">
              ${section.content}
            </p>
          ` : ""}
          ${section.buttonText && section.buttonUrl ? `
            <a href="${section.buttonUrl}" style="display: inline-block; padding: 14px 32px; background: ${primaryColor}; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
              ${section.buttonText}
            </a>
          ` : ""}
        </td>
      </tr>
    </table>
  `;
}

function renderDividerSection(): string {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
      <tr>
        <td style="padding: 0 24px;">
          <div style="height: 1px; background: #e5e7eb;"></div>
        </td>
      </tr>
    </table>
  `;
}

function renderListSection(section: NewsletterSection): string {
  const contentHtml = section.content ? marked(section.content) : "";
  
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
      <tr>
        <td style="padding: 0 24px;">
          ${section.title ? `
            <h3 style="margin: 0 0 16px; font-size: 20px; font-weight: 700; line-height: 1.3; color: #111827;">
              ${section.title}
            </h3>
          ` : ""}
          <div style="font-size: 16px; line-height: 1.6; color: #374151;">
            ${contentHtml}
          </div>
        </td>
      </tr>
    </table>
  `;
}
