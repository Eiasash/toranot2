import type { Task } from "../types";

const URGENCY_STYLES: Record<string, { row: string; badge: string }> = {
  stat: {
    row: "border-red-200 bg-red-50/50",
    badge: "bg-red-100 text-red-700",
  },
  urgent: {
    row: "border-orange-200 bg-orange-50/50",
    badge: "bg-orange-100 text-orange-700",
  },
  morning: {
    row: "border-amber-200 bg-amber-50/30",
    badge: "bg-amber-100 text-amber-700",
  },
  routine: {
    row: "border-gray-200 bg-white",
    badge: "bg-gray-100 text-gray-600",
  },
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
  const style = URGENCY_STYLES[task.urgency] ?? URGENCY_STYLES.routine;

  return (
    <button
      onClick={onToggle}
      className={`
        flex items-center gap-2.5 w-full py-2 px-2.5 rounded border text-right
        transition-colors active:scale-[0.99]
        ${task.done ? "bg-gray-50 border-gray-100 opacity-50" : style.row}
      `}
    >
      <span
        className={`
          w-4 h-4 rounded-sm border-2 shrink-0 flex items-center justify-center
          ${task.done ? "bg-green-600 border-green-600" : "border-gray-300 bg-white"}
        `}
      >
        {task.done && (
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
            <path
              d="M2 6l3 3 5-5"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      <span
        dir="auto"
        className={`flex-1 text-sm leading-snug ${
          task.done ? "line-through text-gray-400" : "text-gray-800"
        }`}
      >
        {task.text}
      </span>
      {!task.done && (
        <span
          className={`text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 ${style.badge}`}
        >
          {URGENCY_LABEL[task.urgency]}
        </span>
      )}
      {task.time && (
        <span dir="ltr" className="text-[11px] font-mono text-gray-400 shrink-0">
          {task.time}
        </span>
      )}
    </button>
  );
}
