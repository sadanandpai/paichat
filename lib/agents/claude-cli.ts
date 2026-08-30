import { execFile } from "node:child_process";
import type { CallbackManagerForLLMRun } from "@langchain/core/callbacks/manager";
import {
  SimpleChatModel,
  type BaseChatModelParams,
} from "@langchain/core/language_models/chat_models";
import { AIMessageChunk, type BaseMessage } from "@langchain/core/messages";
import { ChatGenerationChunk } from "@langchain/core/outputs";

export type ChatClaudeCLIFields = BaseChatModelParams & {
  /** Path to the `claude` binary. Defaults to `claude` on PATH. */
  binary?: string;
  /** Model alias/id passed to `--model`. Omit to use the CLI's session default. */
  model?: string;
  /** Hard cap (ms) on a single CLI call. */
  timeoutMs?: number;
};

/** Shape of `claude -p --output-format json`. Only the fields we read. */
type ClaudeCliJson = {
  is_error: boolean;
  result?: string;
  subtype?: string;
};

/**
 * A LangChain chat model that shells out to the local `claude` CLI in
 * non-interactive print mode. Auth rides on whatever the CLI is already
 * configured with (here: the Salesforce Bedrock gateway), so no API key is
 * needed. Text-only: it does not support tool-calling — that's why the agent
 * is built with no tools when this provider is active.
 *
 * The CLI is non-streaming (it returns the full reply at once), so streaming
 * is simulated: we fetch the text, then emit it in small chunks so the
 * agent's "messages" stream mode surfaces it to the UI.
 */
export class ChatClaudeCLI extends SimpleChatModel {
  binary: string;
  model?: string;
  timeoutMs: number;

  constructor(fields: ChatClaudeCLIFields = {}) {
    super(fields);
    this.binary = fields.binary ?? "claude";
    this.model = fields.model ?? process.env.CLAUDE_CLI_MODEL;
    this.timeoutMs = fields.timeoutMs ?? 55_000;
  }

  _llmType(): string {
    return "claude-cli";
  }

  // createAgent requires the model to expose bindTools, even when no tools are
  // bound. This provider can't call tools, so we accept and ignore them and
  // return the model unchanged (the agent runs ungrounded).
  bindTools(_tools: unknown[]): this {
    return this;
  }

  async _call(
    messages: BaseMessage[],
    _options: this["ParsedCallOptions"],
    _runManager?: CallbackManagerForLLMRun,
  ): Promise<string> {
    return this.fetchText(messages);
  }

  async *_streamResponseChunks(
    messages: BaseMessage[],
    _options: this["ParsedCallOptions"],
    runManager?: CallbackManagerForLLMRun,
  ): AsyncGenerator<ChatGenerationChunk> {
    const text = await this.fetchText(messages);
    // Emit in small slices so the response renders progressively rather than
    // as one blob. The CLI already produced the whole thing.
    for (let i = 0; i < text.length; i += 24) {
      const slice = text.slice(i, i + 24);
      await runManager?.handleLLMNewToken(slice);
      yield new ChatGenerationChunk({
        text: slice,
        message: new AIMessageChunk({ content: slice }),
      });
    }
  }

  /** Run the CLI once and return the assistant text. */
  private async fetchText(
    messages: BaseMessage[],
    signal?: AbortSignal,
  ): Promise<string> {
    // createAgent injects the persona as SystemMessage(s); keep them separate
    // from the dialogue so they go to --system-prompt, not the user turn.
    const system = messages
      .filter((m) => m.getType() === "system")
      .map(messageText)
      .join("\n\n")
      .trim();

    const transcript = messages
      .filter((m) => m.getType() !== "system")
      .map(
        (m) => `${m.getType() === "ai" ? "Assistant" : "User"}: ${messageText(m)}`,
      )
      .join("\n\n");

    const args = ["-p", "--output-format", "json"];
    if (this.model) args.push("--model", this.model);
    if (system) args.push("--system-prompt", system);

    const raw = await this.run(args, transcript, signal);

    let parsed: ClaudeCliJson;
    try {
      parsed = JSON.parse(raw) as ClaudeCliJson;
    } catch {
      throw new Error(
        `claude CLI returned non-JSON output: ${raw.slice(0, 500)}`,
      );
    }
    if (parsed.is_error) {
      throw new Error(
        `claude CLI error (${parsed.subtype ?? "unknown"}): ${parsed.result ?? raw.slice(0, 500)}`,
      );
    }
    return parsed.result ?? "";
  }

  /** Spawn the CLI, pipe the prompt via stdin, resolve stdout. */
  private run(
    args: string[],
    stdin: string,
    signal?: AbortSignal,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const child = execFile(
        this.binary,
        args,
        { timeout: this.timeoutMs, maxBuffer: 10 * 1024 * 1024, signal },
        (err, stdout, stderr) => {
          if (err) {
            reject(
              new Error(
                `claude CLI failed: ${err.message}${stderr ? `\n${stderr}` : ""}`,
              ),
            );
            return;
          }
          resolve(stdout);
        },
      );
      child.stdin?.end(stdin);
    });
  }
}

/** BaseMessage content can be a string or an array of content parts. */
function messageText(message: BaseMessage): string {
  const { content } = message;
  if (typeof content === "string") return content;
  return content
    .map((part) =>
      typeof part === "string"
        ? part
        : "text" in part && typeof part.text === "string"
          ? part.text
          : "",
    )
    .join("");
}
