import Link from "next/link";
import React from "react";
import { Compass, Home, Mail, ArrowLeft } from "lucide-react";
import Button from "@/components/ui/Button";

export default function NotFoundPage(): React.ReactElement {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-background text-foreground relative overflow-hidden">
      <div className="w-full max-w-md text-center z-10">
        <div className="rounded-lg border border-border bg-card p-8 sm:p-10">
          <div className="inline-flex p-3 rounded-lg bg-secondary text-muted-foreground border border-border mb-5">
            <Compass size={32} />
          </div>

          <h1 className="text-6xl font-semibold text-primary/15 font-mono tracking-tighter mb-1 select-none">
            404
          </h1>

          <h2 className="text-xl font-semibold tracking-tight text-primary mb-2">
            Page Not Found
          </h2>

          <p className="text-sm text-muted-foreground mb-7 max-w-xs mx-auto leading-relaxed">
            The page you requested does not exist or may have been relocated.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
            <Link href="/" className="w-full sm:w-auto">
              <Button variant="primary" size="md" icon={<Home size={14} />} className="w-full">
                Dashboard
              </Button>
            </Link>

            <Link href="/login" className="w-full sm:w-auto">
              <Button variant="secondary" size="md" icon={<ArrowLeft size={14} />} className="w-full">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <span>Need assistance?</span>
          <a
            href="mailto:support@sahajcampus.com"
            className="inline-flex items-center gap-1 font-semibold text-primary hover:text-accent-strong transition-colors"
          >
            <Mail size={13} />
            <span>support@sahajcampus.com</span>
          </a>
        </div>
      </div>
    </div>
  );
}
