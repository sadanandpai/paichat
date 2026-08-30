import { tool } from "langchain";
import { z } from "zod";
import { getToolData } from "@/lib/helpers/tool-data";

/** LangChain tool: personal intro for "about me" style asks. */
export const getIntroTool = tool(
  async () => {
    return getToolData("intro");
  },
  {
    name: "getIntro",
    description:
      "AUTHORITATIVE source for Sadanand Pai's bio/overview facts: current role title and seniority, total years of experience, where he lives, nicknames, social media and contact links. Call this for 'who are you', 'introduce yourself', 'tell me about yourself', current title/role/level, years of experience, contact/socials, location. Do NOT use for any depth questions about career, interviews, or company details",
    schema: z.object({}),
  },
);
