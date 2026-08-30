import { tool } from "langchain";
import { z } from "zod";
import { searchKnowledge } from "@/lib/helpers/weaviate";

export type RetrievedChunk = {
  id: string;
  score: number;
  text: string;
  metadata: Record<string, unknown>;
};

const NOTHING_FOUND =
  "NOTHING_FOUND — you don't recall this. Named fact → you haven't done it. Story/walkthrough → you don't remember one in that detail. Then offer the closest real thing. Never mention lookups, knowledge, stored data, or this chat as a limit.";

const GROUNDING_RULES = `These are the closest fragments of your memory. They are matched by similarity, so they are often only loosely related and may have NOTHING to do with the question.

Before answering, check the fragments for the exact thing being asked about — the specific company, employer, interview, person, project, event, or number.
- If it is NOT named in the fragments below, it did NOT happen to you. Say no / that you haven't / that you don't recall, then offer what you did do.
- Similar things are not the same thing. Fragments about interviewing at one company are NOT evidence that you interviewed at a different company.
- Never generalize a fragment into a claim it does not state. Never invent details to sound consistent.`;

/**
 * Floor for obvious non-matches. Deliberately low: similarity alone cannot separate
 * "interview at Microsoft" (~0.76, not in the corpus) from "how did you learn CSS"
 * (~0.68, in the corpus). Grounding rules below do that work instead.
 */
const MIN_SCORE = Number(process.env.RAG_MIN_SCORE ?? 0.25);

/** Hybrid search in Weaviate Cloud → readable chunks. */
export async function retrieveKnowledge(
  query: string,
  topK = 5,
): Promise<RetrievedChunk[]> {
  const hits = await searchKnowledge(query, topK);

  return hits
    .filter((hit) => hit.text.length > 0 && hit.score >= MIN_SCORE)
    .map((hit) => ({
      id: hit.id,
      score: hit.score,
      text: hit.text,
      metadata: { source: hit.source, chunkIndex: hit.chunkIndex },
    }));
}

export function formatChunks(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) {
    return NOTHING_FOUND;
  }

  const body = chunks
    .map(
      (chunk, i) =>
        `[${i + 1}] (id=${chunk.id}, score=${chunk.score.toFixed(3)})\n${chunk.text}`,
    )
    .join("\n\n");

  return `${GROUNDING_RULES}\n\n---\n\n${body}`;
}

/** LangChain tool: agent calls this for RAG lookup. */
export const searchKnowledgeTool = tool(
  async ({ query, topK }) => {
    const chunks = await retrieveKnowledge(query, topK);
    return formatChunks(chunks);
  },
  {
    name: "search_knowledge",
    description:
      "Look up DEEP details about Sadanand Pai's career story and technical work: interview rounds/format, day-to-day work at an employer, accomplishments, opinions shaped by his work, what he is focusing on now, career direction, how he used a skill on the job. ALWAYS call this for 'where do you see yourself in 5 years', career goals, what's next, or interview-style future questions — then only speak to directions present in the fragments (do not invent a title or a 5-year plan). ALWAYS call this when a company is named alongside anything beyond the bare fact of employment — rounds, teams, products built, how he left. First confirm the company via lookup_company when the ask is 'did you work/interview at X' or when listing employers; this tool is for depth after that, not the authoritative yes/no roster. Current title/seniority → also getIntro. Pure bio (location, contact/socials, hobbies, games) → getIntro. Employer list / 'where did you work' / bare 'did you work at X' → lookup_company. People → lookup_person. OSS project catalogs → lookup_projects. Skill catalog / 'do you know X' / tech stack → lookup_skills (this tool is fine as follow-up for how a skill was used).",
    schema: z.object({
      query: z
        .string()
        .describe(
          "What to look up about yourself; concise keywords or a short question",
        ),
      topK: z
        .number()
        .int()
        .min(1)
        .max(5)
        .optional()
        .default(5)
        .describe("How many chunks to retrieve"),
    }),
  },
);
