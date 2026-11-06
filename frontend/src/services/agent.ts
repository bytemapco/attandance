import api from "@/lib/api";
import { sessionHeaders } from "@/lib/api/client";
import { readEvents } from "@/lib/agent/ndjson";
import { getApiBaseUrl } from "@/lib/config";
import type { AgentStatus, AgentStreamEvent, Cell, ConfirmResult, SavedMessage } from "@/types/agent";

export const NOTICE_REQUIRED = "ai_notice_required";

/** The chat endpoint refused before it started, for example a missing notice or too many messages. */
export class AgentRequestError extends Error {
  constructor(
    readonly status: number,
    readonly detail: string,
  ) {
    super(detail);
  }
}

async function refusal(response: Response): Promise<AgentRequestError> {
  const body = (await response.json().catch(() => ({}))) as { detail?: string };
  return new AgentRequestError(response.status, body.detail ?? "The assistant could not answer.");
}

/** Sends one message and hands each event to `onEvent` as it arrives. */
export async function streamChat(
  message: string,
  conversationId: string | null,
  onEvent: (event: AgentStreamEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const response = await fetch(`${getApiBaseUrl()}/agent/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...sessionHeaders() },
    body: JSON.stringify({ message, conversation_id: conversationId }),
    signal,
  });
  if (!response.ok || !response.body) throw await refusal(response);
  for await (const event of readEvents<AgentStreamEvent>(response.body)) onEvent(event);
}

export async function acceptNotice(): Promise<AgentStatus> {
  return (await api.post<AgentStatus>("/agent/notice/accept")).data;
}

export async function loadConversation(id: string): Promise<SavedMessage[]> {
  return (await api.get<SavedMessage[]>(`/agent/conversations/${id}`)).data;
}

export async function confirmProposal(id: string, edits: Record<string, Cell>): Promise<ConfirmResult> {
  return (await api.post<ConfirmResult>(`/agent/proposals/${id}/confirm`, { edits })).data;
}

export async function cancelProposal(id: string): Promise<void> {
  await api.post(`/agent/proposals/${id}/cancel`);
}

/** Saves a file the assistant linked to, such as a report. The path needs the signed-in session, so it is fetched here. */
export async function downloadLinked(path: string): Promise<void> {
  const { data, headers } = await api.get<Blob>(path, { responseType: "blob" });
  const disposition = String(headers["content-disposition"] ?? "");
  const name = /filename="?([^";]+)"?/.exec(disposition)?.[1] ?? "download";
  const url = URL.createObjectURL(data);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}
