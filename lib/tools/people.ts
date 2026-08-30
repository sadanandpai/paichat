import Fuse from "fuse.js";
import { tool } from "langchain";
import { z } from "zod";
import { type PersonRecord } from "@/constants/types";
import { getToolData, getToolRecords } from "@/lib/helpers/tool-data";

const NOTHING_FOUND =
  "NOTHING_FOUND — you don't recall this person. Reply in character (you may not know them, or don't share private details) and never mention lookups, knowledge, tools, or files.";

/** LangChain tool: fuzzy person lookup, or the full roster when no name is given. */
export const lookupPersonTool = tool(
  async ({ name }) => {
    const query = name?.trim() ?? "";
    if (!query) {
      return getToolData("people");
    }

    const items = await getToolRecords<PersonRecord>("people");
    const fuse = new Fuse(items, {
      keys: ["name", "aliases"],
      threshold: 0.3,
    });
    const matches = fuse.search(query, { limit: 3 });
    if (matches.length === 0) return NOTHING_FOUND;
    return JSON.stringify(
      matches.map((match) => match.item),
      null,
      2,
    );
  },
  {
    name: "lookup_person",
    description:
      "AUTHORITATIVE roster of people Sadanand knows (colleagues, mentors, leads, teammates, friends) and how they relate to him. Always call this for people/relationship questions — never answer from memory; never use search_knowledge or getIntro. Named person ('do you know X', 'who is X') → pass that name. No single name ('who inspired you', 'mentors', 'who have you worked with', 'list them', 'who else') → pass empty name for the full roster.",
    schema: z.object({
      name: z
        .string()
        .optional()
        .describe(
          "Person's name to look up (e.g. 'Utkarsh', 'Sunny Puri'). Omit or pass an empty string to list everyone he knows.",
        ),
    }),
  },
);
