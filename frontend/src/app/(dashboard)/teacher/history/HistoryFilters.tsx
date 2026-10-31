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
    <div className="p-4 mb-6 rounded-2xl bg-card border border-[#e3e1dc] shadow-[0_2px_8px_rgba(40,54,59,0.04)]">
      <div className="flex items-center gap-2 mb-3.5 text-xs font-semibold text-[#28363b]">
        <SlidersHorizontal size={14} className="text-[#c98260]" />
        Filter History
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[#28363b]">Search</label>
          <div className="relative flex items-center">
            <Search className="absolute left-3 text-[#526f78] pointer-events-none" size={15} />
            <input
              type="text"
              placeholder="Search class or subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-2 w-full text-xs text-[#28363b] outline-none rounded-xl border border-[#e3e1dc] bg-white placeholder:text-[#526f78] focus:ring-1 focus:ring-[#c98260]"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <GlassSelect
            label="Class"
            options={[
              { value: "all", label: "All Classes" },
              ...classes.map((c) => ({
                value: c.id,
                label: c.subject && !c.name.toLowerCase().includes(c.subject.toLowerCase().slice(0, 8))
                  ? `${c.name} • ${c.subject}`
                  : c.name,
              })),
            ]}
            value={selectedClass}
            onChange={setSelectedClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[#28363b]">Date</label>
          <div className="relative flex items-center">
            <Calendar className="absolute left-3 text-[#526f78] pointer-events-none" size={15} />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="pl-9 pr-3 py-2 w-full text-xs text-[#28363b] outline-none rounded-xl border border-[#e3e1dc] bg-white placeholder:text-[#526f78] focus:ring-1 focus:ring-[#c98260] block"
            />
          </div>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="mt-3.5 pt-3 border-t border-[#e3e1dc]/60 flex justify-end">
          <button
            onClick={onReset}
            className="text-xs text-[#526f78] hover:text-[#28363b] flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-[#eeece7] transition-colors font-medium"
          >
            <Trash2 size={13} /> Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}
