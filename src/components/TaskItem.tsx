import type { Task } from "../types";

const URGENCY_COLORS: Record<string, string> = {
  stat: "bg-red-50 text-red-800 border-red-200",
  urgent: "bg-orange-50 text-orange-800 border-orange-200",
  morning: "bg-yellow-50 text-yellow-800 border-yellow-200",
  routine: "bg-green-50 text-green-800 border-green-200",
};

const URGENCY_LABEL: Record<string, string> = {
  stat: "סטט",
  urgent: "דחוף",
  morning: "בוקר",
  routine: "שגרה",
};

interface TaskItemProps {
  task: Task;
  onToggle: () => void;
}

export function TaskItem({ task, onToggle }: TaskItemProps) {
  const colorClass = URGENCY_COLORS[task.urgency] ?? URGENCY_COLORS.routine;

  return (
    <button
      onClick={onToggle}
      className={`
        flex items-center gap-3 w-full p-3 rounded-xl border text-right
        active:scale-[0.98] transition-transform
        ${colorClass} ${task.done ? "opacity-50" : ""}
      `}
    >
      <span className={`
        w-5 h-5 rounded-md border-2 shrink-0 flex items-center justify-center
        ${task.done ? "bg-blue-600 border-blue-600" : "border-gray-300 bg-white"}
      `}>
        {task.done && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </span>
      <span className={`flex-1 text-sm leading-snug ${task.done ? "line-through" : ""}`}>
        {task.text}
      </span>
      <span className="text-xs font-medium px-2 py-1 rounded-lg bg-white/60 shrink-0">
        {URGENCY_LABEL[task.urgency]}
      </span>
      {task.time && (
        <span className="text-xs font-mono shrink-0">{task.time}</span>
      )}
    </button>
  );
}
