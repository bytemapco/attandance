"use client";

import React from "react";
import { CalendarClock, Pencil, Trash2 } from "lucide-react";
import GlassButton from "@/components/ui/GlassButton";
import type { ClassSectionItem } from "@/types";

interface SectionActionsProps {
  section: ClassSectionItem;
  onSchedule: () => void;
  onChangeTeacher: () => void;
  onRemove: () => void;
}

export default function SectionActions({
  section,
  onSchedule,
  onChangeTeacher,
  onRemove,
}: SectionActionsProps): React.ReactElement {
  return (
    <div className="flex items-center gap-2">
      <GlassButton
        variant="ghost"
        size="sm"
        icon={<CalendarClock size={13} />}
        disabled={!section.teacher_id}
        title={section.teacher_id ? undefined : "Assign a teacher first"}
        onClick={onSchedule}
      >
        Schedule
      </GlassButton>
      <GlassButton variant="ghost" size="sm" icon={<Pencil size={13} />} onClick={onChangeTeacher}>
        {section.teacher_id ? "Change teacher" : "Assign teacher"}
      </GlassButton>
      <GlassButton
        variant="ghost"
        size="sm"
        aria-label={`Remove ${section.subject_name}`}
        icon={<Trash2 size={13} />}
        className="text-muted-foreground hover:bg-[#f9eaea] hover:text-[#b54242]"
        onClick={onRemove}
      />
    </div>
  );
}
