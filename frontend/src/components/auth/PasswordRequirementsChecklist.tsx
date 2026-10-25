"use client";

import React, { useMemo } from "react";
import { Check, X } from "lucide-react";

interface PasswordRequirementsChecklistProps {
  password: string;
}

export function usePasswordRules(password: string) {
  const rules = useMemo(() => [
    { label: "At least 8 characters", valid: password.length >= 8 },
    { label: "Uppercase & lowercase letters", valid: /[a-z]/.test(password) && /[A-Z]/.test(password) },
    { label: "At least one number (0-9)", valid: /\d/.test(password) },
    { label: "At least one special symbol", valid: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password) },
  ], [password]);

  const allPassed = useMemo(() => rules.every((r) => r.valid), [rules]);

  return { rules, allPassed };
}

export default function PasswordRequirementsChecklist({
  password,
}: PasswordRequirementsChecklistProps): React.ReactElement {
  const { rules } = usePasswordRules(password);

  return (
    <div className="p-3 rounded-lg bg-secondary/50 border border-border space-y-1.5">
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
        Security Requirements
      </p>
      <div className="grid grid-cols-1 gap-1">
        {rules.map((rule) => (
          <div key={rule.label} className="flex items-center gap-1.5 text-xs">
            {rule.valid ? (
              <Check size={13} className="text-emerald-500 shrink-0" />
            ) : (
              <X size={13} className="text-muted-foreground/50 shrink-0" />
            )}
            <span className={rule.valid ? "text-foreground font-medium" : "text-muted-foreground"}>
              {rule.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
