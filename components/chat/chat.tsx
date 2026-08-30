"use client";

import { useState } from "react";
// Adapter swap point: change this import to move to another UI kit.
import { ChatView } from "./adapters/assistant-ui";
import { chatApiRoute, chatCopy, chatPersona } from "./config";

export function Chat() {
  const [threadId] = useState(() => crypto.randomUUID());

  return (
    <ChatView
      api={chatApiRoute}
      threadId={threadId}
      persona={chatPersona}
      copy={chatCopy}
    />
  );
}
