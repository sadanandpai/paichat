# Pai Chat

First-person chat with [Sadanand Pai](https://github.com/sadanandpai). Grounded answers from a personal knowledge base — work, projects, people, companies, skills. Off-topic and private questions are refused.

## Stack

Next.js 16 · LangChain · Gemini (or Claude CLI) · Weaviate · Upstash Redis · [assistant-ui](https://www.assistant-ui.com/)

## Setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Providers

Set `LLM_PROVIDER` in `.env.local`:

| Value | Model | Grounding |
|---|---|---|
| unset / anything else | Gemini `gemini-3.5-flash-lite` | Full toolset (intro, companies, people, projects, skills, knowledge) |
| `claude-cli` | Local [`claude`](https://docs.anthropic.com/en/docs/claude-code) CLI | None — text only, no tools |

Gemini needs `GOOGLE_API_KEY`, Weaviate, and Upstash. Claude CLI uses the CLI's own auth — no API key, but ungrounded and billed per token.

Optional: `CLAUDE_CLI_MODEL` to pin the Claude model.

## Knowledge

Tool data lives in Redis. Long-form knowledge is chunked and indexed in Weaviate.

Edit it at `/admin?token=<ADMIN_SECRET>`. Cookie is set for 30 days; token is stripped from the URL.

## Scripts

```bash
npm run dev     # local server
npm run build   # production build
npm run start   # serve production build
npm run lint    # eslint
```
