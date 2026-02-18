import { useState } from "react";
import { usePatientsState } from "../context/PatientsContext";
import { SECTION_LABEL, SECTIONS, type Section } from "../types";

interface HandoverExportProps {
  onClose: () => void;
}

function buildHandoverText(patients: ReturnType<typeof usePatientsState>["patients"], sections: Section[]): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString("he-IL", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" });
  const timeStr = now.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });

  const lines: string[] = [];
  lines.push(`🏥 *מסירת משמרת — ${dateStr} ${timeStr}*`);
  lines.push("");

  let totalTasks = 0, doneTasks = 0;

  for (const section of sections) {
    const sectionPts = patients.filter((p) => p.section === section);
    if (sectionPts.length === 0) continue;

    lines.push(`*── ${SECTION_LABEL[section]} (${sectionPts.length} חולים) ──*`);

    for (const pt of sectionPts) {
      const allTasks = [...pt.tasks, ...pt.generatedTasks];
      const pending = allTasks.filter((t) => !t.done);
      const done = allTasks.filter((t) => t.done);
      totalTasks += allTasks.length;
      doneTasks += done.length;

      const flagStr = pt.flags.length > 0 ? ` [${pt.flags.join(" ")}]` : "";
      const header = `🔸 *${pt.room ?? "?"} ${pt.name ?? "לא ידוע"}* ${pt.age ? `${pt.age}ש` : ""}${flagStr}`;
      lines.push(header);

      if (pt.diagnosis) {
        lines.push(`   📋 ${pt.diagnosis}`);
      }

      if (pt.status.length > 0) {
        lines.push(`   💬 ${pt.status.join(" | ")}`);
      }

      // Stat/urgent tasks first
      const statTasks = pending.filter((t) => t.urgency === "stat" || t.urgency === "urgent");
      const otherTasks = pending.filter((t) => t.urgency !== "stat" && t.urgency !== "urgent");

      for (const t of statTasks) {
        const urgLabel = t.urgency === "stat" ? "🔴" : "🟠";
        lines.push(`   ${urgLabel} ${t.text}`);
      }
      for (const t of otherTasks) {
        const urgLabel = t.urgency === "morning" ? "🟡" : "⚪";
        lines.push(`   ${urgLabel} ${t.text}`);
      }

      if (done.length > 0) {
        lines.push(`   ✅ ${done.length} משימות הושלמו`);
      }

      lines.push("");
    }
  }

  // Summary
  lines.push(`*📊 סיכום: ${patients.length} חולים | ${doneTasks}/${totalTasks} משימות הושלמו*`);
  return lines.join("\n");
}

export function HandoverExport({ onClose }: HandoverExportProps) {
  const { patients } = usePatientsState();
  const [selectedSections, setSelectedSections] = useState<Section[]>([...SECTIONS]);
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState<"pending" | "all">("pending");

  // Filter patients based on mode
  const filteredPatients = mode === "pending"
    ? patients.filter((p) => {
        const allTasks = [...p.tasks, ...p.generatedTasks];
        return allTasks.some((t) => !t.done);
      })
    : patients;

  const text = buildHandoverText(filteredPatients, selectedSections);

  function toggleSection(s: Section) {
    setSelectedSections((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  async function copyText() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback: select text in textarea
    }
  }

  function shareWhatsApp() {
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, "_blank");
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">📤 מסירת משמרת</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center active:bg-gray-200">✕</button>
        </div>

        {/* Options */}
        <div className="px-4 py-3 border-b border-gray-100 space-y-3">
          {/* Mode toggle */}
          <div>
            <p className="text-xs text-gray-500 mb-1.5">מה לכלול:</p>
            <div className="flex gap-2">
              <ModeBtn active={mode === "pending"} onClick={() => setMode("pending")} label="חולים עם משימות פתוחות" />
              <ModeBtn active={mode === "all"} onClick={() => setMode("all")} label="כל החולים" />
            </div>
          </div>

          {/* Section filter */}
          <div>
            <p className="text-xs text-gray-500 mb-1.5">מחלקות:</p>
            <div className="flex flex-wrap gap-1.5">
              {SECTIONS.map((s) => {
                const count = patients.filter((p) => p.section === s).length;
                const active = selectedSections.includes(s);
                return (
                  <button
                    key={s}
                    onClick={() => toggleSection(s)}
                    className={`text-xs font-medium px-2.5 py-1 rounded-md transition-colors ${
                      active ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {SECTION_LABEL[s]} {count > 0 && `(${count})`}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="flex-1 overflow-y-auto p-4">
          <textarea
            readOnly
            value={text}
            dir="rtl"
            rows={12}
            className="w-full p-3 border border-gray-200 rounded-xl text-xs font-mono leading-relaxed resize-none bg-gray-50 text-gray-700 focus:outline-none"
          />
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-100 flex gap-2">
          <button
            onClick={copyText}
            className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${
              copied ? "bg-green-600 text-white" : "bg-gray-100 text-gray-700 active:bg-gray-200"
            }`}
          >
            {copied ? "✅ הועתק!" : "📋 העתק"}
          </button>
          <button
            onClick={shareWhatsApp}
            className="flex-1 py-3 bg-[#25D366] text-white rounded-xl text-sm font-medium active:opacity-90"
          >
            📱 WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}

function ModeBtn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-colors border ${
        active ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-white text-gray-500 border-gray-200 active:bg-gray-50"
      }`}
    >
      {label}
    </button>
  );
}
