import { generateUuid5 } from "weaviate-client";
import { chunkText } from "@/lib/helpers/chunk-text";
import {
  listKnowledgeObjects,
  resetKnowledgeCollection,
  type KnowledgeProperties,
} from "@/lib/helpers/weaviate";

const BATCH_SIZE = 10;
const CORPUS_SOURCE = "rag-ui";

export type IngestKnowledgeResult = {
  chunks: number;
  unchanged: boolean;
};

/** Rebuild the original corpus from stored chunks (undoes splitter overlap). */
export function stitchKnowledgeText(items: KnowledgeProperties[]): string {
  const sorted = [...items]
    .filter((item) => item.text.trim().length > 0)
    .sort((a, b) => a.chunkIndex - b.chunkIndex);

  if (sorted.length === 0) {
    return "";
  }

  let out = sorted[0].text;
  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i].text;
    const max = Math.min(out.length, next.length);
    let overlap = 0;
    for (let n = max; n > 0; n--) {
      if (out.endsWith(next.slice(0, n))) {
        overlap = n;
        break;
      }
    }
    out += overlap > 0 ? next.slice(overlap) : `\n\n${next}`;
  }
  return out;
}

export async function getKnowledgeCorpus(): Promise<string> {
  return stitchKnowledgeText(await listKnowledgeObjects());
}

export async function ingestKnowledgeCorpus(
  text: string,
): Promise<IngestKnowledgeResult> {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("Text is empty.");
  }

  const current = await getKnowledgeCorpus();
  if (current.trim() === trimmed) {
    return { chunks: 0, unchanged: true };
  }

  const chunks = await chunkText(trimmed, { source: CORPUS_SOURCE });
  if (chunks.length === 0) {
    throw new Error("No chunks produced.");
  }

  const knowledge = await resetKnowledgeCollection();

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    const inserted = await knowledge.data.insertMany(
      batch.map((chunk) => ({
        id: generateUuid5(chunk.id),
        properties: {
          text: chunk.text,
          source: chunk.metadata.source,
          chunkIndex: chunk.metadata.chunkIndex,
        },
      })),
    );

    if (inserted.hasErrors) {
      const messages = Object.values(inserted.errors)
        .map((err) => err.message)
        .join("; ");
      throw new Error(messages);
    }
  }

  return { chunks: chunks.length, unchanged: false };
}
