import { PatientsProvider } from "./context/PatientsContext";
import { SectionTabs } from "./components/SectionTabs";
import { InputArea } from "./components/InputArea";
import { PatientList } from "./components/PatientList";

export function App() {
  return (
    <PatientsProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-blue-700 text-white px-4 py-3 shadow-md">
          <h1 className="text-xl font-bold">תורנות</h1>
          <p className="text-blue-200 text-sm">ניהול משמרת מחלקתי</p>
        </header>

        {/* Input */}
        <InputArea />

        {/* Section Tabs */}
        <SectionTabs />

        {/* Patient List */}
        <div className="bg-white border-t border-gray-200 min-h-[60vh]">
          <PatientList />
        </div>
      </div>
    </PatientsProvider>
  );
}
