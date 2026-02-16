import { PatientEntry, Section, detectSectionFromHeader } from "../types";
import { generateId } from "../utils/id";
import { applyRules } from "../engine/rules";

/**
 * Parse a pasted Hebrew patient list into PatientEntry objects.
 *
 * Expected format (flexible):
 *   צד א
 *   101 כהן יוסף 72 דלקת ריאות DNR NPO | משתחרר היום | בדיקת דם בבוקר
 *   102 לוי שרה 65 אי ספיקת לב | מוניטור רציף
 *   צד ב
 *   ...
 *
 * Each patient line: room name age? diagnosis? flags? | status/tasks
 */

const FLAG_PATTERN = /\b(DNR|DNI|NPO|FALL|ISO|MRSA|VRE|ESBL|C\.?\s?DIFF)\b/gi;
const URGENCY_MARKERS: Record<string, import("../types").Urgency> = {
  "דחוף": "stat",
  "סטט": "stat",
  STAT: "stat",
  "דחוף!": "stat",
  "אורגנטי": "urgent",
  "בוקר": "morning",
  "שגרה": "routine",
};

const TIME_PATTERN = /\b(\d{1,2}:\d{2})\b/;

function detectUrgency(text: string): import("../types").Urgency {
  const lower = text.toLowerCase();
  for (const [marker, urgency] of Object.entries(URGENCY_MARKERS)) {
    if (lower.includes(marker.toLowerCase()) || text.includes(marker)) {
      return urgency;
    }
  }
  return "routine";
}

function extractTime(text: string): string | null {
  const match = text.match(TIME_PATTERN);
  return match ? match[1] : null;
}

function extractFlags(text: string): { flags: string[]; cleaned: string } {
  const flags: string[] = [];
  const cleaned = text.replace(FLAG_PATTERN, (match) => {
    flags.push(match.toUpperCase().replace(/\s/g, ""));
    return "";
  });
  return { flags, cleaned: cleaned.trim() };
}

function parseAge(token: string): number | null {
  const n = parseInt(token, 10);
  return !isNaN(n) && n > 0 && n < 150 ? n : null;
}

function isSectionHeader(line: string): Section | null {
  return detectSectionFromHeader(line);
}

function parsePatientLine(
  line: string,
  section: Section,
  date: string,
): PatientEntry | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length < 3) return null;

  // Split by | to separate segments: main info | status/tasks
  const segments = trimmed.split("|").map((s) => s.trim());
  const mainPart = segments[0];
  const extraParts = segments.slice(1);

  // Extract flags from the main part
  const { flags, cleaned } = extractFlags(mainPart);

  // Tokenize the cleaned main part
  const tokens = cleaned.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return null;

  // First token: room number (if it looks like a number or room code)
  let room: string | null = null;
  let idx = 0;
  if (/^\d{1,4}[א-ת]?$/.test(tokens[0])) {
    room = tokens[0];
    idx = 1;
  }

  // Collect name tokens (Hebrew characters)
  const nameTokens: string[] = [];
  while (idx < tokens.length && /^[א-ת\-']+$/.test(tokens[idx])) {
    nameTokens.push(tokens[idx]);
    idx++;
  }
  const name = nameTokens.length > 0 ? nameTokens.join(" ") : null;

  // Next token: age?
  let age: number | null = null;
  if (idx < tokens.length) {
    age = parseAge(tokens[idx]);
    if (age !== null) idx++;
  }

  // Remaining tokens in main part = diagnosis
  const diagTokens = tokens.slice(idx);
  const diagnosis = diagTokens.length > 0 ? diagTokens.join(" ") : null;

  // Parse extra segments into status and tasks
  const status: string[] = [];
  const tasks: import("../types").Task[] = [];

  for (const part of extraParts) {
    if (!part) continue;
    // Heuristic: if it contains an action verb or time, treat as task
    const isTask =
      /בדיק|תור |לתת |להזמין|לבצע|למדוד|לשלוח|טיפול|ניקוז|עירוי|צילום|א\.?ק\.?ג/i.test(
        part,
      );
    if (isTask) {
      tasks.push({
        id: generateId("task-"),
        text: part,
        urgency: detectUrgency(part),
        done: false,
        doneTime: null,
        time: extractTime(part),
        confidence: 0.8,
      });
    } else {
      status.push(part);
    }
  }

  // Also extract any extra flags from extra parts
  for (const part of extraParts) {
    const { flags: extraFlags } = extractFlags(part);
    flags.push(...extraFlags);
  }

  const confidence =
    (room ? 0.25 : 0) +
    (name ? 0.35 : 0) +
    (age ? 0.1 : 0) +
    (diagnosis ? 0.2 : 0) +
    0.1;

  const entry: PatientEntry = {
    id: generateId("pt-"),
    section,
    date,
    room,
    name,
    age,
    diagnosis,
    flags: [...new Set(flags)],
    status,
    tasks,
    generatedTasks: [],
    scannedAt: new Date().toISOString(),
    confidence: Math.min(confidence, 1),
  };

  // Apply rule engine
  entry.generatedTasks = applyRules(entry);

  return entry;
}

export function parsePatientList(text: string): PatientEntry[] {
  const lines = text.split("\n");
  const patients: PatientEntry[] = [];
  let currentSection: Section = "SIDE_A";
  const today = new Date();
  const date = `${String(today.getDate()).padStart(2, "0")}/${String(today.getMonth() + 1).padStart(2, "0")}/${today.getFullYear()}`;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check if this is a section header
    const section = isSectionHeader(trimmed);
    if (section) {
      currentSection = section;
      continue;
    }

    // Try to parse as patient line
    const patient = parsePatientLine(trimmed, currentSection, date);
    if (patient) {
      patients.push(patient);
    }
  }

  return patients;
}
