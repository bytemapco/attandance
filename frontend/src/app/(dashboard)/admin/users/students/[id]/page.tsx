"use client";

import React from "react";
import { useParams } from "next/navigation";
import { Building2, CalendarDays, GraduationCap, Hash, Layers, Mail, Phone, User } from "lucide-react";
import { useAccountDetail } from "@/hooks/useAccountDetail";
import DetailCard from "@/components/admin/user-detail/DetailCard";
import InfoRow from "@/components/admin/user-detail/InfoRow";
import MetaChip from "@/components/admin/user-detail/MetaChip";
import UserDetailView from "@/components/admin/user-detail/UserDetailView";
import GlassBadge from "@/components/ui/GlassBadge";
import GlassLoader from "@/components/ui/GlassLoader";
import type { StudentResponse } from "@/types";

const GENDER_LABELS: Record<string, string> = { M: "Male", F: "Female", O: "Other" };
const NOT_PROVIDED = "Not provided";
const NOT_ASSIGNED = "Not assigned";

function fullNameOf(student: StudentResponse): string {
  if (student.first_name && student.last_name) return `${student.first_name} ${student.last_name}`;
  return student.first_name || student.last_name || NOT_PROVIDED;
}

function formatBirthDate(value: string | null | undefined): string {
  if (!value) return NOT_PROVIDED;
  return new Date(value).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function StatusBadge({ active }: { active: boolean }): React.ReactElement {
  return (
    <GlassBadge
      variant={active ? "success" : "neutral"}
      icon={<span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-[#247653]" : "bg-muted-foreground"}`} />}
    >
      {active ? "Enrolled" : "Inactive"}
    </GlassBadge>
  );
}

export default function StudentDetailPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const { account: student, loading } = useAccountDetail<StudentResponse>("students", id, "Failed to load student");

  if (loading) return <GlassLoader text="Loading student details..." />;
  if (!student) return <div className="text-center py-20 text-muted-foreground">Student not found</div>;

  const fullName = fullNameOf(student);
  const classLabel = [
    student.semester ? `Semester ${student.semester}` : null,
    student.batch ? `Batch ${student.batch}` : null,
  ].filter(Boolean).join(" • ");

  return (
    <UserDetailView
      breadcrumb={[
        { label: "Admin", href: "/admin/dashboard" },
        { label: "Students", href: "/admin/users/students" },
        { label: fullName !== NOT_PROVIDED ? fullName : student.email },
      ]}
      account={student}
      initials={(student.first_name?.[0] || "") + (student.last_name?.[0] || "")}
      fullName={fullName}
      badge={<StatusBadge active={student.is_active !== false} />}
      identifier={{
        label: "Enrollment Number",
        value: student.enrollment_number,
        hint: "Click to copy enrollment number",
      }}
      chips={
        <>
          {student.department_name && <MetaChip icon={Building2}>{student.department_name}</MetaChip>}
          {classLabel && <MetaChip icon={Layers}>{classLabel}</MetaChip>}
        </>
      }
      editHref={`/admin/users/students/${id}/edit`}
    >
      <DetailCard icon={GraduationCap} title="Academic Profile" subtitle="Institutional Records">
        <InfoRow
          icon={Hash}
          label="Enrollment Number"
          value={student.enrollment_number}
          copyValue={student.enrollment_number}
          copyKey="Enrollment Number"
        />
        <InfoRow icon={Building2} label="Department" value={student.department_name || NOT_ASSIGNED} />
        <InfoRow
          icon={Layers}
          label="Current Semester"
          value={student.semester ? `Semester ${student.semester}` : NOT_ASSIGNED}
        />
        <InfoRow
          icon={GraduationCap}
          label="Assigned Batch"
          value={student.batch ? `Batch ${student.batch}` : NOT_ASSIGNED}
        />
      </DetailCard>

      <DetailCard icon={User} title="Personal Information" subtitle="Contact & Identity">
        <InfoRow icon={Mail} label="Email Address" value={student.email} copyValue={student.email} copyKey="Email" />
        <InfoRow
          icon={Phone}
          label="Phone Number"
          value={student.phone || NOT_PROVIDED}
          copyValue={student.phone || undefined}
          copyKey="Phone"
        />
        <InfoRow
          icon={User}
          label="Gender"
          value={(student.gender && GENDER_LABELS[student.gender]) || "Not specified"}
        />
        <InfoRow icon={CalendarDays} label="Date of Birth" value={formatBirthDate(student.date_of_birth)} />
      </DetailCard>
    </UserDetailView>
  );
}
