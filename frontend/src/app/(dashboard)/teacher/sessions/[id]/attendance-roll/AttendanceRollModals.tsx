"use client";

import React from "react";
import SmartPassGeneratorModal from "@/components/scanner/SmartPassGeneratorModal";
import SmartPassScannerModal from "@/components/scanner/SmartPassScannerModal";
import GlassConfirmDialog from "@/components/ui/GlassConfirmDialog";

interface AttendanceRollModalsProps {
  showQrModal: boolean;
  onCloseQrModal: () => void;
  sessionId: string;
  className: string;
  presentCount: number;
  onStudentVerified: () => void;
  showScanner: boolean;
  onCloseScanner: () => void;
  showConfirmBulk: boolean;
  onCloseConfirmBulk: () => void;
  onConfirmBulk: () => void;
  markingAll: boolean;
}

export default function AttendanceRollModals({
  showQrModal,
  onCloseQrModal,
  sessionId,
  className,
  presentCount,
  onStudentVerified,
  showScanner,
  onCloseScanner,
  showConfirmBulk,
  onCloseConfirmBulk,
  onConfirmBulk,
  markingAll,
}: AttendanceRollModalsProps): React.ReactElement {
  return (
    <>
      <SmartPassGeneratorModal
        isOpen={showQrModal}
        onClose={onCloseQrModal}
        sessionId={sessionId}
        className={className}
        initialVerifiedCount={presentCount}
        onStudentVerified={onStudentVerified}
      />

      <SmartPassScannerModal
        isOpen={showScanner}
        onClose={onCloseScanner}
        sessionId={sessionId}
        onSuccess={onStudentVerified}
      />

      <GlassConfirmDialog
        isOpen={showConfirmBulk}
        title="Mark All Absent as Present"
        message="Mark all unmarked absent students as Present for this session?"
        confirmLabel="Mark All Present"
        variant="primary"
        onConfirm={onConfirmBulk}
        onCancel={onCloseConfirmBulk}
        loading={markingAll}
      />
    </>
  );
}
