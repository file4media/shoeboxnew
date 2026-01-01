import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

export interface ClaudeMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * Call Claude API with messages
 */
export async function callClaude(
  messages: ClaudeMessage[],
  options?: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
    system?: string;
  }
): Promise<string> {
  const response = await anthropic.messages.create({
    model: options?.model || "claude-3-haiku-20240307",
    max_tokens: options?.maxTokens || 4096,
    temperature: options?.temperature || 1.0,
    system: options?.system,
    messages: messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
  });

  const content = response.content[0];
  if (content.type === "text") {
    return content.text;
  }

  throw new Error("Unexpected response type from Claude API");
}

/**
 * Generate newsletter content using Claude
 */
export async function generateNewsletterContent(prompt: string): Promise<string> {
  return callClaude(
    [
      {
        role: "user",
        content: prompt,
      },
    ],
    {
      system: "You are a professional newsletter writer. Write engaging, informative content that captures readers' attention. Use a conversational yet authoritative tone.",
      maxTokens: 4096,
    }
  );
}

/**
 * Generate newsletter subject line using Claude
 */
export async function generateSubjectLine(content: string): Promise<string> {
  return callClaude(
    [
      {
        role: "user",
        content: `Based on this newsletter content, generate a compelling subject line (max 60 characters):\n\n${content.substring(0, 500)}`,
      },
    ],
    {
      system: "You are an expert at writing email subject lines that get high open rates. Keep it concise, intriguing, and relevant.",
      maxTokens: 100,
    }
  );
}
