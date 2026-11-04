import api from "@/lib/api";

export type AccountKind = "students" | "teachers";

export async function getAccount<T>(kind: AccountKind, id: string): Promise<T> {
  const { data } = await api.get<T>(`/admin/users/${kind}/${id}`);
  return data;
}

export async function sendPasswordReset(userId: string): Promise<void> {
  await api.post(`/admin/users/${userId}/reset-password`);
}
