"use client";

import {
  AssistantRuntimeProvider,
  WebSpeechDictationAdapter,
} from "@assistant-ui/react";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { DefaultChatTransport } from "ai";
import { useMemo } from "react";
import type { ChatViewProps } from "../../types";
import { Thread } from "./thread";

export function ChatView({ api, threadId, persona, copy }: ChatViewProps) {
  const transport = useMemo(
    () => new DefaultChatTransport({ api, body: { threadId } }),
    [api, threadId],
  );

  const adapters = useMemo(
    () => ({ dictation: new WebSpeechDictationAdapter() }),
    [],
  );

  const runtime = useChatRuntime({ transport, adapters });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <Thread persona={persona} copy={copy} />
    </AssistantRuntimeProvider>
  );
}
