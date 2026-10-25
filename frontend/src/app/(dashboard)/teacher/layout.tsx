import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Faculty Workspace",
  description: "Course management, session initialization, liveness verification review, and student analytics.",
};

export default function TeacherLayout({ children }: { children: React.ReactNode }): React.ReactElement {
  return <>{children}</>;
}
