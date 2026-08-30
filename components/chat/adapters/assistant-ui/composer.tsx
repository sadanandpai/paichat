"use client";

import {
  AuiIf,
  ComposerPrimitive,
  WebSpeechDictationAdapter,
} from "@assistant-ui/react";
import { useSyncExternalStore } from "react";
import { MicIcon, SendIcon, StopIcon } from "./icons";

const noopSubscribe = () => () => {};

const buttonClass =
  "flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-zinc-50 transition-opacity disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900";

const micButtonClass =
  "flex size-8 shrink-0 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-40 disabled:hover:bg-transparent dark:hover:bg-zinc-800 dark:hover:text-zinc-100";

const listeningButtonClass =
  "flex size-8 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-500 transition-colors hover:bg-red-500/20";

export function Composer({ placeholder }: { placeholder: string }) {
  // Server snapshot is false so hydration matches; browsers without
  // SpeechRecognition (Firefox) never get the mic button.
  const dictationSupported = useSyncExternalStore(
    noopSubscribe,
    () => WebSpeechDictationAdapter.isSupported(),
    () => false,
  );

  return (
    <ComposerPrimitive.Root className="flex items-end gap-2 rounded-2xl border border-zinc-200 bg-white p-2 shadow-sm focus-within:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:focus-within:border-zinc-600">
      <ComposerPrimitive.Input
        autoFocus
        rows={1}
        placeholder={placeholder}
        className="max-h-40 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-zinc-400"
      />

      {dictationSupported ? (
        <>
          <AuiIf condition={(s) => s.composer.dictation == null}>
            <ComposerPrimitive.Dictate
              className={micButtonClass}
              aria-label="Start voice input"
            >
              <MicIcon />
            </ComposerPrimitive.Dictate>
          </AuiIf>

          <AuiIf condition={(s) => s.composer.dictation != null}>
            <ComposerPrimitive.StopDictation
              className={listeningButtonClass}
              aria-label="Stop voice input"
            >
              <span className="animate-pulse">
                <MicIcon />
              </span>
            </ComposerPrimitive.StopDictation>
          </AuiIf>
        </>
      ) : null}

      <AuiIf condition={(s) => !s.thread.isRunning}>
        <ComposerPrimitive.Send className={buttonClass} aria-label="Send">
          <SendIcon />
        </ComposerPrimitive.Send>
      </AuiIf>

      <AuiIf condition={(s) => s.thread.isRunning}>
        <ComposerPrimitive.Cancel className={buttonClass} aria-label="Stop">
          <StopIcon />
        </ComposerPrimitive.Cancel>
      </AuiIf>
    </ComposerPrimitive.Root>
  );
}
