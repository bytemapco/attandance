"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getApiErrorMessage } from "@/lib/api";
import { getAccount, type AccountKind } from "@/services/adminUsers";

interface AccountDetail<T> {
  account: T | null;
  loading: boolean;
}

export function useAccountDetail<T>(kind: AccountKind, id: string, loadError: string): AccountDetail<T> {
  const [account, setAccount] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getAccount<T>(kind, id)
      .then((data) => {
        if (!cancelled) setAccount(data);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        toast.error(getApiErrorMessage(err, loadError));
        setAccount(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [kind, id, loadError]);

  return { account, loading };
}
