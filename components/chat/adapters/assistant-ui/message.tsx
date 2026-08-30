"use client";

import {
  ErrorPrimitive,
  MessagePrimitive,
  type EmptyMessagePartProps,
} from "@assistant-ui/react";
import type { ChatPersona } from "../../types";
import { Avatar } from "./avatar";
import { MarkdownText } from "./markdown-text";

export function UserMessage() {
  return (
    <MessagePrimitive.Root className="flex justify-end">
      <div className="max-w-[80%] rounded-2xl rounded-br-md bg-zinc-900 px-4 py-2.5 text-sm leading-relaxed text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900">
        <MessagePrimitive.Parts />
      </div>
    </MessagePrimitive.Root>
  );
}

export function AssistantMessage({ persona }: { persona: ChatPersona }) {
  return (
    <MessagePrimitive.Root className="flex gap-3">
      <Avatar
        persona={persona}
        size={32}
        className="mt-0.5 size-8 shrink-0 text-xs"
      />

      <div className="min-w-0 flex-1 pt-1 text-sm leading-relaxed">
        <MessagePrimitive.Parts
          components={{ Text: MarkdownText, Empty: ThinkingIndicator }}
        />

        <MessagePrimitive.Error>
          <ErrorPrimitive.Root className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
            <ErrorPrimitive.Message />
          </ErrorPrimitive.Root>
        </MessagePrimitive.Error>
      </div>
    </MessagePrimitive.Root>
  );
}

/** Shown while waiting for the first token, and again after a tool call. */
function ThinkingIndicator({ status }: EmptyMessagePartProps) {
  if (status.type !== "running") return null;

  return (
    <span
      className="inline-flex h-5 items-center gap-1"
      aria-live="polite"
      aria-label="Thinking"
    >
      <span className="size-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.3s] dark:bg-zinc-500" />
      <span className="size-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.15s] dark:bg-zinc-500" />
      <span className="size-1.5 animate-bounce rounded-full bg-zinc-400 dark:bg-zinc-500" />
    </span>
  );
}
