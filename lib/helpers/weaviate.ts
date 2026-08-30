import weaviate, {
  dataType,
  vectors,
  type WeaviateClient,
} from "weaviate-client";

export const KNOWLEDGE_COLLECTION = "Knowledge";

export type KnowledgeProperties = {
  text: string;
  source: string;
  chunkIndex: number;
};

export type KnowledgeHit = {
  id: string;
  score: number;
  text: string;
  source: string;
  chunkIndex: number;
};

let client: WeaviateClient | undefined;

/** Connect to Weaviate Cloud. Reuses one client per process. */
export async function connectWeaviate(): Promise<WeaviateClient> {
  if (client) return client;

  const url = process.env.WEAVIATE_URL;
  const apiKey = process.env.WEAVIATE_API_KEY ?? process.env.WEAVIATE_ADMIN_KEY;
  if (!url || !apiKey) {
    throw new Error("Missing env: WEAVIATE_URL or WEAVIATE_API_KEY");
  }

  client = await weaviate.connectToWeaviateCloud(url, {
    authCredentials: new weaviate.ApiKey(apiKey),
  });
  return client;
}

export async function closeWeaviate() {
  if (!client) {
    return;
  }
  await client.close();
  client = undefined;
}

export async function getKnowledgeCollection() {
  const weaviateClient = await connectWeaviate();
  return weaviateClient.collections.get<KnowledgeProperties>(
    KNOWLEDGE_COLLECTION,
  );
}

/** Create Knowledge with Weaviate-hosted embeddings if missing. */
export async function ensureKnowledgeCollection() {
  const weaviateClient = await connectWeaviate();
  if (await weaviateClient.collections.exists(KNOWLEDGE_COLLECTION)) {
    return getKnowledgeCollection();
  }

  return weaviateClient.collections.create<KnowledgeProperties>({
    name: KNOWLEDGE_COLLECTION,
    vectorizers: vectors.text2VecWeaviate({
      sourceProperties: ["text"],
    }),
    properties: [
      { name: "text", dataType: dataType.TEXT, indexSearchable: true },
      {
        name: "source",
        dataType: dataType.TEXT,
        skipVectorization: true,
        indexSearchable: false,
      },
      {
        name: "chunkIndex",
        dataType: dataType.INT,
        skipVectorization: true,
      },
    ],
  });
}

/** All Knowledge objects, used to rebuild the corpus in the /rag UI. */
export async function listKnowledgeObjects(): Promise<KnowledgeProperties[]> {
  const weaviateClient = await connectWeaviate();
  if (!(await weaviateClient.collections.exists(KNOWLEDGE_COLLECTION))) {
    return [];
  }

  const knowledge = await getKnowledgeCollection();
  const items: KnowledgeProperties[] = [];
  for await (const obj of knowledge.iterator({
    returnProperties: ["text", "source", "chunkIndex"],
  })) {
    items.push({
      text: obj.properties.text ?? "",
      source: obj.properties.source ?? "",
      chunkIndex: obj.properties.chunkIndex ?? 0,
    });
  }
  return items;
}

/** Drop + recreate so a full ingest is idempotent. */
export async function resetKnowledgeCollection() {
  const weaviateClient = await connectWeaviate();
  if (await weaviateClient.collections.exists(KNOWLEDGE_COLLECTION)) {
    await weaviateClient.collections.delete(KNOWLEDGE_COLLECTION);
  }
  return ensureKnowledgeCollection();
}

/** 0 = BM25 only, 1 = vector only. Default 0.5 */
const HYBRID_ALPHA = Number(process.env.RAG_HYBRID_ALPHA ?? 0.5);

/** Hybrid search: Weaviate embeds the query + BM25 on `text`. */
export async function searchKnowledge(
  query: string,
  topK = 5,
): Promise<KnowledgeHit[]> {
  const knowledge = await getKnowledgeCollection();
  const { objects } = await knowledge.query.hybrid(query, {
    limit: topK,
    alpha: Number.isFinite(HYBRID_ALPHA) ? HYBRID_ALPHA : 0.5,
    queryProperties: ["text"],
    returnMetadata: ["score"],
    returnProperties: ["text", "source", "chunkIndex"],
  });

  return objects.map((obj) => ({
    id: obj.uuid,
    score: obj.metadata?.score ?? 0,
    text: obj.properties.text ?? "",
    source: obj.properties.source ?? "",
    chunkIndex: obj.properties.chunkIndex ?? 0,
  }));
}
