"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";

import api, { getApiErrorMessage, applyValidationErrorsToForm } from "@/lib/api";
import { calendarEventSchema, type CalendarEventFormData } from "@/lib/validations/masterData";
import GlassBreadcrumb from "@/components/ui/GlassBreadcrumb";
import GlassPageHeader from "@/components/ui/GlassPageHeader";
import GlassCard from "@/components/ui/GlassCard";
import GlassInput from "@/components/ui/GlassInput";
import GlassSelect from "@/components/ui/GlassSelect";
import GlassButton from "@/components/ui/GlassButton";

const EVENT_TYPE_OPTIONS = [
  { value: "HOLIDAY", label: "Holiday" },
  { value: "EXAM_DAY", label: "Exam Day" },
  { value: "NON_INSTRUCTIONAL", label: "Non-Instructional Day" },
  { value: "TIMETABLE_OVERRIDE", label: "Timetable Override" },
];

export default function CreateCalendarEventPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CalendarEventFormData>({
    resolver: zodResolver(calendarEventSchema),
    defaultValues: {
      title: "",
      date: "",
      event_type: "HOLIDAY",
      affects_all_courses: true,
      description: "",
    },
  });

  async function onSubmit(formData: CalendarEventFormData): Promise<void> {
    try {
      await api.post("/admin/calendar-events", {
        academic_year_id: id,
        title: formData.title.trim(),
        date: formData.date,
        event_type: formData.event_type,
        affects_all_courses: formData.affects_all_courses,
        description: formData.description || undefined,
      });
      toast.success("Calendar event added successfully");
      router.push(`/admin/master-data/academic-years/${id}`);
    } catch (err: unknown) {
      const handled = applyValidationErrorsToForm(err, setError);
      if (!handled) {
        toast.error(getApiErrorMessage(err, "Creation failed"));
      }
    }
  }

  return (
    <div className="animate-fade-in-up">
      <GlassBreadcrumb
        items={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Master Data", href: "/admin/master-data/departments" },
          { label: "Academic Years", href: "/admin/master-data/academic-years" },
          { label: "Add Event" },
        ]}
      />
      <GlassPageHeader title="Add Calendar Event" />
      <GlassCard className="max-w-xl">
        <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <GlassInput
            label="Title"
            placeholder="e.g. Diwali Break"
            {...register("title")}
            error={errors.title?.message}
          />
          <GlassInput label="Date" type="date" {...register("date")} error={errors.date?.message} />
          <Controller
            control={control}
            name="event_type"
            render={({ field }) => (
              <GlassSelect
                label="Event Type"
                options={EVENT_TYPE_OPTIONS}
                value={field.value}
                onChange={field.onChange}
                error={errors.event_type?.message}
              />
            )}
          />
          <label className="flex items-center gap-2 text-sm font-medium text-[#202b30]">
            <input type="checkbox" className="h-4 w-4 rounded border-[#e3e1dc]" {...register("affects_all_courses")} />
            Affects all courses
          </label>
          <GlassInput
            label="Description (optional)"
            {...register("description")}
            error={errors.description?.message}
          />
          <div className="flex justify-end gap-3 pt-4">
            <GlassButton variant="ghost" type="button" onClick={() => router.back()}>
              Cancel
            </GlassButton>
            <GlassButton variant="primary" type="submit" loading={isSubmitting}>
              Add Event
            </GlassButton>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
