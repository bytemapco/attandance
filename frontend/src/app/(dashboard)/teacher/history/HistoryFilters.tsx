import React from "react";
import { SlidersHorizontal, Search, Calendar, Trash2 } from "lucide-react";
import GlassSelect from "@/components/ui/GlassSelect";

interface AcademicClass {
  id: string;
  name: string;
  subject: string;
}

interface HistoryFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  selectedClass: string;
  setSelectedClass: (value: string) => void;
  dateFilter: string;
  setDateFilter: (value: string) => void;
  classes: AcademicClass[];
  onReset: () => void;
}

export default function HistoryFilters({
  searchTerm,
  setSearchTerm,
  selectedClass,
  setSelectedClass,
  dateFilter,
  setDateFilter,
  classes,
  onReset,
}: HistoryFiltersProps): React.ReactElement {
  const hasActiveFilters = selectedClass !== "all" || Boolean(searchTerm) || Boolean(dateFilter);

  return (
    <div className="p-5 mb-6 rounded-2xl bg-card border border-border shadow-xs">
      <div className="flex items-center gap-2 mb-4 text-xs font-semibold text-muted-foreground uppercase tracking-widest">
        <SlidersHorizontal size={14} className="text-primary" />
        Filter Logs & Rosters
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">Search Logs</label>
          <div className="relative flex items-center">
            <Search className="absolute left-3 text-muted-foreground pointer-events-none" size={16} />
            <input
              type="text"
              placeholder="Search class, subject or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="glass-input pl-9 pr-4 py-2 w-full text-sm text-foreground outline-none rounded-xl border border-input bg-background placeholder:text-muted-foreground focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <GlassSelect
            label="Class Filter"
            options={[
              { value: "all", label: "All Assigned Classes" },
              ...classes.map((c) => ({ value: c.id, label: `${c.name} — ${c.subject}` })),
            ]}
            value={selectedClass}
            onChange={setSelectedClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">Filter By Date</label>
          <div className="relative flex items-center">
            <Calendar className="absolute left-3 text-muted-foreground pointer-events-none" size={16} />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="glass-input pl-9 pr-4 py-2 w-full text-sm text-foreground outline-none rounded-xl border border-input bg-background placeholder:text-muted-foreground focus:ring-1 focus:ring-ring block"
            />
          </div>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={onReset}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <Trash2 size={13} /> Clear Active Filters
          </button>
        </div>
      )}
    </div>
  );
}
