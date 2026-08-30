"use server";

import { connection } from "next/server";
import { requireAdmin } from "@/app/admin/guard";
import { ingestKnowledgeCorpus } from "@/lib/helpers/ingest-knowledge";
import {
  getAllToolData,
  getToolData,
  setToolData,
} from "@/lib/helpers/tool-data";
import { isToolId, type ToolDataMap } from "@/lib/tools/catalog";

export type LoadToolsResult =
  | { ok: true; data: ToolDataMap }
  | { ok: false; error: string };

export type LoadToolResult =
  | { ok: true; text: string }
  | { ok: false; error: string };

export type SaveToolResult =
  | { ok: true; chunks?: number; unchanged?: boolean }
  | { ok: false; error: string };

export async function loadTools(): Promise<LoadToolsResult> {
  await requireAdmin();
  await connection();
  try {
    return { ok: true, data: await getAllToolData() };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to load tools.",
    };
  }
}

export async function loadTool(id: unknown): Promise<LoadToolResult> {
  await requireAdmin();
  await connection();
  if (!isToolId(id)) {
    return { ok: false, error: "Unknown tool." };
  }

  try {
    return { ok: true, text: await getToolData(id) };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to load tool data.",
    };
  }
}

export async function saveTool(
  id: unknown,
  text: unknown,
): Promise<SaveToolResult> {
  await requireAdmin();
  if (!isToolId(id)) {
    return { ok: false, error: "Unknown tool." };
  }
  if (typeof text !== "string") {
    return { ok: false, error: "Text is required." };
  }

  try {
    await setToolData(id, text);
    if (id === "knowledge") {
      const result = await ingestKnowledgeCorpus(text);
      return { ok: true, ...result };
    }
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to save tool data.",
    };
  }
}
