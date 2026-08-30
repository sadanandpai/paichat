import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

export type TextChunk = {
  /** Stable slug used to derive the Weaviate UUID. */
  id: string;
  text: string;
  metadata: {
    source: string;
    chunkIndex: number;
    chunks: number;
  };
};

export type ChunkTextOptions = {
  /** Soft max chars per chunk. */
  chunkSize?: number;
  /** Overlap so sentences aren't cut at retrieval time. */
  chunkOverlap?: number;
  source?: string;
};

export const DEFAULT_TEXT_CHUNK_SIZE = 1600;
export const DEFAULT_TEXT_CHUNK_OVERLAP = 200;

/**
 * Split long-form prose into RAG chunks.
 * Prefers paragraph → line → word boundaries via RecursiveCharacterTextSplitter.
 */
export async function chunkText(
  text: string,
  options: ChunkTextOptions = {},
): Promise<TextChunk[]> {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: options.chunkSize ?? DEFAULT_TEXT_CHUNK_SIZE,
    chunkOverlap: options.chunkOverlap ?? DEFAULT_TEXT_CHUNK_OVERLAP,
  });

  const parts = (await splitter.splitText(text.trim())).map((part) =>
    part.trim(),
  );
  const nonempty = parts.filter(Boolean);
  const source = options.source ?? "unknown";

  return nonempty.map((part, i) => ({
    id: `chunk-${String(i + 1).padStart(3, "0")}`,
    text: part,
    metadata: {
      source,
      chunkIndex: i + 1,
      chunks: nonempty.length,
    },
  }));
}
