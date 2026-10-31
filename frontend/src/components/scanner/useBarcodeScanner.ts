"use client";

import { useEffect, type RefObject } from "react";

interface UseBarcodeScannerProps {
  cameraActive: boolean;
  videoRef: RefObject<HTMLVideoElement | null>;
  loading: boolean;
  onDetect: (token: string) => void;
}

export function useBarcodeScanner({
  cameraActive,
  videoRef,
  loading,
  onDetect,
}: UseBarcodeScannerProps): void {
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
              onDetect(detectedVal);
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
  }, [cameraActive, loading, onDetect, videoRef]);
}
