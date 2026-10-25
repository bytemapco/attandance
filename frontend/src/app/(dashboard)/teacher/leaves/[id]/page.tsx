"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, CheckCircle2, XCircle, FileText, Image as ImageIcon, 
  ExternalLink, Download, AlertCircle, Loader2, User, Calendar, 
  Hash, ShieldCheck 
} from "lucide-react";
import toast from "react-hot-toast";
import api, { getApiErrorMessage } from "@/lib/api";
import GlassBreadcrumb from "@/components/ui/GlassBreadcrumb";
import GlassPageHeader from "@/components/ui/GlassPageHeader";
import GlassCard from "@/components/ui/GlassCard";
import GlassButton from "@/components/ui/GlassButton";
import GlassLoader from "@/components/ui/GlassLoader";
import type { PendingLeaveItem } from "@/types";

export default function LeaveReviewDetailPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [leave, setLeave] = useState<PendingLeaveItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [approverNote, setApproverNote] = useState("");
  const [docLoadError, setDocLoadError] = useState(false);
  const [docLoading, setDocLoading] = useState(true);

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
    return () => { mounted = false; };
  }, [id, router]);

  const handleDecisionSubmit = async (status: "APPROVED" | "REJECTED"): Promise<void> => {
    if (!leave) return;
    setSubmitting(true);
    try {
      await api.put(`/teacher/leaves/${leave.id}/approve`, {
        status,
        approver_note: approverNote.trim() || undefined,
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
  if (!leave) return <div className="text-center py-20 text-muted-foreground">Leave application not found.</div>;

  const url = leave.document_url;
  const isPdf = url ? url.toLowerCase().split("?")[0].endsWith(".pdf") : false;
  const fromDate = new Date(leave.start_date).toLocaleDateString(undefined, {
    weekday: "short", year: "numeric", month: "short", day: "numeric",
  });
  const toDate = new Date(leave.end_date).toLocaleDateString(undefined, {
    weekday: "short", year: "numeric", month: "short", day: "numeric",
  });

  return (
    <div className="space-y-6 pb-12 animate-fade-in-up max-w-7xl mx-auto">
      <GlassBreadcrumb
        items={[
          { label: "Faculty", href: "/teacher/classes" },
          { label: "Leave Requests", href: "/teacher/leaves" },
          { label: `Review: ${leave.student_name}` },
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
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
        {/* Left Column: Student Details & Adjudication Controls */}
        <div className="lg:col-span-5 space-y-6">
          {/* Student Profile Card */}
          <GlassCard className="p-6 bg-card border border-border space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-border">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg shrink-0">
                <User size={22} />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-foreground truncate">{leave.student_name}</h3>
                <p className="text-xs text-muted-foreground font-mono flex items-center gap-1.5 mt-0.5">
                  <Hash size={12} />
                  <span>{leave.enrollment_number}</span>
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-secondary/30 border border-border flex items-center gap-3">
                <Calendar size={18} className="text-primary shrink-0" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">Leave Duration</span>
                  <span className="font-semibold text-foreground text-xs">{fromDate} – {toDate}</span>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-muted-foreground block mb-1">
                  Reason Stated by Student
                </span>
                <div className="p-3.5 rounded-xl bg-secondary/20 border border-border text-foreground text-xs leading-relaxed">
                  {leave.reason}
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Adjudication Decision Card */}
          <GlassCard className="p-6 bg-card border border-border space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-border">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Faculty Decision</h3>
                <p className="text-xs text-muted-foreground">Approve or reject this request with mandatory feedback.</p>
              </div>
            </div>

            <div>
              <label htmlFor="approver-note" className="text-xs font-semibold text-foreground block mb-1.5">
                Faculty Remarks / Justification <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
              </label>
              <textarea
                id="approver-note"
                rows={3}
                value={approverNote}
                onChange={(e) => setApproverNote(e.target.value)}
                placeholder="Add contextual remarks or notes for the student's academic record..."
                maxLength={300}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all resize-y"
              />
              <div className="flex justify-end mt-1 text-[11px] text-muted-foreground font-mono">
                {approverNote.length}/300
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => void handleDecisionSubmit("REJECTED")}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20 font-semibold text-xs transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                <XCircle size={16} />
                <span>Reject Leave</span>
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={() => void handleDecisionSubmit("APPROVED")}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 size={16} />
                <span>Approve Leave</span>
              </button>
            </div>
          </GlassCard>
        </div>

        {/* Right Column: Supporting Documentation Inspector */}
        <div className="lg:col-span-7 space-y-4">
          <GlassCard className="p-0 overflow-hidden bg-card border border-border flex flex-col h-full min-h-[550px]">
            {/* Document Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-secondary/30">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  {isPdf ? <FileText size={16} /> : <ImageIcon size={16} />}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">Attached Document Evidence</h4>
                  <p className="text-[11px] text-muted-foreground">
                    {url ? (isPdf ? "Adobe PDF Document" : "Medical Certificate / Image Proof") : "No Document Attached"}
                  </p>
                </div>
              </div>

              {url && (
                <div className="flex items-center gap-2">
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-medium text-foreground hover:bg-secondary transition-colors"
                  >
                    <ExternalLink size={13} />
                    <span>Open in Tab</span>
                  </a>
                  <a
                    href={url}
                    download
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-medium text-foreground hover:bg-secondary transition-colors"
                  >
                    <Download size={13} />
                    <span>Download</span>
                  </a>
                </div>
              )}
            </div>

            {/* Document Viewer Body */}
            <div className="flex-1 p-4 bg-secondary/10 flex items-center justify-center relative min-h-[450px]">
              {!url ? (
                <div className="text-center py-16 text-muted-foreground space-y-2">
                  <FileText size={40} className="mx-auto text-muted-foreground/40 mb-2" />
                  <p className="text-xs font-semibold text-foreground">No supporting document uploaded</p>
                  <p className="text-[11px] max-w-xs text-muted-foreground">
                    Student submitted this leave request without an attached medical prescription or event permission slip.
                  </p>
                </div>
              ) : isPdf ? (
                <iframe
                  src={url}
                  title="Leave Document Evidence"
                  className="w-full h-full min-h-[500px] rounded-xl border border-border shadow-xs"
                />
              ) : docLoadError ? (
                <div className="text-center py-16 space-y-3">
                  <AlertCircle size={36} className="mx-auto text-rose-500 mb-1" />
                  <p className="text-xs font-semibold text-foreground">Preview cannot be rendered in frame</p>
                  <p className="text-[11px] text-muted-foreground max-w-xs">
                    Please use the download or external tab links above to view this attached proof.
                  </p>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium"
                  >
                    <ExternalLink size={14} /> Open Document
                  </a>
                </div>
              ) : (
                <div className="relative flex items-center justify-center w-full h-full">
                  {docLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                      <Loader2 size={24} className="animate-spin text-primary" />
                    </div>
                  )}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt="Supporting leave document"
                    onLoad={() => setDocLoading(false)}
                    onError={() => {
                      setDocLoading(false);
                      setDocLoadError(true);
                    }}
                    className="max-h-[600px] max-w-full rounded-xl object-contain border border-border shadow-sm"
                  />
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
