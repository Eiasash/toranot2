import { SECTIONS, SECTION_LABEL, type Section } from "../types";
import { usePatientsState, usePatientsDispatch } from "../context/PatientsContext";

const TAB_BASE =
  "px-4 py-2 text-sm font-medium rounded-t-lg border border-b-0 transition-colors cursor-pointer";
const TAB_ACTIVE = "bg-white text-blue-700 border-blue-300";
const TAB_INACTIVE = "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200";

export function SectionTabs() {
  const { activeSection, patients } = usePatientsState();
  const dispatch = usePatientsDispatch();

  function countForSection(section: Section): number {
    return patients.filter((p) => p.section === section).length;
  }

  return (
    <div className="flex gap-1 px-4 pt-3">
      {SECTIONS.map((section) => {
        const count = countForSection(section);
        const isActive = section === activeSection;
        return (
          <button
            key={section}
            onClick={() => dispatch({ type: "SET_SECTION", section })}
            className={`${TAB_BASE} ${isActive ? TAB_ACTIVE : TAB_INACTIVE}`}
          >
            {SECTION_LABEL[section]}
            {count > 0 && (
              <span className="mr-1.5 inline-flex items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs w-5 h-5">
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
