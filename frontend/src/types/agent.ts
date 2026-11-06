export type Cell = string | number | boolean | null;

export interface TableBlockData {
  type: "ui";
  kind: "table";
  title: string;
  columns: string[];
  rows: Cell[][];
  download?: string;
}

export interface LinkBlockData {
  type: "ui";
  kind: "link";
  label: string;
  path: string;
}

export interface ProposalData {
  type: "proposal";
  id: string;
  tool: string;
  summary: string;
  /** What the change will do. `table`, when present, is a preview table. */
  details: Record<string, unknown>;
  /** The fields the person may still change before confirming, with their current values. */
  editable: Record<string, Cell>;
  expires_at: string;
}

export type AgentBlock = TableBlockData | LinkBlockData | ProposalData;

export type AgentStreamEvent =
  | { type: "conversation"; id: string }
  | { type: "tool"; name: string; label: string }
  | { type: "text"; text: string }
  | { type: "error"; message: string }
  | AgentBlock;

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  blocks: AgentBlock[];
  /** The tool the assistant is using right now, shown while it works. */
  working: string | null;
  failed: boolean;
}

export interface AgentStatus {
  role: "admin" | "teacher";
  model_configured: boolean;
  notice_accepted: boolean;
  accepted_at: string | null;
  can_accept_notice: boolean;
}

export interface SavedMessage {
  role: "user" | "assistant";
  content: string;
  events: AgentBlock[];
}

export interface ConfirmResult {
  status: "confirmed";
  message: string;
}
