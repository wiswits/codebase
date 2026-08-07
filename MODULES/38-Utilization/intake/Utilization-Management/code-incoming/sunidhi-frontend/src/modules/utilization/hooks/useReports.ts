// src/modules/utilization/hooks/useReports.ts
//
// One shared hook drives all five report presets (Employee, Department,
// Team, Monthly, Weekly) — each preset component just fixes groupBy
// and/or periodType before rendering ReportFilters + ReportTable, so
// the fetching/pagination logic lives in exactly one place.

"use client";

import { useCallback, useEffect, useState } from "react";
import { utilizationApi } from "../services/utilizationApi";
import { DEFAULT_LIMIT, DEFAULT_PAGE } from "../constants/utilization.constants";
import {
  Pagination,
  ReportGroupBy,
  ReportListParams,
  ReportPeriodType,
  UtilizationReportRow,
} from "../types/utilization.types";

interface FiltersState {
  search: string;
  departmentId: ReportListParams["departmentId"];
}

const initialFilters: FiltersState = { search: "", departmentId: "" };

export function useReports(groupBy: ReportGroupBy, periodType: ReportPeriodType) {
  const [filters, setFilters] = useState<FiltersState>(initialFilters);
  const [page, setPage] = useState(DEFAULT_PAGE);
  const [limit] = useState(DEFAULT_LIMIT);

  const [items, setItems] = useState<UtilizationReportRow[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await utilizationApi.getReports({
        groupBy,
        periodType,
        ...filters,
        page,
        limit,
      });
      setItems(result.items);
      setPagination(result.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load this report.");
    } finally {
      setLoading(false);
    }
  }, [groupBy, periodType, filters, page, limit]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const updateFilters = (next: Partial<FiltersState>) => {
    setFilters((prev) => ({ ...prev, ...next }));
    setPage(DEFAULT_PAGE);
  };

  const resetFilters = () => {
    setFilters(initialFilters);
    setPage(DEFAULT_PAGE);
  };

  return {
    items,
    pagination,
    loading,
    error,
    filters,
    page,
    setPage,
    updateFilters,
    resetFilters,
    refetch: fetchReports,
  };
}
