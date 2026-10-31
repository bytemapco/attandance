"use client";

import React, { useState } from "react";
import { FileText, Image as ImageIcon, ExternalLink, Download, AlertCircle, Loader2 } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";

interface LeaveDocumentViewerProps {
  url: string | null | undefined;
}

export default function LeaveDocumentViewer({ url }: LeaveDocumentViewerProps): React.ReactElement {
  const [docLoadError, setDocLoadError] = useState(false);
  const [docLoading, setDocLoading] = useState(true);

  const isPdf = url ? url.toLowerCase().split("?")[0].endsWith(".pdf") : false;

  return (
    <GlassCard className="p-0 overflow-hidden bg-card border border-[#e3e1dc] flex flex-col h-full min-h-[550px]">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#e3e1dc] bg-[#eeece7]/40">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#247653]/10 text-[#247653]">
            {isPdf ? <FileText size={16} /> : <ImageIcon size={16} />}
          </div>
          <div>
            <h4 className="text-xs font-semibold text-[#28363b]">Attached Document Evidence</h4>
            <p className="text-[11px] text-[#526f78]">
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#e3e1dc] bg-white text-xs font-medium text-[#28363b] hover:bg-[#eeece7] transition-colors"
            >
              <ExternalLink size={13} />
              <span>Open in Tab</span>
            </a>
            <a
              href={url}
              download
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#e3e1dc] bg-white text-xs font-medium text-[#28363b] hover:bg-[#eeece7] transition-colors"
            >
              <Download size={13} />
              <span>Download</span>
            </a>
          </div>
        )}
      </div>

      <div className="flex-1 p-4 bg-[#eeece7]/15 flex items-center justify-center relative min-h-[450px]">
        {!url ? (
          <div className="text-center py-16 text-[#526f78] space-y-2">
            <FileText size={40} className="mx-auto text-[#526f78]/40 mb-2" />
            <p className="text-xs font-semibold text-[#28363b]">No supporting document uploaded</p>
            <p className="text-[11px] max-w-xs text-[#526f78]">
              Student submitted this leave request without an attached medical prescription or event permission slip.
            </p>
          </div>
        ) : isPdf ? (
          <iframe
            src={url}
            title="Leave Document Evidence"
            className="w-full h-full min-h-[500px] rounded-xl border border-[#e3e1dc] shadow-xs"
          />
        ) : docLoadError ? (
          <div className="text-center py-16 space-y-3">
            <AlertCircle size={36} className="mx-auto text-[#b54242] mb-1" />
            <p className="text-xs font-semibold text-[#28363b]">Preview cannot be rendered in frame</p>
            <p className="text-[11px] text-[#526f78] max-w-xs">
              Please use the download or external tab links above to view this attached proof.
            </p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#28363b] text-white text-xs font-medium hover:bg-[#202b30] transition-colors"
            >
              <ExternalLink size={14} /> Open Document
            </a>
          </div>
        ) : (
          <div className="relative flex items-center justify-center w-full h-full">
            {docLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/50">
                <Loader2 size={24} className="animate-spin text-[#28363b]" />
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
              className="max-h-[600px] max-w-full rounded-xl object-contain border border-[#e3e1dc] shadow-xs"
            />
          </div>
        )}
      </div>
    </GlassCard>
  );
}
