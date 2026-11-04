"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { getApiErrorMessage } from "@/lib/api";
import type { MasterDataEntity, MasterDataRecord } from "@/lib/masterData/entities";
import { deleteRecord, listRecords } from "@/services/masterData";

const DEFAULT_PAGE_SIZE = 10;

interface MasterDataList {
  loading: boolean;
  error: string | null;
  /** The records on the current page, after searching. */
  rows: MasterDataRecord[];
  totalItems: number;
  page: number;
  pageSize: number;
  setPage: (page: number) => void;
  changePageSize: (size: number) => void;
  search: (query: string) => void;
  reload: () => Promise<void>;
  deleteTargetId: string | null;
  deleting: boolean;
  askToDelete: (id: string) => void;
  cancelDelete: () => void;
  confirmDelete: () => Promise<void>;
}

export function useMasterDataList(entity: MasterDataEntity): MasterDataList {
  const [records, setRecords] = useState<MasterDataRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const reload = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      setRecords(await listRecords<MasterDataRecord>(entity));
    } catch (err: unknown) {
      const message = getApiErrorMessage(err, `Failed to load ${entity.plural.toLowerCase()}`);
      setError(message);
      toast.error(message);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [entity]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return records;
    return records.filter((record) =>
      entity.list.searchText(record).some((text) => text?.toLowerCase().includes(needle))
    );
  }, [records, query, entity]);

  const lastPage = Math.max(1, Math.ceil(matches.length / pageSize));
  const currentPage = Math.min(page, lastPage);
  const rows = useMemo(
    () => matches.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [matches, currentPage, pageSize]
  );

  const search = useCallback((value: string): void => {
    setQuery(value);
    setPage(1);
  }, []);

  const changePageSize = useCallback((size: number): void => {
    setPageSize(size);
    setPage(1);
  }, []);

  const confirmDelete = async (): Promise<void> => {
    if (!deleteTargetId) return;
    setDeleting(true);
    try {
      await deleteRecord(entity, deleteTargetId);
      toast.success(`${entity.singular} deleted successfully`);
      setDeleteTargetId(null);
      await reload();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Delete failed"));
    } finally {
      setDeleting(false);
    }
  };

  return {
    loading,
    error,
    rows,
    totalItems: matches.length,
    page: currentPage,
    pageSize,
    setPage,
    changePageSize,
    search,
    reload,
    deleteTargetId,
    deleting,
    askToDelete: setDeleteTargetId,
    cancelDelete: () => setDeleteTargetId(null),
    confirmDelete,
  };
}
