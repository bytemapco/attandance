import api from "@/lib/api";

export interface SetupItem {
  id: string;
  name: string;
  code?: string;
}

export interface NewSetupItem {
  name: string;
  code?: string;
}

export async function listSetupItems(endpoint: string): Promise<SetupItem[]> {
  const { data } = await api.get<SetupItem[]>(endpoint);
  if (!Array.isArray(data)) throw new Error("Unexpected item list response");
  return data;
}

export async function createSetupItem(endpoint: string, payload: NewSetupItem): Promise<void> {
  await api.post(endpoint, payload);
}

export async function deleteSetupItem(endpoint: string, id: string): Promise<void> {
  await api.delete(`${endpoint}/${id}`);
}
