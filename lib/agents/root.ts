import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { MemorySaver } from "@langchain/langgraph";
import { createAgent, summarizationMiddleware } from "langchain";
import {
  summaryPrefix,
  summaryPrompt,
  systemPrompt,
} from "@/constants/prompts";
import { ChatClaudeCLI } from "@/lib/agents/claude-cli";
import { stripToolMessagesMiddleware } from "@/lib/middlewares/strip-tool-messages";
import { searchKnowledgeTool } from "@/lib/tools/knowledge";
import { getIntroTool } from "@/lib/tools/intro";
import { lookupCompanyTool } from "@/lib/tools/companies";
import { lookupPersonTool } from "@/lib/tools/people";
import { lookupProjectsTool } from "@/lib/tools/projects";
import { lookupSkillsTool } from "@/lib/tools/skills";

// Which LLM backs the agent. Set LLM_PROVIDER=claude-cli to run the Claude CLI
// workflow; anything else (or unset) runs Gemini.
const useClaude = process.env.LLM_PROVIDER === "claude-cli";

// In-process memory: fine for local dev / single instance.
// Swap for a Redis/Postgres checkpointer before running multi-instance.
const checkpointer = new MemorySaver();

// The Claude CLI provider is text-only (no tool-calling), so the agent runs
// ungrounded — no RAG/lookup tools. The Gemini path keeps the full grounded
// toolset. See lib/agents/claude-cli.ts.
const tools = useClaude
  ? []
  : [
      getIntroTool,
      lookupCompanyTool,
      lookupPersonTool,
      lookupProjectsTool,
      lookupSkillsTool,
      searchKnowledgeTool,
    ];

const model = useClaude
  ? new ChatClaudeCLI()
  : new ChatGoogleGenerativeAI({
      model: "gemini-3.5-flash-lite",
      temperature: 0.25,
    });

const summarizerModel = useClaude
  ? new ChatClaudeCLI()
  : new ChatGoogleGenerativeAI({
      model: "gemini-3.5-flash-lite",
      temperature: 0.1,
      // Keeps summary tokens out of the "messages" stream, so the UI never renders them.
      tags: ["langsmith:nostream"],
    });

export const agent = createAgent({
  model,
  tools,
  middleware: [
    // New user prompt only — mid-turn tool results stay so the model can read them.
    stripToolMessagesMiddleware,
    summarizationMiddleware({
      model: summarizerModel,
      trigger: { messages: 6 },
      keep: { messages: 4 },
      summaryPrefix,
      summaryPrompt,
    }),
  ],
  systemPrompt,
  checkpointer,
});
