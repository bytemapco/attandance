"use client";

import React from "react";
import { X, Users, GraduationCap, BookOpen, Building2, DoorOpen, Award } from "lucide-react";
import toast from "react-hot-toast";
import { useBulkImportProcessor } from "./bulk/useBulkImportProcessor";
import BulkImportDropzone from "./bulk/BulkImportDropzone";
import BulkImportPreviewTable from "./bulk/BulkImportPreviewTable";
import BulkImportProgress from "./bulk/BulkImportProgress";
import BulkImportResults from "./bulk/BulkImportResults";
import { BulkImportEntityType } from "./bulk/bulk-types";

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
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={stage !== "importing" ? handleClose : undefined} />
      <div className="relative w-full max-w-2xl rounded-2xl border border-border bg-card shadow-2xl p-6 z-10 space-y-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              {getEntityIcon()}
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                Import {getEntityTitle()}
              </h3>
              <p className="text-xs text-muted-foreground">
                {fileName ? `File: ${fileName}` : `Upload a CSV file to add multiple ${getEntityTitle().toLowerCase()} at once`}
              </p>
            </div>
          </div>
          {stage !== "importing" && (
            <button onClick={handleClose} className="p-1 rounded-lg text-muted-foreground hover:text-foreground">
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
              sendInvite={sendInvite}
              onSendInviteChange={setSendInvite}
              onRemoveRecord={handleRemoveRecord}
            />
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
              <button
                type="button"
                onClick={handleReset}
                className="px-3.5 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-secondary transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeBulkImport}
                disabled={records.length === 0}
                className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-2xs cursor-pointer"
              >
                Import {records.length} Records
              </button>
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
      </div>
    </div>
  );
}
