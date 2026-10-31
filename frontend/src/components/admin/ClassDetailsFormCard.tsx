"use client";

import React from "react";
import { Settings2 } from "lucide-react";
import {
  Controller,
  type Control,
  type FieldErrors,
  type FieldValues,
  type Path,
  type UseFormRegister,
} from "react-hook-form";
import GlassCard from "@/components/ui/GlassCard";
import GlassSelect from "@/components/ui/GlassSelect";
import GlassInput from "@/components/ui/GlassInput";

interface SelectOption {
  value: string;
  label: string;
}

interface ClassDetailsFormCardProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  register: UseFormRegister<TFieldValues>;
  errors: FieldErrors<TFieldValues>;
  subjectOptions: SelectOption[];
  classroomOptions: SelectOption[];
  semesterOptions: SelectOption[];
  teacherOptions?: SelectOption[];
  title?: string;
}

export default function ClassDetailsFormCard<TFieldValues extends FieldValues>({
  control,
  register,
  errors,
  subjectOptions,
  classroomOptions,
  semesterOptions,
  teacherOptions,
  title = "Class Details",
}: ClassDetailsFormCardProps<TFieldValues>): React.ReactElement {
  return (
    <GlassCard padding="md" className="bg-card h-full">
      <div className="flex items-center gap-2 mb-4">
        <Settings2 size={16} className="text-[#c98260]" />
        <h3 className="text-sm font-semibold text-[#28363b]">{title}</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {teacherOptions && (
          <div className="sm:col-span-2">
            <Controller
              control={control}
              name={"teacher_id" as Path<TFieldValues>}
              render={({ field }) => (
                <GlassSelect
                  label="Teacher"
                  options={teacherOptions}
                  value={String(field.value || "")}
                  onChange={field.onChange}
                  error={errors.teacher_id?.message as string | undefined}
                />
              )}
            />
          </div>
        )}
        <Controller
          control={control}
          name={"subject_id" as Path<TFieldValues>}
          render={({ field }) => (
            <GlassSelect
              label="Subject"
              options={subjectOptions}
              value={String(field.value || "")}
              onChange={field.onChange}
              error={errors.subject_id?.message as string | undefined}
            />
          )}
        />
        <Controller
          control={control}
          name={"classroom_id" as Path<TFieldValues>}
          render={({ field }) => (
            <GlassSelect
              label="Classroom"
              options={classroomOptions}
              value={field.value ? String(field.value) : ""}
              onChange={(v) => field.onChange(v || undefined)}
              error={errors.classroom_id?.message as string | undefined}
            />
          )}
        />
        <Controller
          control={control}
          name={"semester" as Path<TFieldValues>}
          render={({ field }) => (
            <GlassSelect
              label="Semester"
              options={semesterOptions}
              value={field.value ? String(field.value) : ""}
              onChange={(v) => field.onChange(v ? Number(v) : undefined)}
              error={errors.semester?.message as string | undefined}
            />
          )}
        />
        <GlassInput
          label="Batch"
          placeholder="e.g. 2022-2026"
          {...register("batch" as Path<TFieldValues>)}
          error={errors.batch?.message as string | undefined}
        />
      </div>
    </GlassCard>
  );
}
