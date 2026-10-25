import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Administration",
  description: "Institutional management, user enrollment, class setup, and verification control panel.",
};

export default function AdminLayout({ children }: { children: React.ReactNode }): React.ReactElement {
  return <>{children}</>;
}
