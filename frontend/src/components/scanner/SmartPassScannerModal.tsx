"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { QrCode, X, CheckCircle2, AlertCircle } from "lucide-react";
import api, { getApiErrorMessage } from "@/lib/api";
import GlassButton from "@/components/ui/GlassButton";
import GlassInput from "@/components/ui/GlassInput";
import ScannerCameraViewport from "@/components/scanner/ScannerCameraViewport";
import { useBarcodeScanner } from "@/components/scanner/useBarcodeScanner";
import type { SmartPassVerifyResponse } from "@/types";

interface SmartPassScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  onSuccess: (response: SmartPassVerifyResponse) => void;
}

export default function SmartPassScannerModal({
  isOpen,
  onClose,
  sessionId,
  onSuccess,
}: SmartPassScannerModalProps): React.ReactElement | null {
  const [manualToken, setManualToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const startCamera = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera API is not supported on this device/browser.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
      setCameraError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to access camera";
      setCameraError(msg);
      setCameraActive(false);
    }
  }, []);

  useEffect(() => {
    let unmounted = false;
    if (isOpen) {
      void (async () => {
        if (!unmounted) {
          await startCamera();
        }
      })();
    }
    return () => {
      unmounted = true;
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  const verifyToken = useCallback(
    async (tokenToVerify: string) => {
      const trimmed = tokenToVerify.trim();
      if (!trimmed) {
        setFeedback({ type: "error", message: "Please provide a valid Smart Pass QR token." });
        return;
      }

      setLoading(true);
      setFeedback(null);

      try {
        const { data } = await api.post<SmartPassVerifyResponse>("/teacher/smart-pass/verify", {
          qr_token: trimmed,
          session_id: sessionId,
        });

        setFeedback({ type: "success", message: data.message });
        onSuccess(data);
        setManualToken("");
      } catch (err: unknown) {
        setFeedback({ type: "error", message: getApiErrorMessage(err, "Verification failed") });
      } finally {
        setLoading(false);
      }
    },
    [sessionId, onSuccess]
  );

  useBarcodeScanner({
    cameraActive,
    videoRef,
    loading,
    onDetect: (token) => {
      setManualToken(token);
      void verifyToken(token);
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#28363b]/50 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-[#e3e1dc] bg-card p-6 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-[#e3e1dc]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#247653]/10 text-[#247653] border border-[#247653]/20">
              <QrCode size={18} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#28363b]">Smart Pass Verification</h3>
              <p className="text-xs text-[#526f78]">Scan rotating QR pass or enter security token</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#526f78] hover:text-[#28363b] hover:bg-[#eeece7] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <ScannerCameraViewport
          cameraActive={cameraActive}
          cameraError={cameraError}
          videoRef={videoRef}
          onStartCamera={startCamera}
        />

        {feedback && (
          <div
            className={`mb-3 p-3 rounded-xl border flex items-center gap-2 text-xs font-medium ${
              feedback.type === "success"
                ? "bg-[#247653]/10 border-[#247653]/30 text-[#247653]"
                : "bg-[#b54242]/10 border-[#b54242]/30 text-[#b54242]"
            }`}
          >
            {feedback.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{feedback.message}</span>
          </div>
        )}

        <div className="space-y-3">
          <GlassInput
            label="Smart Pass Token"
            placeholder="Paste rotating QR token payload..."
            value={manualToken}
            onChange={(e) => setManualToken(e.target.value)}
          />
          <GlassButton
            variant="primary"
            className="w-full"
            loading={loading}
            onClick={() => verifyToken(manualToken)}
            disabled={!manualToken.trim()}
          >
            Verify Token & Mark Attendance
          </GlassButton>
        </div>
      </div>
    </div>
  );
}
