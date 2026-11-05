"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Hash, KeyRound, Pencil, User } from "lucide-react";
import toast from "react-hot-toast";
import { getApiErrorMessage } from "@/lib/api";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { sendPasswordReset } from "@/services/adminUsers";
import Breadcrumb from "@/components/ui/Breadcrumb";
import Button from "@/components/ui/Button";
import ResetPasswordDialog from "@/components/ui/ResetPasswordDialog";
import { ClipboardProvider } from "./ClipboardContext";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface UserDetailViewProps {
  breadcrumb: BreadcrumbItem[];
  account: { user_id: string; email: string };
  initials: string;
  fullName: string;
  badge: React.ReactNode;
  /** The institution ID (enrollment number or employee ID), shown as a copy chip under the name. */
  identifier: { label: string; value: string; hint: string };
  /** Chips shown next to the identifier, such as department. */
  chips: React.ReactNode;
  editHref: string;
  /** The detail cards. */
  children: React.ReactNode;
}

export default function UserDetailView({
  breadcrumb,
  account,
  initials,
  fullName,
  badge,
  identifier,
  chips,
  editHref,
  children,
}: UserDetailViewProps): React.ReactElement {
  const router = useRouter();
  const clipboard = useCopyToClipboard();
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  const handleResetPassword = async (): Promise<void> => {
    try {
      await sendPasswordReset(account.user_id);
      toast.success(`Password reset email sent to ${account.email}`);
      setIsResetDialogOpen(false);
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Failed to send password reset email"));
    }
  };

  return (
    <ClipboardProvider value={clipboard}>
      <div className="space-y-6">
        <Breadcrumb items={breadcrumb} />

        <div className="rounded-lg border border-border bg-card p-6 sm:p-7">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-center gap-5 text-center sm:text-left">
              <div className="relative">
                <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-lg bg-primary/5 border border-primary/10 flex items-center justify-center text-primary font-semibold text-2xl sm:text-3xl select-none">
                  {initials || <User size={32} className="text-muted-foreground" />}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">{fullName}</h1>
                  {badge}
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-muted-foreground">
                  <button
                    type="button"
                    onClick={() => clipboard.copy(identifier.value, identifier.label)}
                    className="inline-flex items-center gap-1.5 font-mono px-2.5 py-1 rounded-md bg-muted/60 hover:bg-muted text-foreground border border-border transition-colors cursor-pointer"
                    title={identifier.hint}
                  >
                    <Hash size={12} className="text-muted-foreground" />
                    <span>{identifier.value}</span>
                    {clipboard.copiedKey === identifier.label ? (
                      <Check size={12} className="text-success" />
                    ) : (
                      <Copy size={12} className="text-muted-foreground opacity-60" />
                    )}
                  </button>
                  {chips}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center sm:justify-end gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-border">
              <Button variant="primary" size="md" icon={<Pencil size={15} />} onClick={() => router.push(editHref)}>
                Edit Profile
              </Button>
              <Button
                variant="secondary"
                size="md"
                icon={<KeyRound size={15} className="text-muted-foreground" />}
                onClick={() => setIsResetDialogOpen(true)}
              >
                Reset Password
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">{children}</div>

        <ResetPasswordDialog
          isOpen={isResetDialogOpen}
          onClose={() => setIsResetDialogOpen(false)}
          onConfirm={handleResetPassword}
          userEmail={account.email}
          title="Send password reset email"
        />
      </div>
    </ClipboardProvider>
  );
}
