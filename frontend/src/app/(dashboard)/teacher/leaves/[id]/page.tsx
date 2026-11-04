"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, User, Calendar, Hash } from "lucide-react";
import toast from "react-hot-toast";
import api, { getApiErrorMessage } from "@/lib/api";
import Breadcrumb from "@/components/ui/Breadcrumb";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import PageSkeleton from "@/components/ui/PageSkeleton";
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

  if (loading) return <PageSkeleton text="Loading leave application & attached records..." />;
  if (!leave) return <div className="text-center py-20 text-muted-foreground">Leave application not found.</div>;

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
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      <Breadcrumb
        items={[
          { label: "Faculty", href: "/teacher/dashboard" },
          { label: "Leave Requests", href: "/teacher/leaves" },
          { label: `Review: ${leave.student_name}` },
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <PageHeader
          title="Leave Application Adjudication"
          description={`Formal faculty review and verification of student leave application #${leave.id.slice(0, 8)}`}
        />
        <Button
          variant="ghost"
          icon={<ArrowLeft size={15} />}
          onClick={() => router.push("/teacher/leaves")}
        >
          Back to Leave Roster
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-6 bg-card border border-border space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-border">
              <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-semibold text-lg shrink-0">
                <User size={22} />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-primary truncate">{leave.student_name}</h3>
                <p className="text-xs text-muted-foreground font-mono flex items-center gap-1.5 mt-0.5">
                  <Hash size={12} />
                  <span>{leave.enrollment_number}</span>
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-lg bg-secondary/40 border border-border flex items-center gap-3">
                <Calendar size={18} className="text-accent-strong shrink-0" />
                <div>
                  <span className="text-xs font-semibold text-muted-foreground block">Leave Duration</span>
                  <span className="font-medium text-primary text-xs">{fromDate} – {toDate}</span>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-muted-foreground block mb-1">
                  Reason Stated by Student
                </span>
                <div className="p-3.5 rounded-lg bg-secondary/25 border border-border text-primary text-xs leading-relaxed">
                  {leave.reason}
                </div>
              </div>
            </div>
          </Card>

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
