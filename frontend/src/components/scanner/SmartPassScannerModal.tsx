"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { QrCode, X, CheckCircle2, AlertCircle, Camera, RefreshCw } from "lucide-react";
import api, { getApiErrorMessage } from "@/lib/api";
import GlassButton from "@/components/ui/GlassButton";
import GlassInput from "@/components/ui/GlassInput";
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

  useEffect(() => {
    let animId: number;
    let detector: unknown = null;
    let scanning = true;

    if (cameraActive && typeof window !== "undefined" && "BarcodeDetector" in window) {
      try {
        const BarcodeDetectorClass = (
          window as unknown as {
            BarcodeDetector: new (opts: { formats: string[] }) => {
              detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue: string }>>;
            };
          }
        ).BarcodeDetector;
        detector = new BarcodeDetectorClass({ formats: ["qr_code"] });
      } catch {
        detector = null;
      }
    }

    const scanFrame = async () => {
      if (!scanning) return;
      if (detector && videoRef.current && videoRef.current.readyState >= 2 && !loading) {
        try {
          const det = detector as { detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue: string }>> };
          const barcodes = await det.detect(videoRef.current);
          if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
            const detectedVal = barcodes[0].rawValue.trim();
            if (detectedVal) {
              scanning = false;
              setManualToken(detectedVal);
              await verifyToken(detectedVal);
              return;
            }
          }
        } catch {
          // Ignore transient frame detection error
        }
      }
      if (scanning) {
        animId = requestAnimationFrame(scanFrame);
      }
    };

    if (cameraActive && detector) {
      animId = requestAnimationFrame(scanFrame);
    }

    return () => {
      scanning = false;
      if (animId) cancelAnimationFrame(animId);
    };
  }, [cameraActive, loading, verifyToken]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
      <div className="relative w-full max-w-lg overflow-hidden rounded-xl border border-border bg-card p-6 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
              <QrCode size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Smart Pass Verification</h3>
              <p className="text-xs text-muted-foreground">Scan rotating QR pass or enter security token</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="my-4 relative rounded-lg overflow-hidden bg-slate-100 border border-border aspect-video flex items-center justify-center">
          {cameraActive ? (
            <>
              <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-44 h-44 border-2 border-emerald-500 rounded-lg relative animate-pulse">
                  <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-emerald-500" />
                  <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-emerald-500" />
                  <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-emerald-500" />
                  <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-emerald-500" />
                </div>
              </div>
            </>
          ) : (
            <div className="text-center p-6 space-y-2">
              <Camera size={28} className="mx-auto text-muted-foreground" />
              <p className="text-xs text-muted-foreground">{cameraError || "Camera ready to initialize"}</p>
              <GlassButton variant="secondary" size="sm" onClick={startCamera}>
                <RefreshCw size={13} className="mr-1" /> Initialize Camera
              </GlassButton>
            </div>
          )}
        </div>

        {feedback && (
          <div
            className={`mb-3 p-2.5 rounded-md border flex items-center gap-2 text-xs font-medium ${
              feedback.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            {feedback.type === "success" ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
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
