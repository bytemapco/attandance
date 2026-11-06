"use client";

import { useEffect } from "react";
import useSWR from "swr";
import toast from "react-hot-toast";
import { getApiErrorMessage } from "@/lib/api";
import type { AccountKind } from "@/services/adminUsers";

interface AccountDetail<T> {
  account: T | null;
  loading: boolean;
}

export function useAccountDetail<T>(kind: AccountKind, id: string, loadError: string): AccountDetail<T> {
  const { data, error, isLoading } = useSWR<T>(`/admin/users/${kind}/${id}`);

  useEffect(() => {
    if (error) toast.error(getApiErrorMessage(error, loadError));
  }, [error, loadError]);

  return { account: data ?? null, loading: isLoading };
}
