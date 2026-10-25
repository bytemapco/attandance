"use client";

import React, { useRef } from "react";
import { Upload, Download, FileSpreadsheet, AlertCircle } from "lucide-react";
import { ParsedBulkRecord, BulkImportEntityType } from "./bulkTypes";
import { getSampleCsv } from "./bulkCsvSamples";

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

  const parseCsvContent = (content: string, fileName: string): void => {
    const rawLines = content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (rawLines.length < 2) {
      onError("The CSV file must contain a header row and at least 1 record row.");
      return;
    }

    const records: ParsedBulkRecord[] = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    for (let i = 1; i < rawLines.length; i++) {
      const parts = rawLines[i].split(",").map((p) => p.trim().replace(/^["']|["']$/g, ""));
      if (parts.length < 2) continue;

      if (entityType === "departments") {
        const name = parts[0] || "";
        const code = parts[1] || "";
        const head = parts[2] || "";
        const description = parts[3] || "";

        const hasName = name.length >= 2;
        const hasCode = code.length >= 2;
        const isValid = hasName && hasCode;
        let validationError: string | undefined;
        if (!hasName) validationError = "Department name is required (min 2 characters)";
        else if (!hasCode) validationError = "Department code is required (min 2 characters)";

        records.push({
          id: `row-${i}-${Date.now()}`,
          email: description,
          identifier: code,
          first_name: name,
          last_name: head,
          isValid,
          validationError,
        });
      } else if (entityType === "subjects") {
        const name = parts[0] || "";
        const code = parts[1] || "";
        const description = parts[2] || "";

        const hasName = name.length >= 2;
        const hasCode = code.length >= 2;
        const isValid = hasName && hasCode;
        let validationError: string | undefined;
        if (!hasName) validationError = "Subject name is required (min 2 characters)";
        else if (!hasCode) validationError = "Subject code is required (min 2 characters)";

        records.push({
          id: `row-${i}-${Date.now()}`,
          email: description,
          identifier: code,
          first_name: name,
          last_name: "",
          isValid,
          validationError,
        });
      } else if (entityType === "classrooms") {
        const name = parts[0] || "";
        const building = parts[1] || "";

        const hasName = name.length >= 1;
        const isValid = hasName;
        let validationError: string | undefined;
        if (!hasName) validationError = "Classroom name / room number is required";

        records.push({
          id: `row-${i}-${Date.now()}`,
          email: "",
          identifier: building,
          first_name: name,
          last_name: "",
          isValid,
          validationError,
        });
      } else if (entityType === "designations") {
        const name = parts[0] || "";
        const code = parts[1] || "";
        const description = parts[2] || "";

        const hasName = name.length >= 2;
        const hasCode = code.length >= 2;
        const isValid = hasName && hasCode;
        let validationError: string | undefined;
        if (!hasName) validationError = "Designation title is required (min 2 characters)";
        else if (!hasCode) validationError = "Designation code is required (min 2 characters)";

        records.push({
          id: `row-${i}-${Date.now()}`,
          email: description,
          identifier: code,
          first_name: name,
          last_name: "",
          isValid,
          validationError,
        });
      } else if (entityType === "classes") {
        const name = parts[0] || "";
        const subjectCode = parts[1] || "";
        const teacherEmail = parts[2] || "";
        const classroomName = parts[3] || "";
        const semester = parts[4] ? parseInt(parts[4], 10) : undefined;
        const batch = parts[5] || undefined;

        const isValidEmail = emailRegex.test(teacherEmail);
        const hasName = name.length >= 2;
        const hasSubject = subjectCode.length >= 1;
        const isValid = isValidEmail && hasName && hasSubject;

        let validationError: string | undefined;
        if (!hasName) validationError = "Class name is required (min 2 characters)";
        else if (!hasSubject) validationError = "Subject code is required";
        else if (!isValidEmail) validationError = "A valid teacher email address is required";

        records.push({
          id: `row-${i}-${Date.now()}`,
          email: teacherEmail,
          identifier: subjectCode,
          first_name: name,
          last_name: classroomName,
          semester,
          batch,
          isValid,
          validationError,
        });
      } else {
        if (parts.length < 4) continue;
        const email = parts[0] || "";
        const identifier = parts[1] || "";
        const firstName = parts[2] || "";
        const lastName = parts[3] || "";

        const isValidEmail = emailRegex.test(email);
        const hasIdentifier = identifier.length >= 3;
        const isValid = isValidEmail && hasIdentifier && firstName.length > 0;

        let validationError: string | undefined;
        if (!isValidEmail) validationError = "Invalid email format";
        else if (!hasIdentifier) validationError = "ID too short (min 3 characters)";
        else if (!firstName) validationError = "First name is required";

        records.push({
          id: `row-${i}-${Date.now()}`,
          email,
          identifier,
          first_name: firstName,
          last_name: lastName,
          isValid,
          validationError,
        });
      }
    }

    if (records.length === 0) {
      onError("No valid records found in the uploaded file. Please check your headers and column format.");
      return;
    }

    onRecordsParsed(records, fileName);
  };

  const handleFile = (file: File): void => {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      onError("Please upload a valid .csv file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = String(e.target?.result || "");
      parseCsvContent(text, file.name);
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
          Required columns: <code className="font-mono bg-secondary px-1.5 py-0.5 rounded text-[11px]">name</code>,{" "}
          <code className="font-mono bg-secondary px-1.5 py-0.5 rounded text-[11px]">code</code>
          {" "}(optional: <code className="font-mono bg-secondary px-1.5 py-0.5 rounded text-[11px]">head</code>, <code className="font-mono bg-secondary px-1.5 py-0.5 rounded text-[11px]">description</code>)
        </>
      );
    }
    if (entityType === "subjects") {
      return (
        <>
          Required columns: <code className="font-mono bg-secondary px-1.5 py-0.5 rounded text-[11px]">name</code>,{" "}
          <code className="font-mono bg-secondary px-1.5 py-0.5 rounded text-[11px]">code</code>
          {" "}(optional: <code className="font-mono bg-secondary px-1.5 py-0.5 rounded text-[11px]">description</code>)
        </>
      );
    }
    if (entityType === "classrooms") {
      return (
        <>
          Required column: <code className="font-mono bg-secondary px-1.5 py-0.5 rounded text-[11px]">name</code>
          {" "}(optional: <code className="font-mono bg-secondary px-1.5 py-0.5 rounded text-[11px]">building</code>)
        </>
      );
    }
    if (entityType === "designations") {
      return (
        <>
          Required columns: <code className="font-mono bg-secondary px-1.5 py-0.5 rounded text-[11px]">name</code>,{" "}
          <code className="font-mono bg-secondary px-1.5 py-0.5 rounded text-[11px]">code</code>
          {" "}(optional: <code className="font-mono bg-secondary px-1.5 py-0.5 rounded text-[11px]">description</code>)
        </>
      );
    }
    if (entityType === "classes") {
      return (
        <>
          Required columns: <code className="font-mono bg-secondary px-1.5 py-0.5 rounded text-[11px]">class_name</code>,{" "}
          <code className="font-mono bg-secondary px-1.5 py-0.5 rounded text-[11px]">subject_code</code>,{" "}
          <code className="font-mono bg-secondary px-1.5 py-0.5 rounded text-[11px]">teacher_email</code>
        </>
      );
    }
    return (
      <>
        Required columns: <code className="font-mono bg-secondary px-1.5 py-0.5 rounded text-[11px]">email</code>,{" "}
        <code className="font-mono bg-secondary px-1.5 py-0.5 rounded text-[11px]">
          {entityType === "students" ? "enrollment_number" : "employee_id"}
        </code>, <code className="font-mono bg-secondary px-1.5 py-0.5 rounded text-[11px]">first_name</code>,{" "}
        <code className="font-mono bg-secondary px-1.5 py-0.5 rounded text-[11px]">last_name</code>
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
          className="text-primary hover:text-primary/80 flex items-center gap-1.5 font-medium transition-colors cursor-pointer"
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
        className="group border-2 border-dashed border-border hover:border-primary/50 bg-secondary/20 hover:bg-secondary/40 rounded-xl p-8 text-center cursor-pointer transition-all duration-200"
      >
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3 text-primary group-hover:scale-105 transition-transform">
          <Upload size={20} />
        </div>
        <p className="text-sm font-semibold text-foreground">Click to choose a file or drag and drop your CSV here</p>
        <p className="text-xs text-muted-foreground mt-1">{columnGuide}</p>
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

      <div className="flex items-start gap-2 p-3 bg-secondary/30 rounded-lg border border-border/50 text-[11px] text-muted-foreground">
        <AlertCircle size={14} className="text-muted-foreground shrink-0 mt-0.5" />
        <span>
          Records are uploaded in automatic batches for high reliability. You will be able to review all rows before starting the import.
        </span>
      </div>
    </div>
  );
}
