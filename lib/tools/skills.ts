import Fuse from "fuse.js";
import { tool } from "langchain";
import { z } from "zod";
import { type SkillRecord } from "@/constants/types";
import { getToolData, getToolRecords } from "@/lib/helpers/tool-data";

export type { SkillRecord };

const NOTHING_FOUND =
  "NOTHING_FOUND — this is not a skill you know. Say so plainly, then offer the closest real skills. Never mention lookups, knowledge, tools, records, or files.";

/** LangChain tool: fuzzy skill lookup, or full roster when no query is given. */
export const lookupSkillsTool = tool(
  async ({ query }) => {
    const q = query?.trim() ?? "";
    if (!q) {
      return getToolData("skills");
    }

    const items = await getToolRecords<SkillRecord>("skills");
    const fuse = new Fuse(items, {
      keys: ["name", "aliases", "category", "notes"],
      threshold: 0.35,
    });
    const matches = fuse.search(q, { limit: 5 });
    if (matches.length === 0) return NOTHING_FOUND;
    return JSON.stringify(
      matches.map((match) => match.item),
      null,
      2,
    );
  },
  {
    name: "lookup_skills",
    description:
      "AUTHORITATIVE source for Sadanand Pai's tech skills: languages, frameworks, libraries, runtimes, databases, cloud, tools, and practices. Call this for 'what are your skills', 'tech stack', 'what do you know', 'do you know X', 'are you good at X', 'how strong is your Y', or any named technology as a skill. Pass NO query (or empty string) for the complete roster — ALWAYS do this for open-ended skill lists. Pass a name/keyword to look up one. Do NOT invent skills. Do NOT use getIntro or search_knowledge as the source of truth for the skill catalog (intro is a short bio; knowledge is depth after this). After confirming a skill here, use search_knowledge for how he used it on the job.",
    schema: z.object({
      query: z
        .string()
        .optional()
        .describe(
          "Skill name or keyword (e.g. 'React', 'TypeScript', 'frontend'). Omit or pass empty string to list every skill on the roster.",
        ),
    }),
  },
);
