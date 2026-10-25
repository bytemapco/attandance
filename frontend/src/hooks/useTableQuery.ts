"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import api, { getApiErrorMessage } from "@/lib/api";
import { useDebounce } from "./useDebounce";
import type { PaginatedResponse } from "@/types";

interface UseTableQueryOptions {
  endpoint: string;
  defaultPageSize?: number;
  defaultSortBy?: string;
  defaultSortOrder?: "asc" | "desc";
  filterKey?: string;
  extraParams?: Record<string, string | number | undefined>;
}

export function useTableQuery<T>({
  endpoint,
  defaultPageSize = 10,
  defaultSortBy = "createdAt",
  defaultSortOrder = "desc",
  filterKey = "department_id",
  extraParams,
}: UseTableQueryOptions) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialQ = searchParams?.get("q") || "";
  const initialPage = parseInt(searchParams?.get("page") || "1", 10);
  const initialPageSize = parseInt(searchParams?.get("pageSize") || String(defaultPageSize), 10);
  const initialSortBy = searchParams?.get("sortBy") || defaultSortBy;
  const initialSortOrder = (searchParams?.get("sortOrder") as "asc" | "desc") || defaultSortOrder;
  const initialFilter = searchParams?.get("filter") || "all";

  const [searchQuery, setSearchQuery] = useState(initialQ);
  const debouncedQuery = useDebounce(searchQuery, 350);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(initialSortOrder);
  const [filterValue, setFilterValue] = useState(initialFilter);

  const [data, setData] = useState<T[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync state changes with URL query parameters
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedQuery.trim()) params.set("q", debouncedQuery.trim());
    if (currentPage > 1) params.set("page", String(currentPage));
    if (pageSize !== defaultPageSize) params.set("pageSize", String(pageSize));
    if (sortBy) params.set("sortBy", sortBy);
    if (sortOrder) params.set("sortOrder", sortOrder);
    if (filterValue && filterValue !== "all") params.set("filter", filterValue);

    const queryStr = params.toString();
    const newUrl = queryStr ? `${pathname}?${queryStr}` : pathname;
    router.replace(newUrl, { scroll: false });
  }, [debouncedQuery, currentPage, pageSize, sortBy, sortOrder, filterValue, pathname, router, defaultPageSize]);

  const serializedExtraParams = JSON.stringify(extraParams || {});

  const fetchData = useCallback(async (): Promise<void> => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = {
        page: currentPage,
        page_size: pageSize,
        sort_by: sortBy,
        sort_order: sortOrder,
      };
      if (debouncedQuery.trim()) params.q = debouncedQuery.trim();
      if (filterValue && filterValue !== "all") params[filterKey] = filterValue;
      if (extraParams) {
        Object.entries(extraParams).forEach(([k, v]) => {
          if (v !== undefined && v !== "" && v !== "all") {
            params[k] = v;
          }
        });
      }

      const res = await api.get<PaginatedResponse<T>>(endpoint, {
        params,
        signal: controller.signal,
      });

      setData(res.data.items || []);
      setTotalItems(res.data.total_items || 0);
      setError(null);
    } catch (err: unknown) {
      if ((err as { name?: string })?.name !== "CanceledError") {
        setData([]);
        setTotalItems(0);
        setError(getApiErrorMessage(err, "Failed to load data. Please try again."));
      }
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, currentPage, pageSize, sortBy, sortOrder, debouncedQuery, filterValue, filterKey, serializedExtraParams]);

  useEffect(() => {
    void fetchData();
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [fetchData]);

  const handleSearch = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setCurrentPage(1);
  };

  return {
    data,
    totalItems,
    loading,
    error,
    searchQuery,
    currentPage,
    pageSize,
    sortBy,
    sortOrder,
    filterValue,
    setSearchQuery: handleSearch,
    setCurrentPage,
    setPageSize,
    handleSort,
    setFilterValue: (val: string) => {
      setFilterValue(val);
      setCurrentPage(1);
    },
    refetch: fetchData,
  };
}
