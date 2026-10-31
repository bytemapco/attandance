"use client";

import React, { useState, useMemo } from "react";
import { Search, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import GlassEmptyState from "@/components/ui/GlassEmptyState";
import type { StudentClassSessionLog } from "@/types";

import StudentLogsPagination from "./StudentLogsPagination";

interface StudentSessionLogsTableProps {
  sessions: StudentClassSessionLog[];
}

type StatusFilter = "all" | "present" | "absent" | "flagged";

export default function StudentSessionLogsTable({
  sessions,
}: StudentSessionLogsTableProps): React.ReactElement {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const counts = useMemo(() => {
    let p = 0;
    let a = 0;
    let f = 0;
    sessions.forEach((s) => {
      if (s.status === "Present" || s.status === "Approved") p++;
      else if (s.status === "Flagged") f++;
      else a++;
    });
    return { all: sessions.length, present: p, absent: a, flagged: f };
  }, [sessions]);

  const filteredSessions = useMemo(() => {
    return sessions.filter((log) => {
      const isP = log.status === "Present" || log.status === "Approved";
      const isF = log.status === "Flagged";
      const isA = !isP && !isF;

      if (statusFilter === "present" && !isP) return false;
      if (statusFilter === "absent" && !isA) return false;
      if (statusFilter === "flagged" && !isF) return false;

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchName = log.session_name.toLowerCase().includes(term);
        const matchDate = log.session_date.toLowerCase().includes(term);
        if (!matchName && !matchDate) return false;
      }
      return true;
    });
  }, [sessions, statusFilter, searchTerm]);

  const totalPages = Math.ceil(filteredSessions.length / pageSize) || 1;
  const paginatedSessions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSessions.slice(start, start + pageSize);
  }, [filteredSessions, currentPage, pageSize]);

  return (
    <div className="rounded-xl border border-[#e3e1dc] bg-card overflow-hidden shadow-2xs">
      {/* Table Toolbar Header */}
      <div className="p-3 border-b border-[#e3e1dc] flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#eeece7]/40">
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#526f78]" />
          <input
            type="text"
            placeholder="Search date or session..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-card border border-[#e3e1dc] focus:outline-none focus:border-[#c98260] text-[#28363b]"
          />
        </div>

        <div className="inline-flex items-center gap-1 overflow-x-auto w-full sm:w-auto p-0.5 rounded-lg bg-[#eeece7] border border-[#e3e1dc]">
          <button
            onClick={() => { setStatusFilter("all"); setCurrentPage(1); }}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
              statusFilter === "all" ? "bg-white text-[#28363b] shadow-2xs" : "text-[#526f78] hover:text-[#28363b]"
            }`}
          >
            All ({counts.all})
          </button>
          <button
            onClick={() => { setStatusFilter("present"); setCurrentPage(1); }}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-all flex items-center gap-1 ${
              statusFilter === "present" ? "bg-white text-[#247653] shadow-2xs" : "text-[#247653] hover:bg-white/50"
            }`}
          >
            <CheckCircle2 size={12} /> Present ({counts.present})
          </button>
          <button
            onClick={() => { setStatusFilter("absent"); setCurrentPage(1); }}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-all flex items-center gap-1 ${
              statusFilter === "absent" ? "bg-white text-[#b54242] shadow-2xs" : "text-[#b54242] hover:bg-white/50"
            }`}
          >
            <XCircle size={12} /> Absent ({counts.absent})
          </button>
          {counts.flagged > 0 && (
            <button
              onClick={() => { setStatusFilter("flagged"); setCurrentPage(1); }}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all flex items-center gap-1 ${
                statusFilter === "flagged" ? "bg-white text-[#8a5b12] shadow-2xs" : "text-[#8a5b12] hover:bg-white/50"
              }`}
            >
              <AlertTriangle size={12} /> Review ({counts.flagged})
            </button>
          )}
        </div>
      </div>

      {/* Table Content */}
      {filteredSessions.length > 0 ? (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#eeece7]/80 border-b border-[#e3e1dc] text-[#526f78] font-semibold">
                <tr>
                  <th className="px-4 py-3 w-12 text-center text-[#718087]">#</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Session</th>
                  <th className="px-4 py-3 text-center w-24">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e3e1dc]/60">
                {paginatedSessions.map((log, index) => {
                  const isP = log.status === "Present" || log.status === "Approved";
                  const isF = log.status === "Flagged";
                  const serialNo = (currentPage - 1) * pageSize + index + 1;
                  return (
                    <tr key={log.session_id} className="hover:bg-[#eeece7]/30 transition-colors">
                      <td className="px-4 py-3 text-center text-[#718087] font-mono">
                        {serialNo}
                      </td>
                      <td className="px-4 py-3 text-[#28363b] font-medium whitespace-nowrap">
                        {new Date(log.start_time).toLocaleDateString([], {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3 text-[#526f78]">
                        {log.session_name.replace(/\s*\(\d{4}-\d{2}-\d{2}\)/, "")}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          title={log.status}
                          className={`inline-flex items-center justify-center w-7 h-6 rounded font-bold text-xs border ${
                            isP
                              ? "bg-[#e8f3ed] text-[#247653] border-[#c6e2d3]"
                              : isF
                              ? "bg-[#fbf1df] text-[#8a5b12] border-[#f2deba]"
                              : "bg-[#f9eaea] text-[#b54242] border-[#f0c9c9]"
                          }`}
                        >
                          {isP ? "P" : isF ? "F" : "A"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <StudentLogsPagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalFiltered={filteredSessions.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
          />
        </>
      ) : (
        <div className="p-8">
          <GlassEmptyState
            title="No Matching Records"
            message="No attendance sessions match the selected filter."
          />
        </div>
      )}
    </div>
  );
}
