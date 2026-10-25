"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import { QrCode, X, Copy, Check, RefreshCw, Maximize2, Minimize2, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import api, { getApiErrorMessage } from "@/lib/api";
import { getWebSocket } from "@/lib/websocket";
import GlassButton from "@/components/ui/GlassButton";
import type { TeacherSmartPassResponse } from "@/types";

interface SmartPassGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  className?: string;
  initialVerifiedCount?: number;
  onStudentVerified?: () => void;
}

export default function SmartPassGeneratorModal({
  isOpen,
  onClose,
  sessionId,
  className = "Class Session",
  initialVerifiedCount = 0,
  onStudentVerified,
}: SmartPassGeneratorModalProps): React.ReactElement | null {
  const [passData, setPassData] = useState<TeacherSmartPassResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(5);
  const [verifiedCount, setVerifiedCount] = useState(initialVerifiedCount);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchPass = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get<TeacherSmartPassResponse>(`/teacher/sessions/${sessionId}/smart-pass`);
      setPassData(data);
      setSecondsRemaining(data.refresh_interval_seconds || 5);
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Failed to generate Smart Pass QR"));
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (!isOpen) {
      if (timerRef.current) clearInterval(timerRef.current);
      setPassData(null);
      setFullscreen(false);
      return;
    }

    void fetchPass();

    const ws = getWebSocket();
    ws.connect();
    const unsubscribe = ws.on("attendance_updated", (eventData: Record<string, unknown>) => {
      if (eventData.session_id === sessionId) {
        setVerifiedCount((prev) => prev + 1);
        if (onStudentVerified) onStudentVerified();
      }
    });

    timerRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          void fetchPass();
          return 5;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      unsubscribe();
    };
  }, [isOpen, sessionId, fetchPass, onStudentVerified]);

  const handleCopy = async () => {
    if (!passData?.qr_token) return;
    try {
      await navigator.clipboard.writeText(passData.qr_token);
      setCopied(true);
      toast.success("Security token copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy token");
    }
  };

  if (!isOpen) return null;

  const isUrgent = secondsRemaining <= 2;
  const qrSize = fullscreen ? 360 : 220;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div
        className={`relative w-full overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-2xl transition-all duration-300 ${
          fullscreen ? "max-w-3xl py-10" : "max-w-lg"
        }`}
      >
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <QrCode size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Dynamic Smart Pass QR</h3>
              <p className="text-xs text-muted-foreground">{className} • Session ID: {sessionId.slice(0, 8)}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setFullscreen((prev) => !prev)}
              aria-label={fullscreen ? "Exit Projector Mode" : "Enter Projector Mode"}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              title={fullscreen ? "Exit Projector Mode" : "Projector Mode"}
            >
              {fullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="my-6 flex flex-col items-center justify-center">
          <div className="relative rounded-2xl p-4 bg-white border-2 border-emerald-500/30 shadow-inner flex items-center justify-center">
            {passData ? (
              <QRCodeSVG
                value={passData.qr_token}
                size={qrSize}
                level="M"
                includeMargin={false}
                className="transition-all duration-300"
              />
            ) : (
              <div
                style={{ width: qrSize, height: qrSize }}
                className="flex items-center justify-center text-slate-400 text-xs"
              >
                <RefreshCw size={24} className="animate-spin text-emerald-500" />
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center gap-3">
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                isUrgent
                  ? "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                  : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
              }`}
            >
              <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
              <span>Rotates in {secondsRemaining}s</span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <ShieldCheck size={13} />
              <span>Encrypted JWT</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-2 border-t border-border">
          <div className="flex items-center justify-between text-xs px-1 text-muted-foreground">
            <span>Live check-ins this session:</span>
            <span className="font-bold text-foreground">{verifiedCount} scanned</span>
          </div>

          <div className="flex gap-2">
            <GlassButton
              variant="secondary"
              className="flex-1 text-xs"
              icon={copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              onClick={() => void handleCopy()}
              disabled={!passData}
            >
              {copied ? "Copied Token" : "Copy Security Token"}
            </GlassButton>
            <GlassButton
              variant="primary"
              className="flex-1 text-xs"
              icon={<RefreshCw size={14} className={loading ? "animate-spin" : ""} />}
              onClick={() => void fetchPass()}
              loading={loading}
            >
              Rotate Now
            </GlassButton>
          </div>
        </div>
      </div>
    </div>
  );
}
