import { isDemoMode } from "@/lib/env";

type LLMProvider = "openai" | "minimax";

/**
 * 默认：同时配置 MiniMax（KEY+GroupId）时优先 MiniMax；否则用 OpenAI。
 * 可显式设置 LLM_PROVIDER=minimax|openai。
 */
function getProvider(): LLMProvider {
  const prefer = process.env.LLM_PROVIDER?.toLowerCase();
  const hasMini =
    Boolean(process.env.MINIMAX_API_KEY?.trim()) &&
    Boolean(process.env.MINIMAX_GROUP_ID?.trim());
  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY?.trim());

  if (prefer === "minimax") return "minimax";
  if (prefer === "openai") return "openai";

  if (hasMini) return "minimax";
  if (hasOpenAI) return "openai";
  return "minimax";
}

export async function generateText(input: {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  fallbackText: string;
  /** 长文生成时可提高（如小说 ~2000 字） */
  maxOutputTokens?: number;
}) {
  if (isDemoMode()) {
    return input.fallbackText;
  }
  try {
    const provider = getProvider();
    if (provider === "openai") {
      return await callOpenAI(input);
    }
    return await callMiniMax(input);
  } catch {
    return input.fallbackText;
  }
}

async function callOpenAI(input: {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  fallbackText: string;
  maxOutputTokens?: number;
}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return input.fallbackText;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
      temperature: input.temperature ?? 0.8,
      max_output_tokens: input.maxOutputTokens ?? 1024,
      input: [
        { role: "system", content: input.systemPrompt },
        { role: "user", content: input.userPrompt },
      ],
    }),
  });

  if (!response.ok) return input.fallbackText;
  const body = (await response.json()) as { output_text?: string };
  return body.output_text?.trim() || input.fallbackText;
}

async function callMiniMax(input: {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  fallbackText: string;
  maxOutputTokens?: number;
}) {
  const apiKey = process.env.MINIMAX_API_KEY;
  const groupId = process.env.MINIMAX_GROUP_ID;
  if (!apiKey || !groupId) return input.fallbackText;

  const response = await fetch(
    `https://api.minimax.chat/v1/text/chatcompletion_pro?GroupId=${encodeURIComponent(groupId)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.MINIMAX_MODEL ?? "abab6.5-chat",
        tokens_to_generate: Math.min(8192, Math.max(800, input.maxOutputTokens ?? 800)),
        temperature: input.temperature ?? 0.8,
        messages: [
          { sender_type: "SYSTEM", text: input.systemPrompt },
          { sender_type: "USER", text: input.userPrompt },
        ],
      }),
    },
  );

  if (!response.ok) return input.fallbackText;
  const body = (await response.json()) as {
    reply?: string;
    choices?: Array<{ message?: { content?: string } }>;
  };
  return body.reply || body.choices?.[0]?.message?.content || input.fallbackText;
}
