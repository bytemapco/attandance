"use client";

import React, { useState } from "react";
import { X, ExternalLink, Download, FileText, Image as ImageIcon, AlertCircle, Loader2 } from "lucide-react";
import type { PendingLeaveItem } from "@/types";

interface LeaveDocumentModalProps {
  leave: PendingLeaveItem | null;
  onClose: () => void;
}

export default function LeaveDocumentModal({ leave, onClose }: LeaveDocumentModalProps): React.ReactElement | null {
  const [loadError, setLoadError] = useState(false);
  const [loading, setLoading] = useState(true);

  if (!leave || !leave.document_url) return null;

  const url = leave.document_url;
  const isPdf = url.toLowerCase().split("?")[0].endsWith(".pdf");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-secondary/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              {isPdf ? <FileText size={18} /> : <ImageIcon size={18} />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Supporting Document
              </h3>
              <p className="text-xs text-muted-foreground">
                {leave.student_name} ({leave.enrollment_number})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              title="Open in new tab"
            >
              <ExternalLink size={16} />
            </a>
            <a
              href={url}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              title="Download"
            >
              <Download size={16} />
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              title="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-secondary/20 min-h-[300px] relative">
          {isPdf ? (
            <iframe
              src={url}
              title="Leave Document Preview"
              className="w-full h-[500px] rounded-xl border border-border"
            />
          ) : loadError ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
              <AlertCircle size={36} className="text-rose-500 mb-3" />
              <p className="text-sm font-semibold text-foreground mb-1">Unable to preview document directly</p>
              <p className="text-xs text-muted-foreground mb-4 max-w-xs">
                The document couldn&apos;t be rendered in-browser. You can still open it in a new tab or download it directly.
              </p>

              <div className="flex gap-2">
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium transition-opacity hover:opacity-90"
                >
                  <ExternalLink size={14} /> Open in New Tab
                </a>
              </div>
            </div>
          ) : (
            <>
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-xs">
                  <Loader2 size={24} className="animate-spin text-primary" />
                </div>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}


                alt="Leave Supporting Document"
                onLoad={() => setLoading(false)}
                onError={() => {
                  setLoading(false);
                  setLoadError(true);
                }}
                className="max-h-[500px] max-w-full rounded-xl object-contain border border-border shadow-md"
              />
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-border bg-card flex items-center justify-between text-xs text-muted-foreground">
          <span className="truncate max-w-md">Reason: <strong className="text-foreground font-medium">{leave.reason}</strong></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-secondary hover:bg-muted text-foreground transition-colors font-medium border border-border shrink-0 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
