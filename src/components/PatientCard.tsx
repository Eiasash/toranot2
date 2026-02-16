import type { PatientEntry } from "../types";
import { usePatientsDispatch } from "../context/PatientsContext";
import { TaskItem } from "./TaskItem";

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
    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${color}`}>
      {flag}
    </span>
  );
}

// Sort tasks: stat first, then urgent, morning, routine. Undone before done.
function sortTasks(tasks: import("../types").Task[]) {
  const urgencyOrder = { stat: 0, urgent: 1, morning: 2, routine: 3 };
  return [...tasks].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    return (urgencyOrder[a.urgency] ?? 3) - (urgencyOrder[b.urgency] ?? 3);
  });
}

export function PatientCard({ patient }: { patient: PatientEntry }) {
  const dispatch = usePatientsDispatch();
  const allTasks = sortTasks([...patient.tasks, ...patient.generatedTasks]);

  const doneCount = allTasks.filter((t) => t.done).length;
  const totalCount = allTasks.length;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-3">
      {/* Header row */}
      <div className="flex items-start gap-3">
        {patient.room && (
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-600 text-white font-bold text-lg shrink-0">
            {patient.room}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900">
              {patient.name ?? "לא ידוע"}
            </span>
            {patient.age && (
              <span className="text-sm text-gray-500">{patient.age}</span>
            )}
            {patient.flags.map((flag) => (
              <FlagBadge key={flag} flag={flag} />
            ))}
          </div>
          {patient.diagnosis && (
            <p className="text-sm text-gray-600 mt-0.5">{patient.diagnosis}</p>
          )}
        </div>
        {totalCount > 0 && (
          <span className="text-xs text-gray-400 shrink-0">
            {doneCount}/{totalCount}
          </span>
        )}
      </div>

      {/* Status notes */}
      {patient.status.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {patient.status.map((s, i) => (
            <span
              key={i}
              className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded"
            >
              {s}
            </span>
          ))}
        </div>
      )}

      {/* Tasks */}
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
  );
}
