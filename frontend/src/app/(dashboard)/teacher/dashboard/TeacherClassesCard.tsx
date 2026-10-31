"use client";

import React from "react";
import Link from "next/link";
import { BookOpen, Radio, MapPin, ArrowRight } from "lucide-react";
import type { AcademicClassWithGeofence } from "@/types";

interface TeacherClassesCardProps {
  classes: AcademicClassWithGeofence[];
}

export default function TeacherClassesCard({
  classes,
}: TeacherClassesCardProps): React.ReactElement {
  return (
    <div className="rounded-2xl border border-[#e3e1dc] bg-card shadow-[0_2px_8px_rgba(40,54,59,0.05)] overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-[#e3e1dc] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-secondary text-[#526f78] border border-[#e3e1dc]">
            <BookOpen size={16} />
          </div>
          <h2 className="text-sm font-bold tracking-tight text-[#202b30]">
            Assigned Classes
          </h2>
        </div>

        <Link
          href="/teacher/classes"
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#28363b] hover:text-[#c98260] transition-colors"
        >
          <span>All Classes</span>
          <ArrowRight size={13} />
        </Link>
      </div>

      <div className="p-4 sm:p-5">
        {classes.length === 0 ? (
          <div className="py-10 text-center space-y-3">
            <BookOpen size={28} className="mx-auto text-[#718087]" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-[#202b30]">No classes assigned</p>
              <p className="text-[11px] text-[#526f78] max-w-xs mx-auto">
                Your department administrator assigns class rosters and curriculum schedules.
              </p>
            </div>
            <Link
              href="/teacher/classes"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#e3e1dc] bg-card text-xs font-semibold text-[#202b30] hover:bg-secondary transition-all"
            >
              <span>View Class Catalog</span>
              <ArrowRight size={12} />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {classes.slice(0, 6).map((item) => {
              const hasGeofence = Boolean(item.geofence);
              const radius = item.geofence?.radiusMeters;

              return (
                <div
                  key={item.id}
                  className="group flex flex-col justify-between p-4 rounded-xl border border-[#e3e1dc] bg-card hover:border-[#c98260]/60 hover:shadow-[0_4px_12px_rgba(40,54,59,0.06)] transition-all"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/teacher/classes/${item.id}`}
                        className="text-xs font-bold text-[#202b30] group-hover:text-[#28363b] transition-colors line-clamp-1 hover:underline"
                      >
                        {item.name}
                      </Link>
                      {hasGeofence && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-[#e8f3ed] text-[#247653] border border-[#c6e2d3] shrink-0 font-mono">
                          <MapPin size={9} />
                          {radius}m
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-[#526f78] line-clamp-1">
                      {item.subject || "General Coursework"}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#e3e1dc] flex items-center justify-between gap-2">
                    <Link
                      href={`/teacher/classes/${item.id}`}
                      className="text-[11px] font-medium text-[#526f78] hover:text-[#202b30] transition-colors"
                    >
                      View Class
                    </Link>

                    <Link
                      href={`/teacher/sessions?classId=${item.id}`}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#28363b] hover:bg-[#1f2b2f] text-white text-[11px] font-semibold transition-all shadow-2xs"
                    >
                      <Radio size={11} className="text-[#c98260]" />
                      <span>Take Attendance</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
