import type { PatientEntry, Task, Urgency } from "../types";
import { generateId } from "../utils/id";

interface Rule {
  trigger: RegExp;
  source: string;
  tasks: Array<{
    text: string;
    urgency: Urgency;
  }>;
}

const RULES: Rule[] = [
  {
    trigger: /משתחרר|שחרור|לשחרר/,
    source: "משתחרר היום",
    tasks: [
      { text: "סיכום מחלה", urgency: "urgent" },
      { text: "מכתב שחרור", urgency: "urgent" },
      { text: "הסבר תרופות לשחרור", urgency: "routine" },
    ],
  },
  {
    trigger: /\bNPO\b/i,
    source: "NPO",
    tasks: [
      { text: "לוודא צום - ללא אוכל ושתייה", urgency: "urgent" },
      { text: "עירוי נוזלים", urgency: "urgent" },
    ],
  },
  {
    trigger: /ניתוח|טרום ניתוח|לפני ניתוח/,
    source: "טרום ניתוח",
    tasks: [
      { text: "בדיקות דם טרום ניתוח", urgency: "stat" },
      { text: "חתימת הסכמה לניתוח", urgency: "urgent" },
      { text: "התייעצות הרדמה", urgency: "urgent" },
    ],
  },
  {
    trigger: /עירוי דם|מנת דם|PRBCs?/i,
    source: "עירוי דם",
    tasks: [
      { text: "סוג ושתלב", urgency: "stat" },
      { text: "הכנת גישה ורידית", urgency: "urgent" },
      { text: "ניטור סימנים חיוניים כל 15 דק'", urgency: "stat" },
    ],
  },
  {
    trigger: /סוכרת|אינסולין|DM/i,
    source: "סוכרת",
    tasks: [
      { text: "מדידת סוכר לפני ארוחות", urgency: "morning" },
      { text: "בדיקת HbA1c אם חסר", urgency: "routine" },
    ],
  },
  {
    trigger: /נפילה|FALL/i,
    source: "סיכון נפילה",
    tasks: [
      { text: "מעקה מיטה מורם", urgency: "stat" },
      { text: "פעמון בהישג יד", urgency: "stat" },
    ],
  },
  {
    trigger: /\bBS\b|Bladder\s*Scan|בלדר\s*סקאן|סריקה\s*של\s*שלפוחית/i,
    source: "BS (Bladder Scan)",
    tasks: [{ text: "BS (Bladder Scan)", urgency: "routine" }],
  },

  {
    trigger: /בידוד|ISO|MRSA|VRE|ESBL/i,
    source: "בידוד",
    tasks: [
      { text: "שילוט בידוד על הדלת", urgency: "stat" },
      { text: "ציוד מגן אישי בכניסה", urgency: "stat" },
    ],
  },
  {
    trigger: /קטטר|catheter|פולי/i,
    source: "קטטר",
    tasks: [
      { text: "בדיקת צורך בהמשך קטטר", urgency: "morning" },
      { text: "תיעוד כמות שתן", urgency: "routine" },
    ],
  },
];

export function applyRules(patient: PatientEntry): Task[] {
  const generated: Task[] = [];
  const combined = [
    ...patient.status,
    ...patient.flags,
    patient.diagnosis ?? "",
  ].join(" ");

  for (const rule of RULES) {
    if (rule.trigger.test(combined)) {
      for (const taskDef of rule.tasks) {
        generated.push({
          id: generateId("gen-"),
          text: taskDef.text,
          urgency: taskDef.urgency,
          done: false,
          doneTime: null,
          time: null,
          confidence: 0.9,
          generatedFrom: rule.source,
        });
      }
    }
  }

  return generated;
}
