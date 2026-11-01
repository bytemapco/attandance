/** One thing an institution needs before attendance can run. From GET /admin/setup-status. */
export interface SetupCheck {
  id: string;
  label: string;
  required: boolean;
  done: boolean;
  count: number | null;
  blocker_message: string | null;
  href: string;
}

export interface SetupStatus {
  tenant_name: string;
  tenant_type: string;
  checks: SetupCheck[];
  required_done: number;
  required_total: number;
  /** Percentage of required items done, 0 to 100. */
  score: number;
  ready_to_complete: boolean;
  completed: boolean;
  completed_at: string | null;
  license_remaining: number | null;
}

/** Body of the 409 returned by POST /admin/setup/complete. */
export interface SetupIncompleteDetail {
  message: string;
  missing: string[];
}
