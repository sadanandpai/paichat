---
id: CHAT-001
title: Env-Switchable LLM Provider — Claude via Local CLI Alongside Gemini
version: 1.0.0
status: draft
---

# CHAT-001: Env-Switchable LLM Provider — Claude via Local CLI Alongside Gemini

## Purpose

The agent was powered solely by Google Gemini. We wanted the option to run it on
Claude without forcing it, so the LLM provider is selected by an environment
variable. On the target machine there is no standalone Anthropic API key — the
only available Claude access is the already-authenticated local `claude` CLI
(which routes through an internal Bedrock gateway). Shelling out to that CLI lets
the app use Claude with **no API key**, at the cost of higher per-turn latency
and per-token billing. The Gemini path and its grounded tools remain unchanged
behind the switch.

## Contract

**Switch:** `lib/agents/root.ts`
- `LLM_PROVIDER=claude-cli` → Claude via the CLI, agent built with **no tools**.
- Any other value / unset → Gemini (`gemini-3.5-flash-lite`) with the full
  5-tool grounded toolset and the Gemini summarizer middleware.

**Module:** `lib/agents/claude-cli.ts`

**Export:** `ChatClaudeCLI` — a LangChain `SimpleChatModel`.

```typescript
new ChatClaudeCLI({
  binary?: string,     // default "claude" (on PATH)
  model?: string,      // default process.env.CLAUDE_CLI_MODEL; omitted -> CLI session default
  timeoutMs?: number,  // default 55000
})
```

**Behavior:**
- Runs `claude -p --output-format json`, appending `--model <m>` when a model is
  set and `--system-prompt <s>` built from the conversation's SystemMessage(s).
  The non-system messages are serialized as a `User:` / `Assistant:` transcript
  and piped to the CLI via stdin.
- Parses the CLI's JSON; returns `result`. Throws if `is_error` is true (message
  includes the CLI `subtype`).
- `_streamResponseChunks` emits `result` in 24-char slices and fires
  `handleLLMNewToken`, so the agent's `messages` stream mode surfaces it to the
  UI as `text-delta` events (the CLI itself is non-streaming).
- `bindTools` is a no-op that returns the model unchanged — `createAgent`
  requires the method even when no tools are bound; this provider cannot call
  tools.

**Config (env):**
- `LLM_PROVIDER` — `claude-cli` selects Claude; anything else selects Gemini.
- `CLAUDE_CLI_MODEL` — optional model id/alias for `--model`.

## Acceptance Criteria

- [x] AC-1: WHEN `LLM_PROVIDER=claude-cli`, THEN the agent is built with
  `ChatClaudeCLI` and an empty tool list (ungrounded).
- [x] AC-2: WHEN `LLM_PROVIDER` is unset or any other value, THEN the agent uses
  Gemini with the 5 grounded tools and the Gemini summarizer — unchanged from before.
- [x] AC-3: WHEN a message is sent on the claude-cli path, THEN the reply streams
  to the UI as incremental `text-delta` chunks (verified via `/api/chat`).
- [x] AC-4: WHEN SystemMessage(s) are present, THEN they are passed via
  `--system-prompt`, separate from the user transcript sent on stdin.
- [x] AC-5: WHEN `CLAUDE_CLI_MODEL` is set, THEN it is passed as `--model`;
  otherwise the CLI's session default model is used.
- [x] AC-6: WHEN the CLI returns `is_error: true`, THEN the model throws an error
  carrying the CLI `subtype` / message rather than returning empty text.
- [ ] AC-7 (deferred): The claude-cli path is **ungrounded** — no RAG or
  company/person/project lookups. Grounding for Claude (expose the 5 tools via
  MCP, or pre-fetch RAG context into the prompt) is future work.

## Constraints / Notes

- The `claude` CLI is **not a local model**: it makes remote calls to the Bedrock
  gateway, so it needs network access and is billed per token (~$0.03+/message),
  with several seconds of latency per turn (fresh process, reloaded context).
- Env is read at process start — restart `next dev` after changing `.env.local`.
- `ADMIN_SECRET`, `WEAVIATE_*`, `UPSTASH_*` are still required for the Gemini path
  and the grounded tools; the claude-cli smoke-test path needs none of them.

## Implementation Files

**Code:**
- `lib/agents/claude-cli.ts` — `ChatClaudeCLI` (new).
- `lib/agents/root.ts` — `LLM_PROVIDER` switch selecting model, summarizer, and tools.

**Config:**
- `.env.example` — documents the `LLM_PROVIDER` switch and why it exists.
- `.env.local` (gitignored) — local value; set to `claude-cli` for this run.

## Related Specs

- None. First spec for my-chat.
