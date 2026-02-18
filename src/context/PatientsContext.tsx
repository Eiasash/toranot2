import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  type ReactNode,
  type Dispatch,
} from "react";
import type { PatientEntry, Section, Task, Urgency } from "../types";
import { parsePatientList } from "../parser/parsePatientList";
import { mergeScan } from "../engine/mergeScan";
import { generateId } from "../utils/id";

// State
interface PatientsState {
  patients: PatientEntry[];
  activeSection: Section;
}

function loadSavedPatients(): PatientEntry[] {
  try {
    const raw = localStorage.getItem("toranot-patients");
    return raw ? (JSON.parse(raw) as PatientEntry[]) : [];
  } catch {
    return [];
  }
}

const initialState: PatientsState = {
  patients: loadSavedPatients(),
  activeSection: "SIDE_A",
};

// Actions
type Action =
  | { type: "IMPORT_TEXT"; text: string }
  | { type: "SET_SECTION"; section: Section }
  | { type: "TOGGLE_TASK"; patientId: string; taskId: string }
  | { type: "ADD_TASK"; patientId: string; text: string; urgency?: Urgency }
  | { type: "DELETE_TASK"; patientId: string; taskId: string }
  | { type: "EDIT_PATIENT"; patientId: string; patch: Partial<Pick<PatientEntry, "name" | "room" | "age" | "diagnosis" | "flags" | "status">> }
  | { type: "ADD_NOTE"; patientId: string; note: string }
  | { type: "DELETE_PATIENT"; patientId: string }
  | { type: "CLEAR_ALL" };

export type { Action };

function toggleTaskInList(tasks: Task[], taskId: string): Task[] {
  return tasks.map((t) =>
    t.id === taskId
      ? {
          ...t,
          done: !t.done,
          doneTime: !t.done ? new Date().toISOString() : null,
        }
      : t,
  );
}

function reducer(state: PatientsState, action: Action): PatientsState {
  switch (action.type) {
    case "IMPORT_TEXT": {
      const parsed = parsePatientList(action.text);
      return { ...state, patients: mergeScan(state.patients, parsed) };
    }
    case "SET_SECTION":
      return { ...state, activeSection: action.section };
    case "TOGGLE_TASK":
      return {
        ...state,
        patients: state.patients.map((p) =>
          p.id === action.patientId
            ? {
                ...p,
                tasks: toggleTaskInList(p.tasks, action.taskId),
                generatedTasks: toggleTaskInList(
                  p.generatedTasks,
                  action.taskId,
                ),
              }
            : p,
        ),
      };
    case "ADD_TASK":
      return {
        ...state,
        patients: state.patients.map((p) =>
          p.id === action.patientId
            ? {
                ...p,
                tasks: [
                  ...p.tasks,
                  {
                    id: generateId("manual-"),
                    text: action.text,
                    urgency: action.urgency ?? "routine",
                    source: "manual",
                    done: false,
                    doneTime: null,
                    time: null,
                    confidence: 1,
                  },
                ],
              }
            : p,
        ),
      };
    case "DELETE_TASK":
      return {
        ...state,
        patients: state.patients.map((p) =>
          p.id === action.patientId
            ? {
                ...p,
                tasks: p.tasks.filter((t) => t.id !== action.taskId),
                generatedTasks: p.generatedTasks.filter((t) => t.id !== action.taskId),
              }
            : p,
        ),
      };
    case "EDIT_PATIENT":
      return {
        ...state,
        patients: state.patients.map((p) =>
          p.id === action.patientId ? { ...p, ...action.patch } : p,
        ),
      };
    case "ADD_NOTE":
      return {
        ...state,
        patients: state.patients.map((p) =>
          p.id === action.patientId
            ? { ...p, status: [...p.status, action.note] }
            : p,
        ),
      };
    case "DELETE_PATIENT":
      return {
        ...state,
        patients: state.patients.filter((p) => p.id !== action.patientId),
      };
    case "CLEAR_ALL":
      return { ...state, patients: [] };
    default:
      return state;
  }
}

// Context
const PatientsStateContext = createContext<PatientsState>(initialState);
const PatientsDispatchContext = createContext<Dispatch<Action>>(() => {});

export function PatientsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Persist patients to localStorage so data survives Android tab kills
  useEffect(() => {
    try {
      localStorage.setItem("toranot-patients", JSON.stringify(state.patients));
    } catch {
      // Storage quota exceeded — ignore
    }
  }, [state.patients]);

  return (
    <PatientsStateContext.Provider value={state}>
      <PatientsDispatchContext.Provider value={dispatch}>
        {children}
      </PatientsDispatchContext.Provider>
    </PatientsStateContext.Provider>
  );
}

export function usePatientsState() {
  return useContext(PatientsStateContext);
}

export function usePatientsDispatch() {
  return useContext(PatientsDispatchContext);
}
