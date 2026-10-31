"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { QrCode, X, RefreshCw, Maximize2, Minimize2 } from "lucide-react";
import toast from "react-hot-toast";
import api, { getApiErrorMessage } from "@/lib/api";
import { getWebSocket } from "@/lib/websocket";
import GlassButton from "@/components/ui/GlassButton";
import SmartPassQrCanvas from "@/components/scanner/SmartPassQrCanvas";
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

  if (!isOpen) return null;

  const isUrgent = secondsRemaining <= 2;
  const qrSize = fullscreen ? 360 : 220;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#28363b]/70 backdrop-blur-md animate-fade-in">
      <div
        className={`relative w-full overflow-hidden rounded-2xl border border-[#e3e1dc] bg-card p-6 shadow-2xl transition-all duration-300 ${
          fullscreen ? "max-w-3xl py-10" : "max-w-lg"
        }`}
      >
        <div className="flex items-center justify-between pb-4 border-b border-[#e3e1dc]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#247653]/10 text-[#247653] border border-[#247653]/20">
              <QrCode size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#28363b]">Smart Pass QR</h3>
              <p className="text-xs text-[#526f78]">{className}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setFullscreen((prev) => !prev)}
              aria-label={fullscreen ? "Exit Projector Mode" : "Enter Projector Mode"}
              className="p-1.5 rounded-lg text-[#526f78] hover:text-[#28363b] hover:bg-[#eeece7] transition-colors"
              title={fullscreen ? "Exit Projector Mode" : "Projector Mode"}
            >
              {fullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="p-1.5 rounded-lg text-[#526f78] hover:text-[#28363b] hover:bg-[#eeece7] transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <SmartPassQrCanvas
          passData={passData}
          qrSize={qrSize}
          loading={loading}
          isUrgent={isUrgent}
          secondsRemaining={secondsRemaining}
        />

        <div className="flex items-center justify-between pt-3 border-t border-[#e3e1dc]">
          <div className="flex items-center gap-2 text-xs text-[#526f78]">
            <span>Live check-ins:</span>
            <span className="font-semibold text-sm text-[#28363b]">
              {verifiedCount} {verifiedCount === 1 ? "student" : "students"}
            </span>
          </div>

          <GlassButton
            variant="ghost"
            size="sm"
            icon={<RefreshCw size={13} className={loading ? "animate-spin" : ""} />}
            onClick={() => void fetchPass()}
            loading={loading}
          >
            Refresh QR
          </GlassButton>
        </div>
      </div>
    </div>
  );
}
