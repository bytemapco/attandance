"use client";

import React, { useRef } from "react";
import { Upload, Download, FileSpreadsheet } from "lucide-react";
import { BulkRow, BulkImportEntityType } from "./bulkTypes";
import { BULK_ENTITIES, BulkColumn } from "./bulkColumns";
import { getSampleCsv } from "./bulkCsvSamples";
import { parseBulkCsvContent } from "./parseBulkCsv";

interface BulkImportDropzoneProps {
  entityType: BulkImportEntityType;
  onRecordsParsed: (records: BulkRow[], fileName: string, ignoredColumns: string[]) => void;
  onError: (msg: string) => void;
}

function ColumnChips({ title, columns }: { title: string; columns: BulkColumn[] }): React.ReactElement | null {
  if (columns.length === 0) return null;
  return (
    <p>
      {title}:{" "}
      {columns.map((column, index) => (
        <React.Fragment key={column.key}>
          {index > 0 && ", "}
          <code className="font-mono bg-secondary px-1.5 py-0.5 rounded-sm text-xs">{column.key}</code>
        </React.Fragment>
      ))}
    </p>
  );
}

export default function BulkImportDropzone({
  entityType,
  onRecordsParsed,
  onError,
}: BulkImportDropzoneProps): React.ReactElement {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { columns } = BULK_ENTITIES[entityType];

  const handleFile = (file: File): void => {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      onError("Please upload a valid .csv file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = parseBulkCsvContent(String(e.target?.result || ""), entityType);
      if ("error" in result) onError(result.error);
      else onRecordsParsed(result.rows, file.name, result.ignoredColumns);
    };
    reader.readAsText(file);
  };

  const handleDownloadSample = (): void => {
    const blob = new Blob([getSampleCsv(entityType)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sample-${entityType}-import.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

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
        <p className="text-sm font-semibold text-foreground">Click to choose a file or drag and drop your CSV here</p>
        <div className="text-xs text-muted-foreground mt-1.5 space-y-1">
          <ColumnChips title="Required columns" columns={columns.filter((column) => column.required)} />
          <ColumnChips title="Optional columns" columns={columns.filter((column) => !column.required)} />
          <p>Columns are matched by their header, in any order.</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
          className="hidden"
        />
      </div>
    </div>
  );
}
