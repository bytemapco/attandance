"use client";

import React from "react";
import { useParams } from "next/navigation";
import { Briefcase, Building2, Hash, Mail, Phone, User } from "lucide-react";
import { useAccountDetail } from "@/hooks/useAccountDetail";
import DetailCard from "@/components/admin/user-detail/DetailCard";
import InfoRow from "@/components/admin/user-detail/InfoRow";
import MetaChip from "@/components/admin/user-detail/MetaChip";
import UserDetailView from "@/components/admin/user-detail/UserDetailView";
import Badge from "@/components/ui/Badge";
import PageSkeleton from "@/components/ui/PageSkeleton";
import type { TeacherResponse } from "@/types";

const NOT_PROVIDED = "Not provided";
const NOT_ASSIGNED = "Not assigned";

export default function TeacherDetailPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const { account: teacher, loading } = useAccountDetail<TeacherResponse>("teachers", id, "Failed to load teacher");

  if (loading) return <PageSkeleton text="Loading faculty details..." />;
  if (!teacher) return <div className="text-center py-20 text-muted-foreground">Faculty member not found</div>;

  const fullName = `${teacher.first_name} ${teacher.last_name}`;

  return (
    <UserDetailView
      breadcrumb={[
        { label: "Admin", href: "/admin/dashboard" },
        { label: "Teachers", href: "/admin/users/teachers" },
        { label: fullName },
      ]}
      account={teacher}
      initials={(teacher.first_name?.[0] || "") + (teacher.last_name?.[0] || "")}
      fullName={fullName}
      badge={<Badge variant="info" icon={<span className="w-1.5 h-1.5 rounded-full bg-info" />}>Faculty</Badge>}
      identifier={{ label: "Employee ID", value: teacher.employee_id, hint: "Click to copy employee ID" }}
      chips={
        <>
          {teacher.department && <MetaChip icon={Building2}>{teacher.department}</MetaChip>}
          {teacher.designation && <MetaChip icon={Briefcase}>{teacher.designation}</MetaChip>}
        </>
      }
      editHref={`/admin/users/teachers/${id}/edit`}
    >
      <DetailCard icon={Briefcase} title="Institutional assignment" subtitle="Department & role">
        <InfoRow
          icon={Hash}
          label="Employee ID"
          value={teacher.employee_id}
          copyValue={teacher.employee_id}
          copyKey="Employee ID"
        />
        <InfoRow icon={Building2} label="Department" value={teacher.department || NOT_ASSIGNED} />
        <InfoRow icon={Briefcase} label="Designation" value={teacher.designation || NOT_ASSIGNED} />
      </DetailCard>

      <DetailCard icon={User} title="Personal information" subtitle="Contact & identity">
        <InfoRow icon={Mail} label="Email Address" value={teacher.email} copyValue={teacher.email} copyKey="Email" />
        <InfoRow
          icon={Phone}
          label="Phone Number"
          value={teacher.phone || NOT_PROVIDED}
          copyValue={teacher.phone || undefined}
          copyKey="Phone"
        />
      </DetailCard>
    </UserDetailView>
  );
}
