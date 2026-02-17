import { SECTIONS, SECTION_LABEL, type Section } from "../types";
import { usePatientsState, usePatientsDispatch } from "../context/PatientsContext";

export function SectionTabs() {
  const { activeSection, patients } = usePatientsState();
  const dispatch = usePatientsDispatch();

  function countForSection(section: Section): number {
    return patients.filter((p) => p.section === section).length;
  }

  return (
    <nav className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
      <div className="lg:max-w-6xl lg:mx-auto flex overflow-x-auto">
        {SECTIONS.map((section) => {
          const count = countForSection(section);
          const isActive = section === activeSection;
          return (
            <button
              key={section}
              onClick={() => dispatch({ type: "SET_SECTION", section })}
              className={`
                flex-1 min-w-[25%] py-3 px-2 text-sm font-medium whitespace-nowrap
                border-b-2 transition-colors
                ${isActive
                  ? "border-blue-600 text-blue-700"
                  : "border-transparent text-gray-500 active:bg-gray-50"
                }
              `}
            >
              {SECTION_LABEL[section]}
              {count > 0 && (
                <span className={`
                  mr-1.5 inline-flex items-center justify-center rounded-full text-xs
                  min-w-[1.25rem] h-5 px-1
                  ${isActive ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-600"}
                `}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
