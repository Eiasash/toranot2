import { describe, it, expect } from "vitest";
import { parsePatientList } from "../parser/parsePatientList";

describe("rules engine - BS (Bladder Scan)", () => {
  it('"BS בערב" generates a BS (Bladder Scan) generated task', () => {
    const result = parsePatientList("101 כהן יוסף 72 | BS בערב");
    expect(result).toHaveLength(1);

    // The task text "BS בערב" triggers the BS rule via applyRules
    const genTasks = result[0].generatedTasks;
    const bsTask = genTasks.find((t) => t.text.includes("Bladder Scan"));
    expect(bsTask).toBeDefined();
    expect(bsTask!.generatedFrom).toBe("BS (Bladder Scan)");
    expect(bsTask!.source).toBe("generated");
  });

  it('"BS בערב" extracted task is categorized as procedure', () => {
    const result = parsePatientList("101 כהן יוסף 72 | BS בערב");
    const extractedTask = result[0].tasks.find((t) => t.text === "BS בערב");
    expect(extractedTask).toBeDefined();
    expect(extractedTask!.category).toBe("procedure");
  });

  it("BS is NOT confused with blood sugar/DM rule", () => {
    const result = parsePatientList("101 כהן יוסף 72 | BS בערב");
    const genTasks = result[0].generatedTasks;
    // Should NOT trigger the diabetes/sugar rule
    const sugarTask = genTasks.find(
      (t) => t.generatedFrom === "סוכרת",
    );
    expect(sugarTask).toBeUndefined();
  });
});
