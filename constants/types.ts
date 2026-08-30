export type CompanyKind =
  /** Primary employment (FTE, contract via staffing firm as employer of record, etc.). */
  | "employer"
  /** Worked at this site/team while employed by a different parent company. */
  | "client"
  /** Interviewed and/or received an offer; did not work there as an employee. */
  | "interview";

export type CompanyRecord = {
  name: string;
  kind: CompanyKind;
  /** Approximate years or span, when known (e.g. "2013-2017", "~2.5 years"). */
  years?: string;
  role?: string;
  location?: string;
  /** Parent employer when kind is "client" (e.g. Infosys for Huawei). */
  parent?: string;
  /**
   * For interviews / offers: what happened.
   * Prefer short facts — deep round-by-round detail stays in search_knowledge.
   */
  outcome?: string;
  /** Chronological career order for employers/clients (1 = earliest). Interviews omit. */
  order?: number;
  notes?: string;
};

export type PersonRecord = {
  name: string;
  /** Individual names when the Name field lists several people. */
  aliases: string[];
  company?: string;
  relationship?: string;
  notes?: string;
};

export type ProjectRecord = {
  name: string;
  /** Alternate names / short names for fuzzy lookup. */
  aliases: string[];
  repo: string;
  homepage?: string;
  description: string;
  tech: string[];
  /** Approximate GitHub stars (static snapshot; not live). */
  starsApprox: number;
  highlights?: string;
  notes?: string;
};

export type SkillRecord = {
  name: string;
  /** Alternate names / short names for fuzzy lookup (e.g. "TS" for TypeScript). */
  aliases?: string[];
  /** Grouping label (e.g. "language", "framework", "cloud", "tool"). */
  category?: string;
  /** Self-assessed comfort (e.g. "expert", "proficient", "familiar"). */
  level?: string;
  /** Years using it, when known (e.g. "8+", "~3 years"). */
  years?: string;
  notes?: string;
};
