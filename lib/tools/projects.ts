import Fuse from "fuse.js";
import { tool } from "langchain";
import { z } from "zod";
import { type ProjectRecord } from "@/constants/types";
import { getToolData, getToolRecords } from "@/lib/helpers/tool-data";

export type { ProjectRecord };

const NOTHING_FOUND =
  "NOTHING_FOUND — you don't recall an open-source project matching that name. Say you haven't built that / don't recall it by that name, then offer your closest related projects. Never mention lookups, knowledge, tools, or files.";

/** LangChain tool: list or fuzzy-lookup open-source projects. */
export const lookupProjectsTool = tool(
  async ({ query }) => {
    const q = query?.trim() ?? "";
    if (!q) {
      return getToolData("projects");
    }

    const items = await getToolRecords<ProjectRecord>("projects");
    const fuse = new Fuse(items, {
      keys: ["name", "aliases", "description", "tech", "highlights", "notes"],
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
    name: "lookup_projects",
    description:
      "AUTHORITATIVE source for Sadanand Pai's open-source / GitHub projects: names, repos, homepages, tech stacks, approx star counts, highlights, and short notes. Call this for 'your open source projects', 'GitHub projects', 'what have you built', 'tell me about X repo/project' (e.g. algo visualizers, JS code challenges, resume builder, frontend mini challenges, frontend learning kit). Pass an empty query to list all projects; pass a name/keyword to look up one. Do NOT use getIntro or search_knowledge for OSS project catalogs or project-specific facts covered here. For deep career-story context around how a project started (interviews that motivated it, company tenure timing), you may also use search_knowledge after this.",
    schema: z.object({
      query: z
        .string()
        .optional()
        .describe(
          "Project name or keyword (e.g. 'algo visualizers', 'resume builder'). Omit or pass empty string to list all open-source projects.",
        ),
    }),
  },
);
