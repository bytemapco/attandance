import type { SetupStatus } from "@/types/setupStatus";

/** What every wizard step receives. `refresh` re-reads the setup status after a change. */
export interface StepProps {
  status: SetupStatus;
  refresh: () => Promise<void>;
  registerContinueAction: (action: (() => Promise<boolean>) | null) => void;
}
