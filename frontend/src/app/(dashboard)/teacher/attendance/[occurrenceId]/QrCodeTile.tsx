"use client";

import React from "react";
import { QRCodeSVG } from "qrcode.react";
import type { OccurrenceQrData } from "@/types";

interface QrCodeTileProps {
  qr: OccurrenceQrData | null;
  failed: boolean;
}

export default function QrCodeTile({ qr, failed }: QrCodeTileProps): React.ReactElement {
  const rotation = qr?.refresh_interval_seconds ?? 5;
  return (
    <div>
      <div className="mx-auto w-full max-w-[260px] rounded-[14px] border border-border bg-white p-3">
        {qr ? (
          <QRCodeSVG value={qr.qr_token} className="h-auto w-full" size={512} level="M" fgColor="#28363B" aria-label="Attendance QR code" />
        ) : (
          <div className="flex aspect-square items-center justify-center text-xs text-muted-foreground">
            {failed ? "Reconnecting…" : "Preparing code…"}
          </div>
        )}
      </div>
      <div className="mx-auto mt-3 h-1 w-full max-w-[260px] overflow-hidden rounded-full bg-secondary">
        {qr && (
          <div
            key={qr.qr_token}
            className="qr-countdown-bar h-full origin-left rounded-full bg-[#c98260]"
            style={{ animation: `qr-countdown ${rotation}s linear forwards` }}
          />
        )}
      </div>
      <p className="mt-2 text-center text-xs text-muted-foreground">New code every {rotation} seconds</p>
    </div>
  );
}
