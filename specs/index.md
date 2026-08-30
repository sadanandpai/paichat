# Spec Registry — my-chat

Behavior specifications for my-chat — a grounded, RAG-backed persona chatbot that
lets users "chat with Sadanand Pai" in first person. Captures the intentional
decisions and non-obvious constraints the code alone doesn't explain.

## Behavior specs

| ID | Title | Version | Status |
|----|-------|---------|--------|
| [CHAT-001](CHAT-001.md) | Env-Switchable LLM Provider — Claude via Local CLI Alongside Gemini | 1.0.0 | Draft |

## Known issues (tracked, not yet fixed)

| Ref | Summary | Where |
|-----|---------|-------|
| KI-1 | The claude-cli provider is ungrounded — no RAG/lookup tools; needs MCP or pre-fetch grounding | [CHAT-001](CHAT-001.md) |
