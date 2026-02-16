import { describe, it, expect } from "vitest";
import { parsePatientList } from "../parser/parsePatientList";

describe("parsePatientList", () => {
  describe("room parsing", () => {
    it('recognizes room "49-3" (hyphen format)', () => {
      const result = parsePatientList("49-3 כהן יוסף 72");
      expect(result).toHaveLength(1);
      expect(result[0].room).toBe("49-3");
      expect(result[0].name).toBe("כהן יוסף");
    });

    it('recognizes room "55/1" (slash format)', () => {
      const result = parsePatientList("55/1 לוי שרה 65");
      expect(result).toHaveLength(1);
      expect(result[0].room).toBe("55/1");
    });

    it('recognizes room "58/3"', () => {
      const result = parsePatientList("58/3 אברהם דוד 80");
      expect(result).toHaveLength(1);
      expect(result[0].room).toBe("58/3");
    });

    it('recognizes room "ניטור-1" (Hebrew monitor room with hyphen)', () => {
      const result = parsePatientList("ניטור-1 כהן דני 55");
      expect(result).toHaveLength(1);
      expect(result[0].room).toBe("ניטור-1");
      expect(result[0].name).toBe("כהן דני");
    });

    it('recognizes room "ניטור 1" (Hebrew monitor room with space)', () => {
      const result = parsePatientList("ניטור 1 כהן דני 55");
      expect(result).toHaveLength(1);
      expect(result[0].room).toBe("ניטור 1");
      expect(result[0].name).toBe("כהן דני");
    });

    it("recognizes plain numeric rooms like 101", () => {
      const result = parsePatientList("101 כהן יוסף 72");
      expect(result).toHaveLength(1);
      expect(result[0].room).toBe("101");
    });
  });

  describe("section headers", () => {
    it("assigns correct sections from Hebrew headers", () => {
      const text = `צד א
101 כהן יוסף 72
צד ב
201 לוי שרה 65`;
      const result = parsePatientList(text);
      expect(result).toHaveLength(2);
      expect(result[0].section).toBe("SIDE_A");
      expect(result[1].section).toBe("SIDE_B");
    });
  });

  describe("task extraction", () => {
    it("extracts tasks with source='extracted'", () => {
      const result = parsePatientList("101 כהן יוסף 72 | בדיקת דם בבוקר");
      expect(result).toHaveLength(1);
      expect(result[0].tasks).toHaveLength(1);
      expect(result[0].tasks[0].source).toBe("extracted");
      expect(result[0].tasks[0].text).toBe("בדיקת דם בבוקר");
    });

    it('recognizes "BS בערב" as a task', () => {
      const result = parsePatientList("101 כהן יוסף 72 | BS בערב");
      expect(result).toHaveLength(1);
      expect(result[0].tasks).toHaveLength(1);
      expect(result[0].tasks[0].text).toBe("BS בערב");
      expect(result[0].tasks[0].category).toBe("procedure");
      expect(result[0].tasks[0].source).toBe("extracted");
    });

    it("generated tasks have source='generated'", () => {
      const result = parsePatientList("101 כהן יוסף 72 NPO");
      expect(result).toHaveLength(1);
      expect(result[0].generatedTasks.length).toBeGreaterThan(0);
      for (const t of result[0].generatedTasks) {
        expect(t.source).toBe("generated");
      }
    });
  });
});
