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
  // ── Discharge ───────────────────────────────────────────────
  {
    trigger: /משתחרר|שחרור|לשחרר/,
    source: "משתחרר היום",
    tasks: [
      { text: "סיכום מחלה", urgency: "morning" },
      { text: "מכתב שחרור", urgency: "morning" },
      { text: "הסבר תרופות לשחרור למטופל/משפחה", urgency: "routine" },
      { text: "תיאום המשך טיפול (רופא משפחה / מרפאה)", urgency: "routine" },
    ],
  },

  // ── NPO / Fasting ────────────────────────────────────────────
  {
    trigger: /\bNPO\b/i,
    source: "NPO",
    tasks: [
      { text: "לוודא צום - ללא אוכל ושתייה", urgency: "stat" },
      { text: "עירוי נוזלים תחזוקה", urgency: "urgent" },
      { text: "עדכן צוות סיעוד על NPO", urgency: "stat" },
    ],
  },

  // ── Surgery / Pre-op ─────────────────────────────────────────
  {
    trigger: /ניתוח|טרום ניתוח|לפני ניתוח|pre.?op/i,
    source: "טרום ניתוח",
    tasks: [
      { text: "בדיקות דם טרום ניתוח (CBC, כימיה, קרישה)", urgency: "stat" },
      { text: "חתימת הסכמה לניתוח", urgency: "urgent" },
      { text: "התייעצות הרדמה", urgency: "urgent" },
      { text: "א.ק.ג טרום ניתוח", urgency: "urgent" },
      { text: "בדיקת אשלגן לפני ניתוח", urgency: "urgent" },
    ],
  },

  // ── Blood transfusion ─────────────────────────────────────────
  {
    trigger: /עירוי דם|מנת דם|PRBCs?/i,
    source: "עירוי דם",
    tasks: [
      { text: "סוג ושתלב (T&C)", urgency: "stat" },
      { text: "הכנת גישה ורידית", urgency: "urgent" },
      { text: "ניטור סימנים חיוניים כל 15 דק' בשעה הראשונה", urgency: "stat" },
      { text: "בדיקת Hb לאחר העירוי", urgency: "morning" },
    ],
  },

  // ── Diabetes ─────────────────────────────────────────────────
  {
    trigger: /סוכרת|אינסולין|DM\b/i,
    source: "סוכרת",
    tasks: [
      { text: "מדידת סוכר לפני 3 ארוחות ולפני שינה", urgency: "morning" },
      { text: "בדיקת HbA1c אם חסר", urgency: "routine" },
      { text: "בדיקת כפות רגליים", urgency: "routine" },
    ],
  },

  // ── Fall risk ─────────────────────────────────────────────────
  {
    trigger: /נפילה|FALL/i,
    source: "סיכון נפילה",
    tasks: [
      { text: "מעקה מיטה מורם", urgency: "stat" },
      { text: "פעמון בהישג יד", urgency: "stat" },
      { text: "הצמדת שטיח אנטי-סליפ", urgency: "urgent" },
      { text: "סקירת תרופות המגבירות סיכון נפילה", urgency: "morning" },
    ],
  },

  // ── Bladder Scan ─────────────────────────────────────────────
  {
    trigger: /\bBS\b|Bladder\s*Scan|בלדר\s*סקאן|סריקה\s*של\s*שלפוחית/i,
    source: "BS (Bladder Scan)",
    tasks: [{ text: "BS (Bladder Scan)", urgency: "routine" }],
  },

  // ── Isolation ─────────────────────────────────────────────────
  {
    trigger: /בידוד|ISO|MRSA|VRE|ESBL|C\.?\s?DIFF/i,
    source: "בידוד",
    tasks: [
      { text: "שילוט בידוד על הדלת", urgency: "stat" },
      { text: "ציוד מגן אישי בכניסה (כפפות, חלוק)", urgency: "stat" },
      { text: "הנחיית צוות וביקור משפחה על נהלי בידוד", urgency: "urgent" },
    ],
  },

  // ── Catheter ─────────────────────────────────────────────────
  {
    trigger: /קטטר|catheter|פולי/i,
    source: "קטטר",
    tasks: [
      { text: "בדיקת צורך בהמשך קטטר (הסרה מוקדמת אם אפשר)", urgency: "morning" },
      { text: "תיעוד כמות שתן בטבלת I&O", urgency: "routine" },
    ],
  },

  // ── AKI / Renal ───────────────────────────────────────────────
  {
    trigger: /AKI|אי ספיקת כליות|כשל כלייתי|קריאטינין|creatinine/i,
    source: "AKI",
    tasks: [
      { text: "מעקב קריאטינין ואלקטרוליטים יומי", urgency: "morning" },
      { text: "הסרת תרופות נפרוטוקסיות (NSAIDs, אמינוגליקוזידים)", urgency: "urgent" },
      { text: "מדידת I&O מדויקת", urgency: "urgent" },
      { text: "שקילת מטופל יומית", urgency: "morning" },
      { text: "בדיקת אשלגן דחופה", urgency: "urgent" },
    ],
  },

  // ── Contrast / Imaging ────────────────────────────────────────
  {
    trigger: /חומר ניגוד|CT עם חומר|contrast/i,
    source: "חומר ניגוד",
    tasks: [
      { text: "בדיקת קריאטינין לפני מתן חומר ניגוד", urgency: "urgent" },
      { text: "הידרציה IV לפני ואחרי (אם כליות לא תקינות)", urgency: "urgent" },
      { text: "הפסקת מטפורמין 48 שעות", urgency: "urgent" },
      { text: "בדיקת קריאטינין 48 שעות לאחר חומר ניגוד", urgency: "routine" },
    ],
  },

  // ── Delirium ─────────────────────────────────────────────────
  {
    trigger: /דליריום|בלבול|אי שקט|אגיטציה|delirium|encephalopathy/i,
    source: "דליריום",
    tasks: [
      { text: "CAM score - הערכת דליריום", urgency: "urgent" },
      { text: "בדיקת סיבה: זיהום, תרופות, כאב, שתן", urgency: "urgent" },
      { text: "הפחתת תרופות אנטיכולינרגיות ובנזו", urgency: "urgent" },
      { text: "הימנעות מקשירה - ניסיון מוגבר", urgency: "urgent" },
      { text: "ריאוריינטציה: אור טבעי, שעון, פעילות", urgency: "routine" },
      { text: "בדיקת שמיעה וראייה (עזרים זמינים?)", urgency: "routine" },
    ],
  },

  // ── Pressure ulcer ───────────────────────────────────────────
  {
    trigger: /פצע לחץ|eschar|decubitus|פצע עריסה|כיב לחץ/i,
    source: "פצע לחץ",
    tasks: [
      { text: "הפניה לאחות פצעים", urgency: "urgent" },
      { text: "החלפת תנוחה כל 2 שעות", urgency: "urgent" },
      { text: "מזרן למניעת פצעי לחץ", urgency: "urgent" },
      { text: "הערכת תזונה - התייעצות דיאטנית", urgency: "morning" },
    ],
  },

  // ── DVT / Anticoag ───────────────────────────────────────────
  {
    trigger: /DVT|פקק דם|קרישיות|LMWH|קלקסן|anticoag|anticoagul|נוגד קרישה/i,
    source: "קרישיות",
    tasks: [
      { text: "בדיקת CBC + קואגולציה", urgency: "morning" },
      { text: "וידוא מינון LMWH מותאם לכליות (eGFR)", urgency: "urgent" },
      { text: "הנחיות למניעת DVT: גרביים, מוביליזציה", urgency: "morning" },
    ],
  },

  // ── Heart failure ────────────────────────────────────────────
  {
    trigger: /אי ספיקת לב|CHF|heart failure|קוצר נשימה|dyspnea|edema|בצקת/i,
    source: "אי ספיקת לב",
    tasks: [
      { text: "שקילה יומית ותיעוד", urgency: "morning" },
      { text: "מדידת I&O יומית", urgency: "morning" },
      { text: "בדיקת אלקטרוליטים (K, Mg) בגלל משתנים", urgency: "morning" },
      { text: "בדיקת קריאטינין (תחת פוראסמיד)", urgency: "morning" },
    ],
  },

  // ── Pneumonia / Infection ────────────────────────────────────
  {
    trigger: /דלקת ריאות|pneumonia|זיהום|sepsis|ספסיס|חום|fever/i,
    source: "זיהום",
    tasks: [
      { text: "תרבית דם לפני אנטיביוטיקה (אם עדיין לא)", urgency: "stat" },
      { text: "בדיקת CRP + WBC + PCT", urgency: "morning" },
      { text: "ניטור חום כל 4 שעות", urgency: "urgent" },
      { text: "בדיקת תרבית שתן אם חום ללא מקור", urgency: "urgent" },
    ],
  },

  // ── Stroke / Neuro ───────────────────────────────────────────
  {
    trigger: /שבץ|stroke|CVA|TIA|נוירולוגי/i,
    source: "שבץ",
    tasks: [
      { text: "הערכת בליעה לפני אכילה/שתייה", urgency: "urgent" },
      { text: "מניעת נפילה - ניטור מוגבר", urgency: "urgent" },
      { text: "א.ק.ג לזיהוי AF", urgency: "urgent" },
      { text: "ייעוץ קלינאי תקשורת", urgency: "morning" },
    ],
  },

  // ── Malnutrition / PEG / NGT ─────────────────────────────────
  {
    trigger: /תת תזונה|malnutrition|NGT|PEG|זונדה|הזנה|בליעה/i,
    source: "תזונה",
    tasks: [
      { text: "הפניה לדיאטנית קלינית", urgency: "morning" },
      { text: "הערכת בליעה (אם רלוונטי)", urgency: "urgent" },
      { text: "מדידת משקל שבועית", urgency: "routine" },
      { text: "בדיקת albumin + prealbumin", urgency: "routine" },
    ],
  },

  // ── Hyperkalemia ─────────────────────────────────────────────
  {
    trigger: /היפרקלמיה|hyperkalemia|אשלגן גבוה/i,
    source: "היפרקלמיה",
    tasks: [
      { text: "א.ק.ג דחוף", urgency: "stat" },
      { text: "בדיקת אשלגן חוזרת", urgency: "stat" },
      { text: "Calcium gluconate IV אם שינויים ב-ECG", urgency: "stat" },
      { text: "הפסקת ACE/ARB ו-K-sparers", urgency: "urgent" },
    ],
  },

  // ── Hyponatremia ─────────────────────────────────────────────
  {
    trigger: /היפונתרמיה|hyponatremia|נתרן נמוך/i,
    source: "היפונתרמיה",
    tasks: [
      { text: "הגבלת נוזלים (אם SIADH)", urgency: "urgent" },
      { text: "מעקב נתרן כל 6-8 שעות", urgency: "urgent" },
      { text: "בדיקת אוסמולריות שתן ודם", urgency: "urgent" },
    ],
  },

  // ── Hypoglycemia ─────────────────────────────────────────────
  {
    trigger: /היפוגליקמיה|hypoglycemia|סוכר נמוך/i,
    source: "היפוגליקמיה",
    tasks: [
      { text: "מדידת סוכר כל שעה עד יציבות", urgency: "stat" },
      { text: "D50 IV אם אין גישה ורידית - גלוקגון IM", urgency: "stat" },
      { text: "בדיקת סיבה: מינון אינסולין, NPO, כליות", urgency: "urgent" },
    ],
  },

  // ── Antibiotic IV ────────────────────────────────────────────
  {
    trigger: /מרופנם|meropenem|פיפרציל|tazobactam|ונקומיצין|vancomycin|אנטיביוטיקה IV/i,
    source: "אנטיביוטיקה IV",
    tasks: [
      { text: "וידוא גישה ורידית תקינה", urgency: "urgent" },
      { text: "בדיקת רמות vancomycin אם רלוונטי", urgency: "morning" },
      { text: "בדיקת קריאטינין תחת טיפול נפרוטוקסי", urgency: "morning" },
    ],
  },

  // ── DNR / DNI ─────────────────────────────────────────────────
  {
    trigger: /\bDNR\b|\bDNI\b/,
    source: "DNR/DNI",
    tasks: [
      { text: "וידוא טופס DNR חתום בתיק", urgency: "urgent" },
      { text: "עדכון צוות סיעוד על הנחיות DNR/DNI", urgency: "urgent" },
    ],
  },

  // ── Warfarin / INR ────────────────────────────────────────────
  {
    trigger: /וורפרין|warfarin|coumadin|INR/i,
    source: "וורפרין",
    tasks: [
      { text: "בדיקת INR יומי עד טווח טיפולי", urgency: "morning" },
      { text: "התאמת מינון לפי INR", urgency: "morning" },
    ],
  },

  // ── Potassium replacement ─────────────────────────────────────
  {
    trigger: /אשלגן נמוך|היפוקלמיה|hypokalemia|תיקון אשלגן/i,
    source: "היפוקלמיה",
    tasks: [
      { text: "מתן אשלגן PO/IV לפי פרוטוקול", urgency: "urgent" },
      { text: "מעקב אשלגן כל 4-6 שעות", urgency: "urgent" },
      { text: "א.ק.ג אם K < 3.0", urgency: "urgent" },
    ],
  },

  // ── Physiotherapy / Rehab ────────────────────────────────────
  {
    trigger: /פיזיותרפיה|ריפוי בעיסוק|שיקום|mobilize|מוביליזציה/i,
    source: "שיקום",
    tasks: [
      { text: "הפניה לפיזיותרפיה", urgency: "morning" },
      { text: "הפניה לריפוי בעיסוק", urgency: "routine" },
      { text: "יעד: מוביליזציה מוקדמת פעמיים ביום", urgency: "morning" },
    ],
  },

  // ── Social work ──────────────────────────────────────────────
  {
    trigger: /עובד סוציאלי|social work|הסתגלות|בית אבות|מוסד/i,
    source: "עובד סוציאלי",
    tasks: [
      { text: "הפניה לעובד סוציאלי", urgency: "morning" },
      { text: "שיחת משפחה על תכנית שחרור", urgency: "routine" },
    ],
  },

  // ── Pain management ──────────────────────────────────────────
  {
    trigger: /כאב חזק|כאב בלתי נשלט|NRS [789]|VAS [789]|pain control/i,
    source: "ניהול כאב",
    tasks: [
      { text: "הערכת כאב NRS כל 4 שעות", urgency: "urgent" },
      { text: "ייעוץ רפואת כאב", urgency: "morning" },
      { text: "בדיקת טיפול נוכחי ואופטימיזציה", urgency: "urgent" },
    ],
  },

  // ── Dementia ─────────────────────────────────────────────────
  {
    trigger: /דמנציה|אלצהיימר|dementia|alzheimer|ירידה קוגניטיבית/i,
    source: "דמנציה",
    tasks: [
      { text: "הערכת מצב קוגניטיבי (MMSE/MoCA בהתאם)", urgency: "routine" },
      { text: "מניעת דליריום: ריאוריינטציה, אור, שגרה", urgency: "morning" },
      { text: "מניעת נפילה - ניטור מוגבר", urgency: "urgent" },
    ],
  },

  // ── Osteoporosis / Hip fracture ──────────────────────────────
  {
    trigger: /שבר ירך|hip fracture|אוסטאופורוזיס|osteoporosis/i,
    source: "שבר ירך / אוסטאופורוזיס",
    tasks: [
      { text: "וידוא מתן ויטמין D + סידן", urgency: "morning" },
      { text: "הפניה לאורתופד אם נדרש", urgency: "urgent" },
      { text: "מניעת DVT: LMWH + גרביים", urgency: "urgent" },
    ],
  },
];

export function applyRules(patient: PatientEntry): Task[] {
  const generated: Task[] = [];
  const combined = [
    ...patient.status,
    ...patient.flags,
    patient.diagnosis ?? "",
    ...patient.tasks.map((t) => t.text),
  ].join(" ");

  for (const rule of RULES) {
    if (rule.trigger.test(combined)) {
      for (const taskDef of rule.tasks) {
        generated.push({
          id: generateId("gen-"),
          text: taskDef.text,
          urgency: taskDef.urgency,
          source: "generated",
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
