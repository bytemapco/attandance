import React from "react";
import { Search, X } from "lucide-react";

export type AttendanceRollFilterStatus = "all" | "Present" | "Absent" | "Flagged";
export type RosterFilterStatus = AttendanceRollFilterStatus;

interface AttendanceRollSearchFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: AttendanceRollFilterStatus;
  onStatusFilterChange: (status: AttendanceRollFilterStatus) => void;
  counts: { all: number; present: number; absent: number; flagged: number };
}

export default function AttendanceRollSearchFilter({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  counts,
}: AttendanceRollSearchFilterProps): React.ReactElement {
  const tabs: { key: AttendanceRollFilterStatus; label: string; count: number }[] = [
    { key: "all", label: "All", count: counts.all },
    { key: "Present", label: "Present", count: counts.present },
    { key: "Absent", label: "Absent", count: counts.absent },
    { key: "Flagged", label: "Flagged", count: counts.flagged },
  ];

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
      <div className="relative flex-1 max-w-md">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#526f78] pointer-events-none"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by student name or enrollment number..."
          className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-card border border-[#e3e1dc] rounded-lg text-[#202b30] placeholder-[#718087] focus:outline-none focus:border-[#c98260] transition-colors"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#526f78] hover:text-[#202b30]"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="flex items-center gap-1.5 p-1 bg-[#eeece7] border border-[#e3e1dc] rounded-lg overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = statusFilter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onStatusFilterChange(tab.key)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                isActive
                  ? "bg-card text-[#28363b] font-semibold shadow-2xs border border-[#e3e1dc]"
                  : "text-[#526f78] hover:text-[#28363b] hover:bg-card/40"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  isActive ? "bg-[#eeece7] text-[#28363b]" : "bg-[#e3e1dc] text-[#526f78]"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
