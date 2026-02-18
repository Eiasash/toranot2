import { useState } from "react";
import type { PatientEntry, Urgency } from "../types";
import { usePatientsDispatch } from "../context/PatientsContext";

interface Props {
  patient: PatientEntry;
  onClose: () => void;
}

const URGENCY_OPTIONS: { value: Urgency; label: string; color: string }[] = [
  { value: "stat", label: "סטט", color: "bg-red-100 text-red-700 border-red-200" },
  { value: "urgent", label: "דחוף", color: "bg-orange-100 text-orange-700 border-orange-200" },
  { value: "morning", label: "בוקר", color: "bg-amber-100 text-amber-700 border-amber-200" },
  { value: "routine", label: "שגרה", color: "bg-gray-100 text-gray-600 border-gray-200" },
];

const FLAG_OPTS = ["DNR", "DNI", "NPO", "FALL", "ISO", "MRSA", "VRE", "ESBL", "CDIFF", "BIPAP", "CPAP"];

const FLAG_COLORS: Record<string, string> = {
  DNR: "bg-red-600 text-white", DNI: "bg-red-500 text-white", NPO: "bg-orange-500 text-white",
  FALL: "bg-purple-500 text-white", ISO: "bg-yellow-500 text-black",
  MRSA: "bg-pink-600 text-white", VRE: "bg-pink-500 text-white",
  ESBL: "bg-pink-400 text-white", CDIFF: "bg-yellow-600 text-white",
  BIPAP: "bg-blue-600 text-white", CPAP: "bg-blue-500 text-white",
};

