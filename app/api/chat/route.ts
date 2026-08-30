import { randomUUID } from "node:crypto";
import { toBaseMessages, toUIMessageStream } from "@ai-sdk/langchain";
import { createUIMessageStreamResponse, type UIMessage } from "ai";
import { agent } from "@/lib/agents/root";

export const runtime = "nodejs";
export const maxDuration = 60;

type ChatRequest = { messages?: UIMessage[]; threadId?: string };

export async function POST(req: Request) {
  const { messages = [], threadId } = (await req
    .json()
    .catch(() => ({}))) as ChatRequest;

  // The checkpointer already holds the thread history, so only the newest
  // message goes to the agent — sending the whole array would duplicate it.
  const latest = messages.at(-1);
  if (!latest) {
    return Response.json({ error: "No message provided." }, { status: 400 });
  }

  const stream = await agent.stream(
    { messages: await toBaseMessages([latest]) },
    {
      streamMode: ["values", "messages"],
      configurable: { thread_id: threadId?.trim() || randomUUID() },
      signal: req.signal,
    },
  );

  return createUIMessageStreamResponse({ stream: toUIMessageStream(stream) });
}
