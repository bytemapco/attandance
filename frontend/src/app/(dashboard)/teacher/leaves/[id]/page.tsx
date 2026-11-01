"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, User, Calendar, Hash } from "lucide-react";
import toast from "react-hot-toast";
import api, { getApiErrorMessage } from "@/lib/api";
import GlassBreadcrumb from "@/components/ui/GlassBreadcrumb";
import GlassPageHeader from "@/components/ui/GlassPageHeader";
import GlassCard from "@/components/ui/GlassCard";
import GlassButton from "@/components/ui/GlassButton";
import GlassLoader from "@/components/ui/GlassLoader";
import LeaveDecisionCard from "@/components/teacher/LeaveDecisionCard";
import LeaveDocumentViewer from "@/components/teacher/LeaveDocumentViewer";
import type { PendingLeaveItem } from "@/types";

export default function LeaveReviewDetailPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [leave, setLeave] = useState<PendingLeaveItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadLeave(): Promise<void> {
      try {
        const { data } = await api.get<PendingLeaveItem[]>("/teacher/leaves/pending");
        const found = data.find((item) => item.id === id);
        if (mounted) {
          if (found) {
            setLeave(found);
          } else {
            toast.error("Leave request not found or already adjudicated.");
            router.push("/teacher/leaves");
          }
        }
      } catch (err: unknown) {
        if (mounted) {
          toast.error(getApiErrorMessage(err, "Failed to load leave request"));
          router.push("/teacher/leaves");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void loadLeave();
    return () => {
      mounted = false;
    };
  }, [id, router]);

  const handleDecisionSubmit = async (
    status: "APPROVED" | "REJECTED",
    approverNote?: string
  ): Promise<void> => {
    if (!leave) return;
    setSubmitting(true);
    try {
      await api.put(`/teacher/leaves/${leave.id}/approve`, {
        status,
        approver_note: approverNote,
      });

      toast.success(`Leave request ${status.toLowerCase()} successfully!`);
      router.push("/teacher/leaves");
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Failed to process leave adjudication."));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <GlassLoader text="Loading leave application & attached records..." />;
  if (!leave) return <div className="text-center py-20 text-[#526f78]">Leave application not found.</div>;

  const fromDate = new Date(leave.start_date).toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const toDate = new Date(leave.end_date).toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="space-y-6 pb-12 animate-fade-in max-w-7xl mx-auto">
      <GlassBreadcrumb
        items={[
          { label: "Faculty", href: "/teacher/dashboard" },
          { label: "Leave Requests", href: "/teacher/leaves" },
          { label: `Review: ${leave.student_name}` },
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#e3e1dc] pb-4">
        <GlassPageHeader
          title="Leave Application Adjudication"
          description={`Formal faculty review and verification of student leave application #${leave.id.slice(0, 8)}`}
        />
        <GlassButton
          variant="ghost"
          icon={<ArrowLeft size={15} />}
          onClick={() => router.push("/teacher/leaves")}
        >
          Back to Leave Roster
        </GlassButton>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-6">
          <GlassCard className="p-6 bg-card border border-[#e3e1dc] space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-[#e3e1dc]">
              <div className="w-12 h-12 rounded-xl bg-[#28363b]/10 text-[#28363b] flex items-center justify-center font-bold text-lg shrink-0">
                <User size={22} />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-[#28363b] truncate">{leave.student_name}</h3>
                <p className="text-xs text-[#526f78] font-mono flex items-center gap-1.5 mt-0.5">
                  <Hash size={12} />
                  <span>{leave.enrollment_number}</span>
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-[#eeece7]/40 border border-[#e3e1dc] flex items-center gap-3">
                <Calendar size={18} className="text-[#c98260] shrink-0" />
                <div>
                  <span className="text-[10px] uppercase font-semibold text-[#526f78] block">Leave Duration</span>
                  <span className="font-medium text-[#28363b] text-xs">{fromDate} – {toDate}</span>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-[#526f78] block mb-1">
                  Reason Stated by Student
                </span>
                <div className="p-3.5 rounded-xl bg-[#eeece7]/25 border border-[#e3e1dc] text-[#28363b] text-xs leading-relaxed">
                  {leave.reason}
                </div>
              </div>
            </div>
          </GlassCard>

          <LeaveDecisionCard
            submitting={submitting}
            onDecision={handleDecisionSubmit}
          />
        </div>

        <div className="lg:col-span-7 space-y-4">
          <LeaveDocumentViewer url={leave.document_url} />
        </div>
      </div>
    </div>
  );
}
