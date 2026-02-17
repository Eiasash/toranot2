import { PatientsProvider } from "./context/PatientsContext";
import { SectionTabs } from "./components/SectionTabs";
import { InputArea } from "./components/InputArea";
import { PatientList } from "./components/PatientList";

export function App() {
  return (
    <PatientsProvider>
      <div className="min-h-dvh bg-white flex flex-col">
        <header className="bg-slate-800 text-white px-4 py-3 safe-top border-b border-slate-700">
          <div className="w-full lg:max-w-6xl lg:mx-auto flex items-baseline gap-3">
            <h1 className="text-lg font-bold tracking-tight">תורנות</h1>
            <p className="text-slate-400 text-xs">ניהול משמרת מחלקתי</p>
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
    </PatientsProvider>
  );
}
