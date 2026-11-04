"use client";

import React, { useRef } from "react";
import { Upload, Download, FileSpreadsheet } from "lucide-react";
import { ParsedBulkRecord, BulkImportEntityType } from "./bulkTypes";
import { getSampleCsv } from "./bulkCsvSamples";
import { parseBulkCsvContent } from "./parseBulkCsv";

interface BulkImportDropzoneProps {
  entityType: BulkImportEntityType;
  onRecordsParsed: (records: ParsedBulkRecord[], fileName: string) => void;
  onError: (msg: string) => void;
}

export default function BulkImportDropzone({
  entityType,
  onRecordsParsed,
  onError,
}: BulkImportDropzoneProps): React.ReactElement {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File): void => {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      onError("Please upload a valid .csv file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = String(e.target?.result || "");
      const records = parseBulkCsvContent(text, entityType, onError);
      if (records) {
        onRecordsParsed(records, file.name);
      }
    };
    reader.readAsText(file);
  };

  const handleDownloadSample = (): void => {
    const header = getSampleCsv(entityType);
    const blob = new Blob([header], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sample-${entityType}-import.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const columnGuide = (() => {
    if (entityType === "departments") {
      return (
        <>
          Required columns: <code className="font-mono bg-secondary px-1.5 py-0.5 rounded-sm text-[11px]">name</code>,{" "}
          <code className="font-mono bg-secondary px-1.5 py-0.5 rounded-sm text-[11px]">code</code>
          {" "}(optional: <code className="font-mono bg-secondary px-1.5 py-0.5 rounded-sm text-[11px]">head</code>, <code className="font-mono bg-secondary px-1.5 py-0.5 rounded-sm text-[11px]">description</code>)
        </>
      );
    }
    if (entityType === "subjects") {
      return (
        <>
          Required columns: <code className="font-mono bg-secondary px-1.5 py-0.5 rounded-sm text-[11px]">name</code>,{" "}
          <code className="font-mono bg-secondary px-1.5 py-0.5 rounded-sm text-[11px]">code</code>
          {" "}(optional: <code className="font-mono bg-secondary px-1.5 py-0.5 rounded-sm text-[11px]">description</code>)
        </>
      );
    }
    if (entityType === "classrooms") {
      return (
        <>
          Required column: <code className="font-mono bg-secondary px-1.5 py-0.5 rounded-sm text-[11px]">name</code>
          {" "}(optional: <code className="font-mono bg-secondary px-1.5 py-0.5 rounded-sm text-[11px]">building</code>)
        </>
      );
    }
    if (entityType === "designations") {
      return (
        <>
          Required columns: <code className="font-mono bg-secondary px-1.5 py-0.5 rounded-sm text-[11px]">name</code>,{" "}
          <code className="font-mono bg-secondary px-1.5 py-0.5 rounded-sm text-[11px]">code</code>
          {" "}(optional: <code className="font-mono bg-secondary px-1.5 py-0.5 rounded-sm text-[11px]">description</code>)
        </>
      );
    }
    return (
      <>
        Required columns: <code className="font-mono bg-secondary px-1.5 py-0.5 rounded-sm text-[11px]">email</code>,{" "}
        <code className="font-mono bg-secondary px-1.5 py-0.5 rounded-sm text-[11px]">
          {entityType === "students" ? "enrollment_number" : "employee_id"}
        </code>, <code className="font-mono bg-secondary px-1.5 py-0.5 rounded-sm text-[11px]">first_name</code>,{" "}
        <code className="font-mono bg-secondary px-1.5 py-0.5 rounded-sm text-[11px]">last_name</code>
      </>
    );
  })();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground flex items-center gap-1.5">
          <FileSpreadsheet size={14} className="text-primary" /> Supported format: CSV (.csv)
        </span>
        <button
          type="button"
          onClick={handleDownloadSample}
          className="text-primary hover:text-accent-strong flex items-center gap-1.5 font-semibold transition-colors cursor-pointer"
        >
          <Download size={13} /> Download Sample CSV
        </button>
      </div>

      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const dropped = e.dataTransfer.files?.[0];
          if (dropped) handleFile(dropped);
        }}
        className="group border-2 border-dashed border-border hover:border-accent/60 bg-card hover:bg-secondary/40 rounded-lg p-8 text-center cursor-pointer transition-all duration-200"
      >
        <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-3 text-primary group-hover:text-accent-strong transition-all">
          <Upload size={20} />
        </div>
        <p className="text-sm font-bold text-foreground">Click to choose a file or drag and drop your CSV here</p>
        <p className="text-xs text-muted-foreground mt-1.5">{columnGuide}</p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
          className="hidden"
        />
      </div>
    </div>
  );
}
