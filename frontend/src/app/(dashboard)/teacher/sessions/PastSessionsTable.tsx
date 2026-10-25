import React from "react";
import { useRouter } from "next/navigation";
import { Radio, ClipboardList, BookOpen } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import GlassButton from "@/components/ui/GlassButton";
import type { SessionWithClassResponse } from "@/types";

interface PastSessionsTableProps {
  sessions: SessionWithClassResponse[];
}

export default function PastSessionsTable({ sessions }: PastSessionsTableProps): React.ReactElement {
  const router = useRouter();

  return (
    <GlassCard>
      <h3 className="text-base font-semibold text-foreground mb-4">Past Sessions</h3>
      {sessions.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No past sessions yet</p>
      ) : (
        <div className="overflow-x-auto overflow-y-auto max-h-[420px] rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted/80 backdrop-blur-md z-10">
              <tr className="border-b border-border">
                {["Class", "Subject", "Date", "Start", "End", "Actions"].map((h) => (
                  <th
                    key={h}
                    className="text-left py-3 px-4 text-muted-foreground font-semibold text-xs uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sessions.map((s, idx) => (
                <tr
                  key={s.id}
                  className={`border-b border-border/60 transition-colors ${idx % 2 === 0 ? "" : "bg-muted/20"}`}
                >
                  <td className="py-3 px-4 font-medium text-foreground">
                    {s.class_name || (s as { className?: string }).className || "Class Session"}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {s.subject || (s as { subjectName?: string }).subjectName || (s as { subject_name?: string }).subject_name || "General"}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground text-xs">
                    {new Date(s.startTime).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground text-xs">
                    {new Date(s.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground text-xs">
                    {new Date(s.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <GlassButton
                        variant="ghost"
                        size="sm"
                        icon={<Radio size={13} className="text-emerald-600 animate-pulse" />}
                        onClick={() => router.push(`/teacher/sessions/${s.id}/roster`)}
                      >
                        Live View
                      </GlassButton>
                      <GlassButton
                        variant="ghost"
                        size="sm"
                        icon={<ClipboardList size={13} />}
                        onClick={() => router.push(`/teacher/sessions/${s.id}/roster`)}
                      >
                        Roster
                      </GlassButton>
                      <GlassButton
                        variant="ghost"
                        size="sm"
                        icon={<BookOpen size={13} />}
                        onClick={() => router.push(`/teacher/sessions/${s.id}/manual`)}
                      >
                        Manual
                      </GlassButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </GlassCard>
  );
}
