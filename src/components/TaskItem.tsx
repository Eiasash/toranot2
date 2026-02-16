import type { Task } from "../types";

const URGENCY_COLORS: Record<string, string> = {
  stat: "bg-red-100 text-red-800 border-red-300",
  urgent: "bg-orange-100 text-orange-800 border-orange-300",
  morning: "bg-yellow-100 text-yellow-800 border-yellow-300",
  routine: "bg-green-100 text-green-800 border-green-300",
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
    <div
      className={`flex items-center gap-2 p-2 rounded border ${colorClass} ${task.done ? "opacity-50" : ""}`}
    >
      <input
        type="checkbox"
        checked={task.done}
        onChange={onToggle}
        className="w-4 h-4 shrink-0 cursor-pointer"
      />
      <span className={`flex-1 text-sm ${task.done ? "line-through" : ""}`}>
        {task.text}
      </span>
      <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-white/50">
        {URGENCY_LABEL[task.urgency]}
      </span>
      {task.time && (
        <span className="text-xs font-mono">{task.time}</span>
      )}
      {task.generatedFrom && (
        <span className="text-xs italic opacity-70">
          ← {task.generatedFrom}
        </span>
      )}
    </div>
  );
}
