"use client";

import React from "react";
import { Camera, RefreshCw } from "lucide-react";
import GlassButton from "@/components/ui/GlassButton";

interface ScannerCameraViewportProps {
  cameraActive: boolean;
  cameraError: string | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onStartCamera: () => void;
}

export default function ScannerCameraViewport({
  cameraActive,
  cameraError,
  videoRef,
  onStartCamera,
}: ScannerCameraViewportProps): React.ReactElement {
  return (
    <div className="my-4 relative rounded-xl overflow-hidden bg-secondary border border-[#e3e1dc] aspect-video flex items-center justify-center">
      {cameraActive ? (
        <>
          <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-44 h-44 border-2 border-[#247653] rounded-xl relative animate-pulse">
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#247653]" />
              <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#247653]" />
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#247653]" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#247653]" />
            </div>
          </div>
        </>
      ) : (
        <div className="text-center p-6 space-y-2">
          <Camera size={28} className="mx-auto text-[#526f78]" />
          <p className="text-xs text-[#526f78]">{cameraError || "Camera ready to initialize"}</p>
          <GlassButton variant="secondary" size="sm" onClick={onStartCamera}>
            <RefreshCw size={13} className="mr-1" /> Initialize Camera
          </GlassButton>
        </div>
      )}
    </div>
  );
}
