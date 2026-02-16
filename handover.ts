import type { PatientEntry, Task } from "../types";

function formatPatientLine(p: PatientEntry) {
  const room = p.room ?? "?";
  const name = p.name ?? "לא ידוע";
  const age = p.age != null ? ` (${p.age})` : "";
  return `${room} ${name}${age}`;
}

function openTasks(p: PatientEntry): Task[] {
  return [...p.tasks, ...p.generatedTasks].filter((t) => !t.done);
}

/**
 * Generate an end-of-shift handover summary.
 * Intentionally deterministic and simple.
 */
export function generateHandoverSummary(
  patients: PatientEntry[],
  sessionStartedAtISO: string,
) {
  const sessionStart = new Date(sessionStartedAtISO).getTime();

  const withOpen = patients
    .map((p) => ({ p, tasks: openTasks(p) }))
    .filter((x) => x.tasks.length > 0);

  const newAdmissions = patients.filter(
    (p) => new Date(p.createdAt).getTime() >= sessionStart,
  );

  const deteriorated = withOpen.filter((x) =>
    x.tasks.some((t) => t.urgency === "stat"),
  );

  const pendingConsults = withOpen.filter((x) =>
    x.tasks.some((t) => /ייעוץ|שיחה|consult/i.test(t.text)),
  );

  const lines: string[] = [];
  lines.push("סיכום העברה (Handover)");
  lines.push(`נוצר: ${new Date().toLocaleString()}`);
  lines.push("");

  if (withOpen.length === 0) {
    lines.push("אין משימות פתוחות.");
  } else {
    lines.push("מטופלים עם משימות פתוחות:");
    for (const { p, tasks } of withOpen) {
      lines.push(`- ${formatPatientLine(p)}`);
      for (const t of tasks) {
        const tag = t.urgency.toUpperCase();
        lines.push(`  • [${tag}] ${t.text}${t.source === "manual" ? " (manual)" : ""}`);
      }
    }
  }

  lines.push("");
  lines.push("חדשים במשמרת:");
  if (newAdmissions.length === 0) lines.push("- אין");
  else for (const p of newAdmissions) lines.push(`- ${formatPatientLine(p)}${p.diagnosis ? ` | ${p.diagnosis}` : ""}`);

  lines.push("");
  lines.push("דחופים (STAT פתוח):");
  if (deteriorated.length === 0) lines.push("- אין");
  else for (const { p } of deteriorated) lines.push(`- ${formatPatientLine(p)}`);

  lines.push("");
  lines.push("ייעוצים/שיחות פתוחים:");
  if (pendingConsults.length === 0) lines.push("- אין");
  else for (const { p } of pendingConsults) lines.push(`- ${formatPatientLine(p)}`);

  return lines.join("\n");
}
