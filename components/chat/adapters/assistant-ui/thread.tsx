"use client";

import { AuiIf, ThreadPrimitive } from "@assistant-ui/react";
import { useCallback, useEffect } from "react";
import type { ChatCopy, ChatPersona } from "../../types";
import { Avatar } from "./avatar";
import { Composer } from "./composer";
import { AssistantMessage, UserMessage } from "./message";

type ThreadProps = {
  persona: ChatPersona;
  copy: ChatCopy;
};

export function Thread({ persona, copy }: ThreadProps) {
  useVisualViewportHeight();

  const renderMessage = useCallback(
    ({ message }: { message: { role: string } }) =>
      message.role === "user" ? (
        <UserMessage />
      ) : (
        <AssistantMessage persona={persona} />
      ),
    [persona],
  );

  return (
    <ThreadPrimitive.Root className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <ThreadPrimitive.Viewport className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-4 py-4 sm:py-8">
        <AuiIf condition={(s) => s.thread.isEmpty}>
          <EmptyState persona={persona} copy={copy} />
        </AuiIf>

        <ThreadPrimitive.Messages>{renderMessage}</ThreadPrimitive.Messages>
      </ThreadPrimitive.Viewport>

      <div className="shrink-0 border-t border-zinc-200/60 bg-background px-4 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:py-4 dark:border-zinc-800/60">
        <Composer placeholder={copy.placeholder} />
      </div>
    </ThreadPrimitive.Root>
  );
}

/** iOS Safari ignores interactive-widget; pin --app-height to the visual viewport. */
function useVisualViewportHeight() {
  useEffect(() => {
    const root = document.documentElement;
    const vv = window.visualViewport;
    if (!vv) return;

    const sync = () => {
      root.style.setProperty("--app-height", `${Math.round(vv.height)}px`);
      window.scrollTo(0, 0);
    };

    sync();
    vv.addEventListener("resize", sync);
    vv.addEventListener("scroll", sync);
    return () => {
      vv.removeEventListener("resize", sync);
      vv.removeEventListener("scroll", sync);
      root.style.removeProperty("--app-height");
    };
  }, []);
}

function EmptyState({ persona, copy }: ThreadProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
      <Avatar persona={persona} size={48} className="size-12 text-sm" />
      <div>
        <p className="text-lg font-medium">{copy.emptyTitle}</p>
        {copy.emptySubtitle ? (
          <p className="mt-1 max-w-sm text-sm text-zinc-500">
            {copy.emptySubtitle}
          </p>
        ) : null}
      </div>
    </div>
  );
}
