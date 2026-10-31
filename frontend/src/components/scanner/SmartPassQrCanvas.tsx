"use client";

import React from "react";
import { QRCodeSVG } from "qrcode.react";
import { RefreshCw } from "lucide-react";
import type { TeacherSmartPassResponse } from "@/types";

interface SmartPassQrCanvasProps {
  passData: TeacherSmartPassResponse | null;
  qrSize: number;
  loading: boolean;
  isUrgent: boolean;
  secondsRemaining: number;
}

export default function SmartPassQrCanvas({
  passData,
  qrSize,
  loading,
  isUrgent,
  secondsRemaining,
}: SmartPassQrCanvasProps): React.ReactElement {
  return (
    <div className="my-6 flex flex-col items-center justify-center">
      <div className="relative rounded-2xl p-4 bg-white border-2 border-[#247653]/30 shadow-inner flex items-center justify-center">
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
            className="flex items-center justify-center text-[#526f78] text-xs"
          >
            <RefreshCw size={24} className="animate-spin text-[#247653]" />
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-col items-center gap-1.5">
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            isUrgent
              ? "bg-[#b54242]/10 text-[#b54242] border border-[#b54242]/20"
              : "bg-[#247653]/10 text-[#247653] border border-[#247653]/20"
          }`}
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          <span>Auto-refreshes in {secondsRemaining}s</span>
        </div>
        <p className="text-xs text-[#526f78] mt-1 text-center">
          Scan with mobile device to record attendance
        </p>
      </div>
    </div>
  );
}
