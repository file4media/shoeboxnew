import { invokeLLM } from "./_core/llm";

export interface ContentGenerationOptions {
  topic: string;
  tone?: "professional" | "casual" | "friendly" | "formal";
  length?: "short" | "medium" | "long";
  includeIntro?: boolean;
  includeConclusion?: boolean;
  additionalContext?: string;
}

/**
 * Generate newsletter content using AI
 */
export async function generateNewsletterContent(
  options: ContentGenerationOptions
): Promise<{ content: string; title: string }> {
  const {
    topic,
    tone = "professional",
    length = "medium",
    includeIntro = true,
    includeConclusion = true,
    additionalContext = "",
  } = options;

  const lengthGuidance = {
    short: "Keep it concise, around 300-400 words",
    medium: "Write a moderate length article, around 600-800 words",
    long: "Write a comprehensive article, around 1000-1500 words",
  };

  const systemPrompt = `You are an expert newsletter content writer. Your task is to create engaging, well-structured newsletter articles that captivate readers and provide value.

Writing guidelines:
- Use a ${tone} tone throughout
- ${lengthGuidance[length]}
- Write in markdown format
- Use clear headings and subheadings
- Include relevant examples and insights
- Make it scannable with bullet points where appropriate
- End with a clear takeaway or call to action
${includeIntro ? "- Start with an engaging introduction that hooks the reader" : ""}
${includeConclusion ? "- End with a compelling conclusion" : ""}`;

  const userPrompt = `Write a newsletter article about: ${topic}

${additionalContext ? `Additional context: ${additionalContext}` : ""}

Please provide:
1. A catchy title for the newsletter
2. The full article content in markdown format

Format your response as:
TITLE: [Your catchy title here]

CONTENT:
[Your article content in markdown]`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const messageContent = response.choices[0]?.message?.content;
    const generatedText = typeof messageContent === 'string' ? messageContent : '';

    // Parse the response to extract title and content
    const titleMatch = generatedText.match(/TITLE:\s*(.+?)(?:\n|$)/i);
    const contentMatch = generatedText.match(/CONTENT:\s*([\s\S]+)/i);

    const title = titleMatch ? titleMatch[1].trim() : topic;
    const content = contentMatch ? contentMatch[1].trim() : generatedText;

    return { title, content };
  } catch (error) {
    console.error("Error generating newsletter content:", error);
    throw new Error("Failed to generate newsletter content");
  }
}

/**
 * Improve or rewrite existing content
 */
export async function improveContent(
  originalContent: string,
  instructions: string
): Promise<string> {
  const systemPrompt = `You are an expert content editor. Your task is to improve newsletter content based on specific instructions while maintaining the core message and value.`;

  const userPrompt = `Original content:
${originalContent}

Instructions for improvement:
${instructions}

Please provide the improved version in markdown format.`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const improvedContent = response.choices[0]?.message?.content;
    return typeof improvedContent === 'string' ? improvedContent : originalContent;
  } catch (error) {
    console.error("Error improving content:", error);
    throw new Error("Failed to improve content");
  }
}

/**
 * Generate a subject line for newsletter content
 */
export async function generateSubjectLine(content: string): Promise<string[]> {
  const systemPrompt = `You are an expert at writing compelling email subject lines that drive opens. Create subject lines that are:
- Attention-grabbing but not clickbait
- Clear and specific
- Under 60 characters when possible
- Action-oriented or curiosity-inducing`;

  const userPrompt = `Based on this newsletter content, generate 5 different subject line options:

${content.substring(0, 500)}...

Provide exactly 5 subject lines, one per line, without numbering or bullets.`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const messageContent = response.choices[0]?.message?.content;
    const generatedText = typeof messageContent === 'string' ? messageContent : '';
    const lines = generatedText.split("\n");
    const subjectLines = lines
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0 && !line.match(/^\d+\./))
      .slice(0, 5);

    return subjectLines.length > 0 ? subjectLines : ["Your Newsletter Update"];
  } catch (error) {
    console.error("Error generating subject lines:", error);
    throw new Error("Failed to generate subject lines");
  }
}
