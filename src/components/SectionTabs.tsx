import { SECTIONS, SECTION_LABEL, type Section } from "../types";
import { usePatientsState, usePatientsDispatch } from "../context/PatientsContext";

export function SectionTabs() {
  const { activeSection, patients } = usePatientsState();
  const dispatch = usePatientsDispatch();

  function countForSection(section: Section): number {
    return patients.filter((p) => p.section === section).length;
  }

  return (
    <div className="flex overflow-x-auto gap-1 px-3 pt-2 pb-0 sticky top-0 bg-gray-50 z-10 -mx-px">
      {SECTIONS.map((section) => {
        const count = countForSection(section);
        const isActive = section === activeSection;
        return (
          <button
            key={section}
            onClick={() => dispatch({ type: "SET_SECTION", section })}
            className={`
              flex-1 min-w-0 py-2.5 text-sm font-medium rounded-t-xl border border-b-0
              transition-colors whitespace-nowrap
              ${isActive
                ? "bg-white text-blue-700 border-blue-300"
                : "bg-gray-100 text-gray-500 border-gray-200 active:bg-gray-200"
              }
            `}
          >
            {SECTION_LABEL[section]}
            {count > 0 && (
              <span className={`
                mr-1 inline-flex items-center justify-center rounded-full text-xs w-5 h-5
                ${isActive ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-600"}
              `}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
