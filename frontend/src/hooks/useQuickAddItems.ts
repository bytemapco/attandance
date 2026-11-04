"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getApiErrorMessage } from "@/lib/api";
import {
  createSetupItem,
  deleteSetupItem,
  listSetupItems,
  type NewSetupItem,
  type SetupItem,
} from "@/services/setupItems";

interface QuickAddItemsOptions {
  endpoint: string;
  /** Singular name shown in messages, for example "department". */
  noun: string;
  /** Whether a code is sent along with the name. Subjects and departments always send one. */
  sendsCode: boolean;
  /** Called after anything is added or removed so the wizard re-reads the setup status. */
  onChanged: () => void;
}

interface QuickAddItems {
  items: SetupItem[];
  loading: boolean;
  loadFailed: boolean;
  /** True while a batch of items is being created. */
  adding: boolean;
  /** The id of the item being removed. */
  removingId: string | null;
  reload: () => Promise<void>;
  /** Returns how many of the entries were created. */
  addMany: (entries: NewSetupItem[]) => Promise<number>;
  remove: (id: string, name: string) => Promise<void>;
}

export function useQuickAddItems({ endpoint, noun, sendsCode, onChanged }: QuickAddItemsOptions): QuickAddItems {
  const [items, setItems] = useState<SetupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const refresh = useCallback(async (): Promise<void> => {
    setLoadFailed(false);
    try {
      setItems(await listSetupItems(endpoint));
    } catch {
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  /** Shows the loading state, for the first load and for a retry after an error. */
  const reload = useCallback(async (): Promise<void> => {
    setLoading(true);
    await refresh();
  }, [refresh]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const createOne = async (entry: NewSetupItem): Promise<boolean> => {
    try {
      await createSetupItem(endpoint, sendsCode && entry.code ? entry : { name: entry.name });
      return true;
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, `Could not add ${entry.name}`));
      return false;
    }
  };

  const addMany = async (entries: NewSetupItem[]): Promise<number> => {
    setAdding(true);
    let added = 0;
    try {
      for (const entry of entries) {
        if (await createOne(entry)) added += 1;
      }
    } finally {
      setAdding(false);
    }
    if (added > 0) {
      toast.success(`${added} ${noun}${added === 1 ? "" : "s"} added`);
      await refresh();
      onChanged();
    }
    return added;
  };

  const remove = async (id: string, name: string): Promise<void> => {
    setRemovingId(id);
    try {
      await deleteSetupItem(endpoint, id);
      toast.success(`Removed ${name}`);
      setItems((prev) => prev.filter((item) => item.id !== id));
      onChanged();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, `Could not remove ${name}`));
      await refresh();
    } finally {
      setRemovingId(null);
    }
  };

  return { items, loading, loadFailed, adding, removingId, reload, addMany, remove };
}
