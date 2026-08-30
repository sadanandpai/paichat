import Fuse from "fuse.js";
import { tool } from "langchain";
import { z } from "zod";
import { type CompanyRecord } from "@/constants/types";
import { getToolData, getToolRecords } from "@/lib/helpers/tool-data";

export type { CompanyRecord };

const NOTHING_FOUND =
  "NOTHING_FOUND — you did not work at this company and did not interview there. Say no plainly, then offer the closest real employer or interview. Never mention lookups, knowledge, tools, records, or files.";

/** LangChain tool: fuzzy company lookup, or full roster when no name is given. */
export const lookupCompanyTool = tool(
  async ({ name }) => {
    const query = name?.trim() ?? "";
    if (!query) {
      return getToolData("companies");
    }

    const items = await getToolRecords<CompanyRecord>("companies");
    const fuse = new Fuse(items, {
      keys: ["name"],
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
    name: "lookup_company",
    description:
      "AUTHORITATIVE source for companies tied to Sadanand's career: employers, client sites (e.g. Huawei via Infosys, Schneider via TekSystems), and places he only interviewed or got offers. Call this for 'where did you work', 'previous companies', 'career path', 'did you work at X', 'did you interview at X', 'have you been to X', or any named company as employer/interview. Pass NO name (or empty string) for the complete roster — ALWAYS do this for open-ended company lists. Pass a company name for one entry. Kind matters: 'interview' means he did NOT work there as an employee. After confirming a company here, use search_knowledge for deep tenure/interview-round detail. Do NOT invent employers. Do NOT use getIntro as the source of truth for employment history (intro is a short bio summary only). Do NOT use lookup_person for companies.",
    schema: z.object({
      name: z
        .string()
        .optional()
        .describe(
          "Company name to look up (e.g. 'CoinDCX', 'Flipkart', 'Schneider'). Omit or pass empty string to list every company on the roster.",
        ),
    }),
  },
);
