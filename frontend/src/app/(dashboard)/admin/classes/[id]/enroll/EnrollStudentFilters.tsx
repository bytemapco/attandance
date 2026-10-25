import React from "react";
import { Search, X } from "lucide-react";
import GlassInput from "@/components/ui/GlassInput";
import GlassSelect from "@/components/ui/GlassSelect";
import GlassButton from "@/components/ui/GlassButton";

interface EnrollStudentFiltersProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  selectedDepartment: string;
  setSelectedDepartment: (val: string) => void;
  selectedSemester: string;
  setSelectedSemester: (val: string) => void;
  selectedBatch: string;
  setSelectedBatch: (val: string) => void;
  filterOptions: {
    uniqueDepartments: string[];
    uniqueSemesters: string[];
    uniqueBatches: string[];
  };
  allVisibleSelected: boolean;
  onToggleSelectAll: () => void;
  selectedCount: number;
  onClearSelection: () => void;
  hasNonEnrolledVisible: boolean;
}

export default function EnrollStudentFilters({
  searchQuery,
  setSearchQuery,
  selectedDepartment,
  setSelectedDepartment,
  selectedSemester,
  setSelectedSemester,
  selectedBatch,
  setSelectedBatch,
  filterOptions,
  allVisibleSelected,
  onToggleSelectAll,
  selectedCount,
  onClearSelection,
  hasNonEnrolledVisible,
}: EnrollStudentFiltersProps): React.ReactElement {
  return (
    <div className="p-4 border-b border-border bg-secondary/30 flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="w-full sm:w-80 relative">
          <GlassInput
            placeholder="Search students by name, email, or enrollment..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search size={14} />}
          />
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto ml-auto">
          <GlassButton 
            variant="secondary" 
            size="sm"
            onClick={onToggleSelectAll}
            disabled={!hasNonEnrolledVisible}
          >
            {allVisibleSelected ? "Deselect All Visible" : "Select All Visible"}
          </GlassButton>
          {selectedCount > 0 && (
            <button 
              onClick={onClearSelection}
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors"
              title="Clear Selection"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <GlassSelect
          options={[{ value: "", label: "All Departments" }, ...filterOptions.uniqueDepartments.map((d) => ({ value: d, label: d }))]}
          value={selectedDepartment}
          onChange={setSelectedDepartment}
        />
        <GlassSelect
          options={[{ value: "", label: "All Semesters" }, ...filterOptions.uniqueSemesters.map((s) => ({ value: s, label: `Semester ${s}` }))]}
          value={selectedSemester}
          onChange={setSelectedSemester}
        />
        <GlassSelect
          options={[{ value: "", label: "All Batches" }, ...filterOptions.uniqueBatches.map((b) => ({ value: b, label: `Batch ${b}` }))]}
          value={selectedBatch}
          onChange={setSelectedBatch}
        />
      </div>
    </div>
  );
}
