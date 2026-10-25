import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Account Sign In | Smart Attendance System",
  description: "Secure multi-layered authentication portal for administrators and faculty.",
};

export default function AuthLayout({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <div className="min-h-screen flex flex-col justify-center bg-background text-foreground overflow-x-hidden">
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto min-w-0">
        {children}
      </main>
    </div>
  );
}
