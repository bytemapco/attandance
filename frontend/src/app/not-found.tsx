import Link from "next/link";
import React from "react";
import { ShieldAlert, ArrowLeft, Home, Mail, Phone } from "lucide-react";

export default function NotFoundPage(): React.ReactElement {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-background text-foreground relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg text-center z-10">
        {/* Card */}
        <div className="rounded-2xl border border-border bg-card p-8 sm:p-10 shadow-lg backdrop-blur-xs">
          <div className="inline-flex p-3 rounded-2xl bg-muted text-foreground mb-6 shadow-2xs">
            <ShieldAlert size={36} className="text-muted-foreground" />
          </div>

          <h1 className="text-7xl font-extrabold text-foreground/20 font-mono tracking-tighter mb-2 select-none">
            404
          </h1>

          <h2 className="text-2xl font-bold tracking-tight text-foreground mb-2">
            Page Not Found
          </h2>

          <p className="text-xs sm:text-sm text-muted-foreground mb-8 max-w-sm mx-auto leading-relaxed">
            The page you are looking for doesn&apos;t exist or has been moved.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/admin/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 transition-all shadow-xs cursor-pointer"
            >
              <Home size={15} />
              <span>Go to Dashboard</span>
            </Link>

            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-border bg-secondary/50 text-foreground font-semibold text-xs hover:bg-secondary transition-all cursor-pointer"
            >
              <ArrowLeft size={15} />
              <span>Sign In</span>
            </Link>
          </div>
        </div>

        {/* Contact Support Footer */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 text-xs text-muted-foreground">
          <span className="font-medium">Need assistance?</span>
          <div className="flex items-center gap-3 font-semibold">
            <a
              href="mailto:support@smartattendance.edu"
              className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <Mail size={13} />
              <span>support@smartattendance.edu</span>
            </a>
            <span>•</span>
            <a
              href="tel:+18005550199"
              className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <Phone size={13} />
              <span>+1 (800) 555-0199</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
