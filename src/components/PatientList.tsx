import { usePatientsState } from "../context/PatientsContext";
import { SECTION_LABEL } from "../types";
import { PatientCard } from "./PatientCard";

export function PatientList() {
  const { patients, activeSection } = usePatientsState();
  const filtered = patients.filter((p) => p.section === activeSection);

  if (filtered.length === 0) {
    return (
      <div className="text-center text-gray-400 py-16">
        <p className="text-lg">אין חולים ב{SECTION_LABEL[activeSection]}</p>
        <p className="text-sm mt-1">הדביקו רשימת חולים למעלה כדי להתחיל</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      {filtered.map((patient) => (
        <PatientCard key={patient.id} patient={patient} />
      ))}
    </div>
  );
}
