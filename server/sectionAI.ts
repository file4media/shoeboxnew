import { callClaude } from "./claudeAPI";

export interface SectionGenerationOptions {
  sectionType: string;
  prompt: string;
  tone?: "professional" | "casual" | "friendly" | "formal";
  length?: "short" | "medium" | "long";
  context?: string; // Additional context about the newsletter/edition
}

/**
 * Generate content for a specific section type using AI
 */
export async function generateSectionContent(
  options: SectionGenerationOptions
): Promise<{
  title?: string;
  subtitle?: string;
  content?: string;
  buttonText?: string;
}> {
  const { sectionType, prompt, tone = "professional", length = "medium", context = "" } = options;

  const lengthGuidance = {
    short: "Keep it concise, around 100-200 words",
    medium: "Write moderate length content, around 300-500 words",
    long: "Write comprehensive content, around 600-1000 words",
  };

  // Build system prompt based on section type
  const systemPrompts: Record<string, string> = {
    header: "You are an expert at writing compelling newsletter headers. Create attention-grabbing titles and subtitles that hook readers.",
    text: `You are a professional newsletter writer. Write engaging, informative content in a ${tone} tone. ${lengthGuidance[length]}. Use markdown formatting.`,
    article: `You are a skilled article writer. Create well-structured articles with clear headlines and engaging content. ${lengthGuidance[length]}. Use markdown formatting.`,
    quote: "You are an expert at finding and presenting impactful quotes. Provide meaningful quotes that resonate with readers.",
    cta: "You are a conversion copywriter. Create compelling call-to-action text that motivates readers to take action.",
    list: `You are skilled at creating scannable, informative lists. Create clear, actionable list items. ${lengthGuidance[length]}.`,
  };

  const systemPrompt = systemPrompts[sectionType] || systemPrompts.text;

  // Build user prompt based on section type
  let userPrompt = "";
  
  if (context) {
    userPrompt += `Newsletter context: ${context}\n\n`;
  }

  switch (sectionType) {
    case "header":
      userPrompt += `Create a header for: ${prompt}\n\nProvide:\n1. A catchy title (5-10 words)\n2. A compelling subtitle (10-20 words)\n\nFormat:\nTITLE: [title]\nSUBTITLE: [subtitle]`;
      break;
      
    case "article":
      userPrompt += `Write an article about: ${prompt}\n\nProvide:\n1. A headline\n2. The article content in markdown\n\nFormat:\nHEADLINE: [headline]\n\nCONTENT:\n[article content]`;
      break;
      
    case "quote":
      userPrompt += `Find or create a relevant quote about: ${prompt}\n\nProvide:\n1. The quote text\n2. Attribution (author/source)\n\nFormat:\nQUOTE: [quote text]\nATTRIBUTION: [author/source]`;
      break;
      
    case "cta":
      userPrompt += `Create a call-to-action for: ${prompt}\n\nProvide:\n1. Button text (2-4 words)\n2. Supporting text (one sentence)\n\nFormat:\nBUTTON: [button text]\nTEXT: [supporting text]`;
      break;
      
    case "list":
      userPrompt += `Create a list about: ${prompt}\n\nProvide:\n1. A title for the list\n2. List items in markdown (use - for bullets or 1. for numbered)\n\nFormat:\nTITLE: [list title]\n\nLIST:\n[list items]`;
      break;
      
    default: // text
      userPrompt += `Write content about: ${prompt}\n\nProvide the content in markdown format.`;
  }

  try {
    const generatedText = await callClaude(
      [{ role: "user", content: userPrompt }],
      {
        system: systemPrompt,
        maxTokens: 2048,
      }
    );

    // Parse the response based on section type
    return parseSectionResponse(sectionType, generatedText);
  } catch (error) {
    console.error("Error generating section content:", error);
    throw new Error("Failed to generate section content");
  }
}

/**
 * Parse AI response into structured section data
 */
function parseSectionResponse(
  sectionType: string,
  response: string
): {
  title?: string;
  subtitle?: string;
  content?: string;
  buttonText?: string;
} {
  const result: any = {};

  switch (sectionType) {
    case "header": {
      const titleMatch = response.match(/TITLE:\s*(.+?)(?:\n|$)/i);
      const subtitleMatch = response.match(/SUBTITLE:\s*(.+?)(?:\n|$)/i);
      result.title = titleMatch ? titleMatch[1].trim() : "";
      result.subtitle = subtitleMatch ? subtitleMatch[1].trim() : "";
      break;
    }
    
    case "article": {
      const headlineMatch = response.match(/HEADLINE:\s*(.+?)(?:\n|$)/i);
      const contentMatch = response.match(/CONTENT:\s*([\s\S]+)/i);
      result.title = headlineMatch ? headlineMatch[1].trim() : "";
      result.content = contentMatch ? contentMatch[1].trim() : response;
      break;
    }
    
    case "quote": {
      const quoteMatch = response.match(/QUOTE:\s*(.+?)(?:\n|$)/i);
      const attributionMatch = response.match(/ATTRIBUTION:\s*(.+?)(?:\n|$)/i);
      const quoteText = quoteMatch ? quoteMatch[1].trim() : response;
      const attribution = attributionMatch ? attributionMatch[1].trim() : "";
      result.content = attribution ? `${quoteText}\n\n— ${attribution}` : quoteText;
      break;
    }
    
    case "cta": {
      const buttonMatch = response.match(/BUTTON:\s*(.+?)(?:\n|$)/i);
      const textMatch = response.match(/TEXT:\s*(.+?)(?:\n|$)/i);
      result.buttonText = buttonMatch ? buttonMatch[1].trim() : "Learn More";
      result.content = textMatch ? textMatch[1].trim() : "";
      break;
    }
    
    case "list": {
      const titleMatch = response.match(/TITLE:\s*(.+?)(?:\n|$)/i);
      const listMatch = response.match(/LIST:\s*([\s\S]+)/i);
      result.title = titleMatch ? titleMatch[1].trim() : "";
      result.content = listMatch ? listMatch[1].trim() : response;
      break;
    }
    
    default: // text
      result.content = response;
  }

  return result;
}

/**
 * Improve existing section content
 */
export async function improveSectionContent(
  originalContent: string,
  instructions: string
): Promise<string> {
  const systemPrompt = "You are an expert content editor. Improve the content based on specific instructions while maintaining the core message.";
  
  const userPrompt = `Original content:\n${originalContent}\n\nInstructions:\n${instructions}\n\nProvide the improved version in markdown format.`;

  try {
    const improvedContent = await callClaude(
      [{ role: "user", content: userPrompt }],
      {
        system: systemPrompt,
        maxTokens: 2048,
      }
    );
    return improvedContent;
  } catch (error) {
    console.error("Error improving section content:", error);
    throw new Error("Failed to improve section content");
  }
}
