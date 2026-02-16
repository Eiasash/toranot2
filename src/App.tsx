import { PatientsProvider } from "./context/PatientsContext";
import { SectionTabs } from "./components/SectionTabs";
import { InputArea } from "./components/InputArea";
import { PatientList } from "./components/PatientList";

export function App() {
  return (
    <PatientsProvider>
      <div className="min-h-dvh bg-gray-50 flex flex-col max-w-lg mx-auto">
        {/* Header */}
        <header className="bg-blue-700 text-white px-4 py-3 safe-top">
          <h1 className="text-lg font-bold">תורנות</h1>
          <p className="text-blue-200 text-xs">ניהול משמרת מחלקתי</p>
        </header>

        {/* Input */}
        <InputArea />

        {/* Section Tabs */}
        <SectionTabs />

        {/* Patient List */}
        <div className="flex-1 bg-white border-t border-gray-200">
          <PatientList />
        </div>
      </div>
    </PatientsProvider>
  );
}
