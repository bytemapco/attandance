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
    <div className="rounded-2xl border border-border/80 bg-card/70 backdrop-blur-xl shadow-xs overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-border/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
            <BookOpen size={16} />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-foreground">
              Assigned Classes
            </h2>
            <p className="text-[11px] text-muted-foreground">
              {classes.length} {classes.length === 1 ? "class roster" : "class rosters"} configured
            </p>
          </div>
        </div>

        <Link
          href="/teacher/classes"
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          <span>All Classes</span>
          <ArrowRight size={13} />
        </Link>
      </div>

      <div className="p-4 sm:p-5">
        {classes.length === 0 ? (
          <div className="py-10 text-center space-y-3">
            <BookOpen size={28} className="mx-auto text-muted-foreground/60" />
            <div className="space-y-1">
              <p className="text-xs font-semibold text-foreground">No classes assigned</p>
              <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
                Your department administrator assigns class rosters and curriculum schedules.
              </p>
            </div>
            <Link
              href="/teacher/classes"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-medium text-foreground hover:bg-secondary transition-all"
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
                  className="group flex flex-col justify-between p-4 rounded-xl border border-border/70 bg-card/60 hover:bg-secondary/40 hover:border-foreground/20 transition-all shadow-2xs"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/teacher/classes/${item.id}`}
                        className="text-xs font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1 hover:underline"
                      >
                        {item.name}
                      </Link>
                      {hasGeofence ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                          <MapPin size={9} />
                          {radius}m
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-muted text-muted-foreground shrink-0">
                          No GPS
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-muted-foreground line-clamp-1">
                      {item.subject || "General Coursework"}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between gap-2">
                    <Link
                      href={`/teacher/classes/${item.id}`}
                      className="text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Geofence & Details
                    </Link>

                    <Link
                      href={`/teacher/sessions?classId=${item.id}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground text-[11px] font-semibold transition-all"
                    >
                      <Radio size={11} />
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
