import { describe, it, expect } from "vitest";
import { parsePatientList } from "../parser/parsePatientList";
import { mergeScan } from "../engine/mergeScan";
import type { PatientEntry, Task } from "../types";

function makeManualTask(text: string): Task {
  return {
    id: "manual-1",
    text,
    urgency: "routine",
    source: "manual",
    done: false,
    doneTime: null,
    time: null,
    confidence: 1,
  };
}

const SCAN_TEXT = `צד א
101 כהן יוסף 72 דלקת ריאות | בדיקת דם בבוקר
102 לוי שרה 65 אי ספיקת לב`;

describe("mergeScan", () => {
  it("importing the same scan twice does NOT duplicate patients", () => {
    const first = parsePatientList(SCAN_TEXT);
    expect(first).toHaveLength(2);

    const second = parsePatientList(SCAN_TEXT);
    const merged = mergeScan(first, second);

    expect(merged).toHaveLength(2);
    expect(merged[0].name).toBe("כהן יוסף");
    expect(merged[1].name).toBe("לוי שרה");
  });

  it("preserves stable patient id across rescans", () => {
    const first = parsePatientList(SCAN_TEXT);
    const originalId = first[0].id;

    const second = parsePatientList(SCAN_TEXT);
    const merged = mergeScan(first, second);

    expect(merged[0].id).toBe(originalId);
  });

  it("manual task persists after a rescan", () => {
    const first = parsePatientList(SCAN_TEXT);
    // Add a manual task to the first patient
    first[0].tasks.push(makeManualTask("בדוק לחץ דם"));

    const second = parsePatientList(SCAN_TEXT);
    const merged = mergeScan(first, second);

    const manualTasks = merged[0].tasks.filter((t) => t.source === "manual");
    expect(manualTasks).toHaveLength(1);
    expect(manualTasks[0].text).toBe("בדוק לחץ דם");
  });

  it("extracted task done-state persists after a rescan", () => {
    const first = parsePatientList(SCAN_TEXT);
    // Mark the extracted task as done
    const task = first[0].tasks.find((t) => t.source === "extracted");
    expect(task).toBeDefined();
    task!.done = true;
    task!.doneTime = "2024-01-01T12:00:00.000Z";

    const second = parsePatientList(SCAN_TEXT);
    const merged = mergeScan(first, second);

    const extractedTask = merged[0].tasks.find(
      (t) => t.source === "extracted" && t.text === task!.text,
    );
    expect(extractedTask).toBeDefined();
    expect(extractedTask!.done).toBe(true);
    expect(extractedTask!.doneTime).toBe("2024-01-01T12:00:00.000Z");
  });

  it("generated task done-state persists after a rescan", () => {
    const scanWithNPO = "101 כהן יוסף 72 NPO";
    const first = parsePatientList(scanWithNPO);
    expect(first[0].generatedTasks.length).toBeGreaterThan(0);

    // Mark first generated task as done
    first[0].generatedTasks[0].done = true;
    first[0].generatedTasks[0].doneTime = "2024-01-01T12:00:00.000Z";

    const second = parsePatientList(scanWithNPO);
    const merged = mergeScan(first, second);

    expect(merged[0].generatedTasks[0].done).toBe(true);
    expect(merged[0].generatedTasks[0].doneTime).toBe(
      "2024-01-01T12:00:00.000Z",
    );
  });

  it("keeps patients from other sections not in the new scan", () => {
    const firstScan = parsePatientList(`צד א
101 כהן יוסף 72`);

    const secondScan = parsePatientList(`צד ב
201 לוי שרה 65`);

    const merged = mergeScan(firstScan, secondScan);
    // Both should be present: side A patient kept, side B patient added
    expect(merged).toHaveLength(2);
    expect(merged.map((p) => p.name).sort()).toEqual(
      ["כהן יוסף", "לוי שרה"].sort(),
    );
  });
});
