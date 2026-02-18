import { useState } from "react";
import type { PatientEntry, Task } from "../types";
import { usePatientsDispatch } from "../context/PatientsContext";
import { TaskItem } from "./TaskItem";
import { PatientEditModal } from "./PatientEditModal";

const FLAG_COLORS: Record<string, string> = {
  DNR: "bg-red-600 text-white",
  DNI: "bg-red-500 text-white",
  NPO: "bg-orange-500 text-white",
  FALL: "bg-purple-500 text-white",
  ISO: "bg-yellow-500 text-black",
  MRSA: "bg-pink-600 text-white",
  VRE: "bg-pink-500 text-white",
  ESBL: "bg-pink-400 text-white",
};

function FlagBadge({ flag }: { flag: string }) {
  const color = FLAG_COLORS[flag] ?? "bg-gray-500 text-white";
  return (
    <span dir="auto" className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${color}`}>
      {flag}
    </span>
  );
}

function sortTasks(tasks: Task[]) {
  const urgencyOrder = { stat: 0, urgent: 1, morning: 2, routine: 3 };
  return [...tasks].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    return (urgencyOrder[a.urgency] ?? 3) - (urgencyOrder[b.urgency] ?? 3);
  });
}

function TaskProgress({ done, total }: { done: number; total: number }) {
  if (total === 0) return null;
  const allDone = done === total;
  return (
    <span
      className={`text-sm font-bold tabular-nums shrink-0 ${
        allDone ? "text-green-600" : "text-blue-600"
      }`}
    >
      {done}/{total}
    </span>
  );
}

/* ─── Mobile Card ──────────────────────────────────────────── */

export function PatientCard({ patient }: { patient: PatientEntry }) {
  const dispatch = usePatientsDispatch();
  const [diagExpanded, setDiagExpanded] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const allTasks = sortTasks([...patient.tasks, ...patient.generatedTasks]);
  const doneCount = allTasks.filter((t) => t.done).length;
  const totalCount = allTasks.length;
  const isLongDiag = patient.diagnosis != null && patient.diagnosis.length > 80;

  return (
    <>
    {showEdit && <PatientEditModal patient={patient} onClose={() => setShowEdit(false)} />}

    <article className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header Row: Room | Name | Age | Edit | Progress */}
      <div className="flex items-center gap-2.5 px-3 py-2.5 border-b border-gray-100 bg-gray-50/60">
        {patient.room && (
          <span className="inline-flex items-center justify-center min-w-[2.25rem] h-7 px-1.5 rounded bg-blue-700 text-white text-xs font-bold font-mono shrink-0">
            {patient.room}
          </span>
        )}
        <span className="flex-1 min-w-0 font-semibold text-gray-900 truncate">
          {patient.name ?? "לא ידוע"}
        </span>
        {patient.age != null && (
          <span className="text-xs text-gray-500 bg-gray-200/70 rounded px-1.5 py-0.5 shrink-0 tabular-nums">
            {patient.age}
          </span>
        )}
        <button
          onClick={() => setShowEdit(true)}
          className="text-gray-300 active:text-blue-600 shrink-0 p-0.5"
          title="עריכה"
        >
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
        <TaskProgress done={doneCount} total={totalCount} />
      </div>

      <div className="px-3 py-2 space-y-2">
        {/* Flags Row */}
        {patient.flags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {patient.flags.map((flag) => (
              <FlagBadge key={flag} flag={flag} />
            ))}
          </div>
        )}

        {/* Diagnosis Block */}
        {patient.diagnosis && (
          <div>
            <p
              dir="auto"
              className={`text-sm text-gray-700 leading-relaxed whitespace-pre-line ${
                !diagExpanded ? "line-clamp-3" : ""
              }`}
            >
              {patient.diagnosis}
            </p>
            {isLongDiag && (
              <button
                onClick={() => setDiagExpanded(!diagExpanded)}
                className="text-xs text-blue-600 mt-0.5"
              >
                {diagExpanded ? "הצג פחות" : "הצג עוד"}
              </button>
            )}
          </div>
        )}

        {/* Status Row */}
        {patient.status.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {patient.status.map((s, i) => (
              <span
                key={i}
                dir="auto"
                className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded"
              >
                {s}
              </span>
            ))}
          </div>
        )}

        {/* Tasks */}
        {allTasks.length > 0 && (
          <div className="space-y-1.5 pt-0.5 pb-1">
            {allTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={() =>
                  dispatch({
                    type: "TOGGLE_TASK",
                    patientId: patient.id,
                    taskId: task.id,
                  })
                }
              />
            ))}
          </div>
        )}
      </div>
    </article>
    </>
  );
}

/* ─── Desktop Table Row ────────────────────────────────────── */

export function PatientRow({ patient }: { patient: PatientEntry }) {
  const dispatch = usePatientsDispatch();
  const [expanded, setExpanded] = useState(false);
  const allTasks = sortTasks([...patient.tasks, ...patient.generatedTasks]);
  const doneCount = allTasks.filter((t) => t.done).length;
  const totalCount = allTasks.length;
  const hasDetail = allTasks.length > 0 || patient.status.length > 0;

  return (
    <>
      <tr
        onClick={() => hasDetail && setExpanded(!expanded)}
        className={`
          border-b border-gray-100 transition-colors
          ${hasDetail ? "cursor-pointer" : ""}
          ${expanded ? "bg-blue-50/30" : hasDetail ? "hover:bg-gray-50" : ""}
        `}
      >
        <td className="py-2.5 px-4 font-mono font-bold text-blue-700 text-sm whitespace-nowrap">
          {patient.room ?? "—"}
        </td>
        <td className="py-2.5 px-4 font-semibold text-gray-900 text-sm whitespace-nowrap">
          {patient.name ?? "לא ידוע"}
        </td>
        <td className="py-2.5 px-4 text-gray-500 text-sm tabular-nums">
          {patient.age ?? "—"}
        </td>
        <td className="py-2.5 px-4 text-gray-600 text-sm max-w-xs truncate" dir="auto">
          {patient.diagnosis ?? "—"}
        </td>
        <td className="py-2.5 px-4">
          <div className="flex flex-wrap gap-1">
            {patient.flags.map((f) => (
              <FlagBadge key={f} flag={f} />
            ))}
          </div>
        </td>
        <td className="py-2.5 px-4 text-center">
          <TaskProgress done={doneCount} total={totalCount} />
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-gray-100 bg-gray-50/50">
          <td colSpan={6} className="px-8 py-3">
            <div className="space-y-3 max-w-3xl">
              {patient.status.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {patient.status.map((s, i) => (
                    <span
                      key={i}
                      dir="auto"
                      className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
              {patient.diagnosis && (
                <p dir="auto" className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                  {patient.diagnosis}
                </p>
              )}
              {allTasks.length > 0 && (
                <div className="space-y-1.5">
                  {allTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggle={() =>
                        dispatch({
                          type: "TOGGLE_TASK",
                          patientId: patient.id,
                          taskId: task.id,
                        })
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
