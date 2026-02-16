// Single source of truth for your top-level navigation sections.
// "Rehab" is NOT a filter. It's its own section.

export const SECTIONS = ["SIDE_A", "SIDE_B", "SIDE_C", "REHAB"] as const;
export type Section = (typeof SECTIONS)[number];

export const SECTION_LABEL: Record<Section, string> = {
  SIDE_A: "צד א",
  SIDE_B: "צד ב",
  SIDE_C: "צד ג",
  REHAB: "שיקום",
};

export type Urgency = "stat" | "urgent" | "morning" | "routine";

// Keep categories small and practical (execution-focused).
export type TaskCategory =
  | "labs"
  | "imaging"
  | "meds"
  | "consult"
  | "procedure"
  | "discharge"
  | "other";

export type Task = {
  id: string;
  text: string; // exact text as written
  urgency: Urgency;
  category?: TaskCategory; // optional: allow parser/LLM to fill, otherwise omit
  done: boolean;
  doneTime: string | null; // ISO string or null
  time: string | null; // "16:30" if present, else null
  confidence: number; // 0..1
  generatedFrom?: string; // e.g., "משתחרר היום"
};

export type PatientEntry = {
  id: string; // stable key (room+name hash)
  section: Section; // SIDE_A / SIDE_B / SIDE_C / REHAB
  date: string; // "DD/MM/YYYY" (as written on the sheet, when available)
  room: string | null;
  name: string | null;
  age: number | null;
  diagnosis: string | null;

  // Flags are intentionally free-form strings: you may see "DNI/DNR", "MRSA", etc.
  flags: string[];
  status: string[]; // informational notes (not actionable)
  tasks: Task[]; // explicit actionable tasks
  generatedTasks: Task[]; // rule-engine tasks created from status triggers

  scannedAt: string; // ISO string
  confidence: number; // 0..1 overall row confidence
};

// Map Hebrew header text -> Section
export function detectSectionFromHeader(headerText: string): Section | null {
  const t = headerText.replace(/\s+/g, "");
  if (t.includes("צדא")) return "SIDE_A";
  if (t.includes("צדב")) return "SIDE_B";
  if (t.includes("צדג")) return "SIDE_C";
  if (t.includes("שיקום")) return "REHAB";
  return null;
}
