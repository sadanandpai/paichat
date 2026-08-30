export const TOOL_IDS = [
  "intro",
  "companies",
  "people",
  "projects",
  "skills",
  "knowledge",
] as const;

export type ToolId = (typeof TOOL_IDS)[number];

export type ToolDataMap = Record<ToolId, string>;

export type ToolFormat = "text" | "json";

export type ToolMeta = {
  id: ToolId;
  name: string;
  label: string;
  description: string;
  format: ToolFormat;
};

export const TOOL_CATALOG: ToolMeta[] = [
  {
    id: "intro",
    name: "getIntro",
    label: "Intro",
    description: "Bio, contact, hobbies, and public personal facts.",
    format: "text",
  },
  {
    id: "companies",
    name: "lookup_company",
    label: "Companies",
    description: "Employers, client sites, and interviews as a JSON array.",
    format: "json",
  },
  {
    id: "people",
    name: "lookup_person",
    label: "People",
    description: "Career network as a JSON array.",
    format: "json",
  },
  {
    id: "projects",
    name: "lookup_projects",
    label: "Projects",
    description: "Open-source projects as a JSON array.",
    format: "json",
  },
  {
    id: "skills",
    name: "lookup_skills",
    label: "Skills",
    description:
      "Tech skills as a JSON array of { name, aliases?, category?, level?, years?, notes? }.",
    format: "json",
  },
  {
    id: "knowledge",
    name: "search_knowledge",
    label: "Knowledge",
    description: "Long-form career corpus. Saved to Redis and indexed in Weaviate.",
    format: "text",
  },
];

export function isToolId(value: unknown): value is ToolId {
  return typeof value === "string" && TOOL_IDS.includes(value as ToolId);
}

export function getToolMeta(id: ToolId): ToolMeta {
  const meta = TOOL_CATALOG.find((tool) => tool.id === id);
  if (!meta) {
    throw new Error(`Unknown tool: ${id}`);
  }
  return meta;
}
