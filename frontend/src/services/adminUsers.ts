import api from "@/lib/api";

export type AccountKind = "students" | "teachers";

export async function sendPasswordReset(userId: string): Promise<void> {
  await api.post(`/admin/users/${userId}/reset-password`);
}
