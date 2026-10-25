import React from "react";
import { Smartphone } from "lucide-react";

interface StudentMobileAppCalloutProps {
  token: string;
}

export default function StudentMobileAppCallout({
  token,
}: StudentMobileAppCalloutProps): React.ReactElement {
  return (
    <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 space-y-2">
      <div className="flex items-center gap-2 text-xs font-semibold text-primary">
        <Smartphone size={16} />
        <span>Smart Attendance Mobile App</span>
      </div>
      <p className="text-xs text-muted-foreground">
        As a student, you can also complete this reset directly in the mobile application.
      </p>
      <a
        href={`smartattendance://reset-password?token=${encodeURIComponent(token)}`}
        className="inline-flex items-center justify-center w-full px-3 py-2 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Open in Mobile App
      </a>
    </div>
  );
}
