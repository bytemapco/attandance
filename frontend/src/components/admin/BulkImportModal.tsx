"use client";

import React from "react";
import { X, Users, GraduationCap, BookOpen, Building2, DoorOpen, Award } from "lucide-react";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import ModalFrame from "@/components/ui/ModalFrame";
import { useBulkImportProcessor } from "./bulk/useBulkImportProcessor";
import BulkImportDropzone from "./bulk/BulkImportDropzone";
import BulkImportPreviewTable from "./bulk/BulkImportPreviewTable";
import BulkImportProgress from "./bulk/BulkImportProgress";
import BulkImportResults from "./bulk/BulkImportResults";
import { BulkImportEntityType } from "./bulk/bulkTypes";

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: BulkImportEntityType;
  onSuccess: () => void;
}

export default function BulkImportModal({
  isOpen,
  onClose,
  entityType,
  onSuccess,
}: BulkImportModalProps): React.ReactElement | null {
  const {
    stage,
    records,
    ignoredColumns,
    fileName,
    sendInvite,
    batches,
    currentBatchIdx,
    processedCount,
    importedTotal,
    failedTotal,
    invitesTotal,
    summary,
    isAborting,
    setSendInvite,
    handleReset,
    handleRecordsParsed,
    handleRemoveRecord,
    executeBulkImport,
    handleAbort,
  } = useBulkImportProcessor(entityType, onSuccess);

  if (!isOpen) return null;

  const readyCount = records.filter((r) => !r.error).length;

  const handleClose = (): void => {
    if (stage === "completed" && importedTotal > 0) onSuccess();
    handleReset();
    onClose();
  };

  const getEntityIcon = (): React.ReactElement => {
    if (entityType === "students") return <GraduationCap size={18} />;
    if (entityType === "teachers") return <Users size={18} />;
    if (entityType === "departments") return <Building2 size={18} />;
    if (entityType === "subjects") return <BookOpen size={18} />;
    if (entityType === "classrooms") return <DoorOpen size={18} />;
    if (entityType === "designations") return <Award size={18} />;
    return <BookOpen size={18} />;
  };

  const getEntityTitle = (): string => {
    if (entityType === "students") return "Students";
    if (entityType === "teachers") return "Faculty";
    if (entityType === "departments") return "Departments";
    if (entityType === "subjects") return "Subjects";
    if (entityType === "classrooms") return "Classrooms";
    if (entityType === "designations") return "Designations";
    return "Classes";
  };

  return (
    <ModalFrame
      label={`Import ${getEntityTitle()}`}
      onClose={stage !== "importing" ? handleClose : undefined}
      size="lg"
      className="space-y-4 p-6"
    >
      {/* Modal Header */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2.5">
          <span className="text-muted-foreground" aria-hidden>
            {getEntityIcon()}
          </span>
          <div>
            <h3 className="text-base font-semibold text-foreground">
              Import {getEntityTitle()}
            </h3>
            {fileName && (
              <p className="text-xs text-muted-foreground">
                File: {fileName}
              </p>
            )}
          </div>
        </div>
        {stage !== "importing" && (
          <button
            onClick={handleClose}
            aria-label="Close"
            className="rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Stage 1: Upload & Parse */}
      {stage === "upload" && (
        <BulkImportDropzone
          entityType={entityType}
          onRecordsParsed={handleRecordsParsed}
          onError={(m) => toast.error(m)}
        />
      )}

      {/* Stage 2: Preview & Options */}
      {stage === "preview" && (
        <>
          <BulkImportPreviewTable
            records={records}
            entityType={entityType}
            ignoredColumns={ignoredColumns}
            sendInvite={sendInvite}
            onSendInviteChange={setSendInvite}
            onRemoveRecord={handleRemoveRecord}
          />
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
            <Button type="button" variant="secondary" size="sm" onClick={handleReset}>
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={executeBulkImport}
              disabled={readyCount === 0}
            >
              Import {readyCount} {readyCount === 1 ? "record" : "records"}
            </Button>
          </div>
        </>
      )}

      {/* Stage 3: Batch Progress */}
      {stage === "importing" && (
        <BulkImportProgress
          batches={batches}
          currentBatchIndex={currentBatchIdx}
          totalRecords={records.length}
          processedRecords={processedCount}
          importedCount={importedTotal}
          failedCount={failedTotal}
          invitationsSent={invitesTotal}
          onAbort={handleAbort}
          isAborting={isAborting}
        />
      )}

      {/* Stage 4: Results & Resolution */}
      {stage === "completed" && summary && (
        <BulkImportResults
          summary={summary}
          entityType={entityType}
          onClose={handleClose}
          onReset={handleReset}
        />
      )}
    </ModalFrame>
  );
}
