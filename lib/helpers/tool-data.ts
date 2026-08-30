import { getRedis } from "@/lib/helpers/redis";
import { getKnowledgeCorpus } from "@/lib/helpers/ingest-knowledge";
import {
  getToolMeta,
  TOOL_IDS,
  type ToolDataMap,
  type ToolId,
} from "@/lib/tools/catalog";

/** Process-local tool payloads. Data is static; refresh only on setToolData. */
const cache = new Map<ToolId, string>();

function redisKey(id: ToolId): string {
  return `tool:${id}`;
}

function asText(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
}

export async function getToolData(id: ToolId): Promise<string> {
  const hit = cache.get(id);
  if (hit !== undefined) return hit;

  const stored = asText(await getRedis().get(redisKey(id)));
  if (stored != null) {
    cache.set(id, stored);
    return stored;
  }

  if (id === "knowledge") {
    try {
      const corpus = await getKnowledgeCorpus();
      cache.set(id, corpus);
      return corpus;
    } catch {
      return "";
    }
  }

  cache.set(id, "");
  return "";
}

export async function getAllToolData(): Promise<ToolDataMap> {
  const entries = await Promise.all(
    TOOL_IDS.map(async (id) => [id, await getToolData(id)] as const),
  );
  return Object.fromEntries(entries) as ToolDataMap;
}

export function validateToolText(id: ToolId, text: string): string | null {
  if (!text.trim()) return "Text is empty.";

  const { format } = getToolMeta(id);
  if (format !== "json") return null;

  try {
    const parsed: unknown = JSON.parse(text);
    if (!Array.isArray(parsed)) return "Expected a JSON array.";
  } catch {
    return "Invalid JSON.";
  }
  return null;
}

export async function setToolData(id: ToolId, text: string): Promise<void> {
  const error = validateToolText(id, text);
  if (error) throw new Error(error);
  await getRedis().set(redisKey(id), text);
  cache.set(id, text);
}

export async function getToolRecords<T>(id: ToolId): Promise<T[]> {
  const raw = await getToolData(id);
  if (!raw.trim()) return [];

  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error(`Tool "${id}" is not a JSON array.`);
  }
  return parsed as T[];
}
