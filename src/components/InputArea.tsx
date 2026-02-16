import { useState } from "react";
import { usePatientsDispatch } from "../context/PatientsContext";

const PLACEHOLDER = `הדביקו רשימת חולים כאן, לדוגמה:

צד א
101 כהן יוסף 72 דלקת ריאות DNR | משתחרר היום | בדיקת דם בבוקר
102 לוי שרה 65 אי ספיקת לב NPO | ניתוח מחר | א.ק.ג דחוף
103 אברהם דוד 80 שבר ירך FALL | טרום ניתוח

צד ב
201 חיים רבקה 55 סוכרת | מדידת סוכר
202 מזרחי יעקב 70 דלקת בידוד MRSA | עירוי אנטיביוטיקה

שיקום
301 בן דוד מרים 68 שבץ מוחי | פיזיותרפיה | ריפוי בעיסוק`;

export function InputArea() {
  const [text, setText] = useState("");
  const [isOpen, setIsOpen] = useState(true);
  const dispatch = usePatientsDispatch();

  function handleImport() {
    if (!text.trim()) return;
    dispatch({ type: "IMPORT_TEXT", text });
    setText("");
    setIsOpen(false);
  }

  function handleClear() {
    dispatch({ type: "CLEAR_ALL" });
    setText("");
    setIsOpen(true);
  }

  if (!isOpen) {
    return (
      <div className="flex gap-2 px-4 py-2">
        <button
          onClick={() => setIsOpen(true)}
          className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer"
        >
          + הוסף חולים
        </button>
        <button
          onClick={handleClear}
          className="text-sm text-red-500 hover:text-red-700 cursor-pointer"
        >
          נקה הכל
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={PLACEHOLDER}
        dir="rtl"
        rows={10}
        className="w-full p-3 border border-gray-300 rounded-lg text-sm font-mono resize-y focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none"
      />
      <div className="flex gap-2">
        <button
          onClick={handleImport}
          disabled={!text.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          ייבוא רשימה
        </button>
        <button
          onClick={() => {
            setText("");
            setIsOpen(false);
          }}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 cursor-pointer"
        >
          ביטול
        </button>
      </div>
    </div>
  );
}
