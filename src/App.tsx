import { useState } from "react";
import { PatientsProvider } from "./context/PatientsContext";
import { SectionTabs } from "./components/SectionTabs";
import { InputArea } from "./components/InputArea";
import { PatientList } from "./components/PatientList";
import { HandoverExport } from "./components/HandoverExport";

export function App() {
  const [showHandover, setShowHandover] = useState(false);

  return (
    <PatientsProvider>
      <div className="min-h-dvh bg-white flex flex-col">
        <header className="bg-slate-800 text-white px-4 py-3 safe-top border-b border-slate-700">
          <div className="w-full lg:max-w-6xl lg:mx-auto flex items-center justify-between">
            <div className="flex items-baseline gap-3">
              <h1 className="text-lg font-bold tracking-tight">תורנות</h1>
              <p className="text-slate-400 text-xs">ניהול משמרת מחלקתי</p>
            </div>
            <button
              onClick={() => setShowHandover(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 text-slate-200 text-xs font-medium active:bg-slate-600 transition-colors"
            >
              <span>📤</span>
              <span>מסירה</span>
            </button>
          </div>
        </header>

        <div className="w-full lg:max-w-6xl lg:mx-auto">
          <InputArea />
        </div>

        <SectionTabs />

        <main className="flex-1 border-t border-gray-200 bg-gray-50 lg:bg-white">
          <div className="w-full lg:max-w-6xl lg:mx-auto">
            <PatientList />
          </div>
        </main>
      </div>

      {showHandover && <HandoverExport onClose={() => setShowHandover(false)} />}
    </PatientsProvider>
  );
}