export function PatientEditModal({ patient, onClose }: Props) {
  const dispatch = usePatientsDispatch();
  const [tab, setTab] = useState<"edit" | "tasks" | "notes">("edit");

  // Info
  const [name, setName] = useState(patient.name ?? "");
  const [room, setRoom] = useState(patient.room ?? "");
  const [age, setAge] = useState(patient.age != null ? String(patient.age) : "");
  const [diagnosis, setDiagnosis] = useState(patient.diagnosis ?? "");
  const [flags, setFlags] = useState<string[]>([...patient.flags]);

  // New task
  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskUrgency, setNewTaskUrgency] = useState<Urgency>("routine");

  // New note
  const [newNote, setNewNote] = useState("");

  const allTasks = [...patient.tasks, ...patient.generatedTasks];
  const doneTasks = allTasks.filter((t) => t.done).length;

  function saveInfo() {
    const parsedAge = parseInt(age, 10);
    dispatch({
      type: "EDIT_PATIENT",
      patientId: patient.id,
      patch: {
        name: name.trim() || null,
        room: room.trim() || null,
        age: !isNaN(parsedAge) && parsedAge > 0 ? parsedAge : null,
        diagnosis: diagnosis.trim() || null,
        flags,
      },
    });
  }

  function addTask() {
    if (!newTaskText.trim()) return;
    dispatch({ type: "ADD_TASK", patientId: patient.id, text: newTaskText.trim(), urgency: newTaskUrgency });
    setNewTaskText("");
  }

  function addNote() {
    if (!newNote.trim()) return;
    dispatch({ type: "ADD_NOTE", patientId: patient.id, note: newNote.trim() });
    setNewNote("");
  }

  function deleteTask(taskId: string) {
    dispatch({ type: "DELETE_TASK", patientId: patient.id, taskId });
  }

  function removeNote(idx: number) {
    const newStatus = patient.status.filter((_, i) => i !== idx);
    dispatch({ type: "EDIT_PATIENT", patientId: patient.id, patch: { status: newStatus } });
  }

  function handleDelete() {
    if (confirm(`למחוק את ${patient.name ?? "המטופל"}?`)) {
      dispatch({ type: "DELETE_PATIENT", patientId: patient.id });
      onClose();
    }
  }

  function toggleFlag(flag: string) {
    setFlags((prev) => prev.includes(flag) ? prev.filter((f) => f !== flag) : [...prev, flag]);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget) { saveInfo(); onClose(); } }}
    >
      <div className="w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div>
            <p dir="rtl" className="font-bold text-gray-900">{patient.name ?? "מטופל"}</p>
            <p className="text-xs text-gray-400">
              {[patient.room, patient.age ? `${patient.age} שנים` : null, patient.diagnosis].filter(Boolean).join(" · ")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleDelete} className="text-xs text-red-400 px-2 py-1 rounded-lg active:bg-red-50">מחק</button>
            <button
              onClick={() => { saveInfo(); onClose(); }}
              className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-lg active:bg-gray-200"
            >✕</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 bg-gray-50">
          <TabBtn label="✏️ עריכה" active={tab === "edit"} onClick={() => { saveInfo(); setTab("edit"); }} />
          <TabBtn label={`✅ משימות ${allTasks.length > 0 ? `${doneTasks}/${allTasks.length}` : ""}`} active={tab === "tasks"} onClick={() => { saveInfo(); setTab("tasks"); }} />
          <TabBtn label={`💬 הערות ${patient.status.length > 0 ? `(${patient.status.length})` : ""}`} active={tab === "notes"} onClick={() => { saveInfo(); setTab("notes"); }} />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {tab === "edit" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Fld label="חדר" value={room} onChange={setRoom} dir="ltr" />
                <Fld label="גיל" value={age} onChange={setAge} dir="ltr" type="number" />
              </div>
              <Fld label="שם מלא" value={name} onChange={setName} dir="rtl" />
              <Fld label="אבחנה" value={diagnosis} onChange={setDiagnosis} dir="auto" />
              <div>
                <label className="text-xs text-gray-500 block mb-1.5">דגלים</label>
                <div className="flex flex-wrap gap-1.5">
                  {FLAG_OPTS.map((f) => {
                    const active = flags.includes(f);
                    return (
                      <button
                        key={f}
                        onClick={() => toggleFlag(f)}
                        className={`text-xs font-bold px-2.5 py-1 rounded-md transition-all ${
                          active ? (FLAG_COLORS[f] ?? "bg-gray-600 text-white") : "bg-gray-100 text-gray-500 active:bg-gray-200"
                        }`}
                      >
                        {f}
                      </button>
                    );
                  })}
                </div>
              </div>
              <button
                onClick={() => { saveInfo(); onClose(); }}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium text-sm active:bg-blue-700"
              >
                שמור וסגור
              </button>
            </>
          )}

          {tab === "tasks" && (
            <>
              {/* Add task row */}
              <div className="flex gap-2">
                <input
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addTask()}
                  dir="auto"
                  placeholder="משימה חדשה..."
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                />
                <select
                  value={newTaskUrgency}
                  onChange={(e) => setNewTaskUrgency(e.target.value as Urgency)}
                  className="px-2 py-2 border border-gray-200 rounded-lg text-xs bg-white min-w-[60px]"
                >
                  {URGENCY_OPTIONS.map((u) => (
                    <option key={u.value} value={u.value}>{u.label}</option>
                  ))}
                </select>
                <button
                  onClick={addTask}
                  disabled={!newTaskText.trim()}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold disabled:opacity-40 active:bg-blue-700"
                >+</button>
              </div>

              {allTasks.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">אין משימות</p>
              ) : (
                <div className="space-y-1.5">
                  {[...allTasks].sort((a, b) => {
                    if (a.done !== b.done) return a.done ? 1 : -1;
                    const o: Record<string, number> = { stat: 0, urgent: 1, morning: 2, routine: 3 };
                    return (o[a.urgency] ?? 3) - (o[b.urgency] ?? 3);
                  }).map((task) => {
                    const uStyle = URGENCY_OPTIONS.find((u) => u.value === task.urgency);
                    return (
                      <div
                        key={task.id}
                        className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border text-sm ${
                          task.done ? "opacity-40 bg-gray-50 border-gray-100" : `border-gray-200`
                        }`}
                      >
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${uStyle?.color ?? ""}`}>
                          {uStyle?.label}
                        </span>
                        <span dir="auto" className={`flex-1 leading-snug ${task.done ? "line-through text-gray-400" : "text-gray-800"}`}>
                          {task.text}
                        </span>
                        {task.source === "generated" && (
                          <span className="text-[10px] text-purple-400 shrink-0">אוטו</span>
                        )}
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="w-6 h-6 flex items-center justify-center text-gray-300 active:text-red-500 shrink-0 text-base"
                        >✕</button>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {tab === "notes" && (
            <>
              <div className="flex gap-2">
                <input
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addNote()}
                  dir="auto"
                  placeholder="הערה קלינית..."
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                />
                <button
                  onClick={addNote}
                  disabled={!newNote.trim()}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold disabled:opacity-40 active:bg-blue-700"
                >+</button>
              </div>

              {patient.status.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">אין הערות</p>
              ) : (
                <div className="space-y-1.5">
                  {patient.status.map((s, i) => (
                    <div key={i} className="flex items-start gap-2 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                      <span dir="auto" className="flex-1 text-sm text-gray-700">{s}</span>
                      <button onClick={() => removeNote(i)} className="text-gray-300 active:text-red-500 shrink-0 text-base">✕</button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function TabBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-2.5 text-xs font-medium transition-colors whitespace-nowrap px-1 ${
        active ? "text-blue-600 border-b-2 border-blue-600 bg-white" : "text-gray-400"
      }`}
    >{label}</button>
  );
}

function Fld({ label, value, onChange, dir, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void;
  dir?: "rtl" | "ltr" | "auto"; type?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1" dir="rtl">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        dir={dir ?? "auto"}
        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-400 outline-none"
      />
    </div>
  );
}
