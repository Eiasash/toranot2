import type { PatientEntry, Task } from "../types";
import { buildPatientKey, buildPatientLooseKey } from "../utils/patientKey";

function sameTask(a: Task, b: Task): boolean {
  return a.text.trim() === b.text.trim() && (a.source === b.source || a.source === "extracted" || b.source === "extracted");
}

function mergeTaskState(oldTask: Task, newTask: Task): Task {
  // Preserve completion state across re-scans.
  return {
    ...newTask,
    done: oldTask.done,
    doneTime: oldTask.doneTime,
  };
}

function mergePatient(oldP: PatientEntry, newP: PatientEntry): PatientEntry {
  const now = new Date().toISOString();

  // Merge extracted tasks: keep done state
  const mergedExtracted: Task[] = newP.tasks.map((nt) => {
    const match = oldP.tasks.find((ot) => sameTask(ot, nt));
    return match ? mergeTaskState(match, nt) : nt;
  });

  // Keep manual tasks from old that are not present in the new extracted list
  const manualKeep = oldP.tasks.filter(
    (t) => t.source === "manual" && !mergedExtracted.some((nt) => sameTask(nt, t)),
  );

  // Merge generated tasks: preserve done state
  const mergedGenerated: Task[] = newP.generatedTasks.map((nt) => {
    const match = oldP.generatedTasks.find((ot) => sameTask(ot, nt));
    return match ? mergeTaskState(match, nt) : nt;
  });

  return {
    ...newP,
    id: oldP.id, // stable
    createdAt: oldP.createdAt,
    updatedAt: now,
    scanCount: (oldP.scanCount ?? 1) + 1,
    scannedAt: newP.scannedAt,
    tasks: [...mergedExtracted, ...manualKeep],
    generatedTasks: mergedGenerated,
  };
}

/**
 * Merge a newly parsed scan into existing state.
 *
 * Guarantees:
 * - No duplicate patients (stable key)
 * - Preserves manual tasks
 * - Preserves done state for extracted + generated tasks
 * - Detects transfers between sections (same room+name)
 */
export function mergeScan(existing: PatientEntry[], incoming: PatientEntry[]) {
  const existingByStrict = new Map<string, PatientEntry>();
  const existingByLoose = new Map<string, PatientEntry>();

  for (const p of existing) {
    existingByStrict.set(buildPatientKey(p.section, p.room, p.name), p);
    existingByLoose.set(buildPatientLooseKey(p.room, p.name), p);
  }

  const consumed = new Set<string>();
  const merged: PatientEntry[] = [];

  for (const np of incoming) {
    const strictKey = buildPatientKey(np.section, np.room, np.name);
    const looseKey = buildPatientLooseKey(np.room, np.name);

    const matchStrict = existingByStrict.get(strictKey);
    const matchLoose = existingByLoose.get(looseKey);
    const match = matchStrict ?? matchLoose;

    if (!match) {
      merged.push(np);
      continue;
    }

    consumed.add(buildPatientKey(match.section, match.room, match.name));
    merged.push(mergePatient(match, np));
  }

  // Keep patients that weren't mentioned in the new scan (other sections / not scanned now)
  for (const p of existing) {
    const key = buildPatientKey(p.section, p.room, p.name);
    if (!consumed.has(key)) merged.push(p);
  }

  return merged;
}
