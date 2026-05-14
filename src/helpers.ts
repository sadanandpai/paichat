import { CATEGORY_PROMPT, QUERY_REWRITE_PROMPT } from "./constants";
import {
  EMBEDDING_MODEL,
  LLM_MODEL,
  PERSONA_NAME,
  VECTOR_MATCH_THRESHOLD,
} from "./config";

export async function verifyPayloadMessages(c: any, next: any) {
  let payload;
  try {
    payload = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON payload" }, 400);
  }

  if (
    !payload.messages ||
    !Array.isArray(payload.messages) ||
    payload.messages.length === 0
  ) {
    return c.json(
      { error: "Messages are required and must be a non-empty array" },
      400,
    );
  }

  c.set("payload", payload);
  return next();
}

export async function createEmbedding(c: any, text: string) {
  const embedding: any = await c.env.AI.run(EMBEDDING_MODEL, {
    text,
  });
  return embedding.data[0];
}

export async function getPromptCategory(c: any, text: string) {
  const classification = await c.env.AI.run(LLM_MODEL, {
    messages: [
      {
        role: "system",
        content: CATEGORY_PROMPT,
      },
      { role: "user", content: text },
    ],
    max_tokens: 5,
  });

  const cleanedResponse = classification.response.trim().toUpperCase();

  if (cleanedResponse.includes("GREETING")) return "GREETING";
  if (cleanedResponse.includes("PERSONAL")) return "PERSONAL";
  if (cleanedResponse.includes("PROHIBITED")) return "PROHIBITED";

  return "PROFESSIONAL";
}

export async function getStandaloneQuestion(c: any, messages: any[]) {
  // Format the history for the model to review
  const conversationHistory = messages
    .map((msg: any) => `${msg.role.toUpperCase()}: ${msg.content}`)
    .join("\n");

  const systemInstruction = QUERY_REWRITE_PROMPT;
  const result: any = await c.env.AI.run(LLM_MODEL, {
    messages: [
      { role: "system", content: systemInstruction },
      {
        role: "user",
        content: `Conversation History:\n${conversationHistory}\n\nRewrite the latest message into a standalone question:`,
      },
    ],
  });

  return result.response.trim();
}

export async function getTopKMatches(c: any, embedding: any, topK: number = 3) {
  const matches = await c.env.VECTORIZE.query(embedding, {
    topK,
    returnValues: false,
    returnMetadata: "all",
  });

  return matches.matches.filter(
    (match: any) => match.score > VECTOR_MATCH_THRESHOLD,
  );
}

export function getFinalSystemPrompt(
  matches: { metadata: { prompt: string } }[],
) {
  return `
    You are ${PERSONA_NAME}. Your job is to answer the user as if you are talking directly to a workplace colleague. Rules for your behavior:
    1. Always speak in the first person ("I", "me", "my", "we"). Never say "Based on the context" or "The author says". 
    2. Use a casual, natural, and helpful tone—exactly how a tech professional talks to a teammate. Keep answers punchy and avoid corporate fluff.
    3. Only use the provided facts below to answer. If a question asks about something not listed in the facts, say exactly: "I'm not sure about that, actually." or "I haven't added that to my profile yet." Do not invent details.Facts about me:<context>${matches.map((match) => match.metadata.prompt).join("\n\n")}</context>
  `;
}

export async function getQueryResponse(
  c: any,
  systemPrompt: string,
  messagesHistory: any[],
) {
  // Format the history for the model to review
  const messages = [
    {
      role: "system",
      content: systemPrompt,
    },
    ...messagesHistory, // Include recent conversation history for context
  ];

  return await c.env.AI.run(LLM_MODEL, {
    messages,
    max_tokens: 300,
  });
}
