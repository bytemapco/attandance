"use client";

import { useState, useEffect, useMemo } from "react";
import useSWR from "swr";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { getApiErrorMessage } from "@/lib/api";
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

  const params = useMemo(() => {
    const query: Record<string, string | number> = {
      page: currentPage,
      page_size: pageSize,
      sort_by: sortBy,
      sort_order: sortOrder,
    };
    if (debouncedQuery.trim()) query.q = debouncedQuery.trim();
    if (filterValue && filterValue !== "all") query[filterKey] = filterValue;
    for (const [name, value] of Object.entries(extraParams ?? {})) {
      if (value !== undefined && value !== "" && value !== "all") query[name] = value;
    }
    return query;
  }, [currentPage, pageSize, sortBy, sortOrder, debouncedQuery, filterValue, filterKey, extraParams]);

  // Pages already visited, and the page just left, come from the cache while the new one loads.
  const { data: page, error, isLoading, mutate } = useSWR<PaginatedResponse<T>>([endpoint, params]);
  const data = useMemo(() => page?.items ?? [], [page]);
  const totalItems = page?.total_items ?? 0;
  const loading = isLoading;

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
    error: error ? getApiErrorMessage(error, "Failed to load data. Please try again.") : null,
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
    refetch: async (): Promise<void> => {
      await mutate();
    },
  };
}
