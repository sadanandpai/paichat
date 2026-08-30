import {
  AIMessage,
  HumanMessage,
  RemoveMessage,
  ToolMessage,
  type BaseMessage,
} from "@langchain/core/messages";
import { REMOVE_ALL_MESSAGES } from "@langchain/langgraph";
import { createMiddleware } from "langchain";

function hasToolCalls(message: BaseMessage): boolean {
  return Boolean(
    AIMessage.isInstance(message) &&
      message.tool_calls &&
      message.tool_calls.length > 0,
  );
}

function messageText(message: BaseMessage): string {
  const { content } = message;
  if (typeof content === "string") return content.trim();
  if (!Array.isArray(content)) return "";
  return content
    .map((part) => {
      if (typeof part === "string") return part;
      if (part && typeof part === "object" && "text" in part) {
        return String((part as { text?: unknown }).text ?? "");
      }
      return "";
    })
    .join("")
    .trim();
}

/**
 * Drop completed AI tool_call + ToolMessage blocks from history.
 * Keeps a trailing incomplete tool turn so the model can still read results.
 */
export function stripCompletedToolPairs(
  messages: BaseMessage[],
): BaseMessage[] {
  const kept: BaseMessage[] = [];
  let i = 0;

  while (i < messages.length) {
    const msg = messages[i]!;

    if (hasToolCalls(msg)) {
      let j = i + 1;
      while (j < messages.length && ToolMessage.isInstance(messages[j])) {
        j++;
      }

      // Trailing incomplete cycle — model still needs these tool results.
      if (j >= messages.length) {
        kept.push(...messages.slice(i));
        break;
      }

      // Completed cycle: keep any spoken text on the tool-calling AI msg.
      const text = messageText(msg);
      if (text && AIMessage.isInstance(msg)) {
        kept.push(
          new AIMessage({
            content: msg.content,
            id: msg.id,
            additional_kwargs: msg.additional_kwargs,
            response_metadata: msg.response_metadata,
          }),
        );
      }
      i = j;
      continue;
    }

    if (ToolMessage.isInstance(msg)) {
      // Orphan tool result — drop.
      i++;
      continue;
    }

    kept.push(msg);
    i++;
  }

  return kept;
}

/** Permanently strip completed tool traffic when a new user prompt arrives. */
export const stripToolMessagesMiddleware = createMiddleware({
  name: "stripToolMessages",
  beforeModel: async (state) => {
    const last = state.messages.at(-1);
    if (!last || !HumanMessage.isInstance(last)) return;

    const cleaned = stripCompletedToolPairs(state.messages);
    const unchanged =
      cleaned.length === state.messages.length &&
      cleaned.every((message, index) => message === state.messages[index]);
    if (unchanged) return;

    return {
      messages: [
        new RemoveMessage({ id: REMOVE_ALL_MESSAGES }),
        ...cleaned,
      ],
    };
  },
});
