import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Super Admin Platform",
  description: "Multi-tenant institutional administration, infrastructure monitoring, and global platform security.",
};

export default function SuperAdminLayout({ children }: { children: React.ReactNode }): React.ReactElement {
  return <>{children}</>;
}
