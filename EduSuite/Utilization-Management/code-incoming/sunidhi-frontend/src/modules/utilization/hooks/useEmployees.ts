// src/modules/utilization/hooks/useEmployees.ts

"use client";

import { useCallback, useEffect, useState } from "react";
import { utilizationApi } from "../services/utilizationApi";
import { DEFAULT_LIMIT, DEFAULT_PAGE } from "../constants/utilization.constants";
import { Employee, EmployeeListParams, Pagination } from "../types/utilization.types";

interface FiltersState {
  search: string;
  departmentId: EmployeeListParams["departmentId"];
  employmentStatus: EmployeeListParams["employmentStatus"];
  onBench: EmployeeListParams["onBench"];
}

const initialFilters: FiltersState = {
  search: "",
  departmentId: "",
  employmentStatus: "",
  onBench: "",
};

export function useEmployees() {
  const [filters, setFilters] = useState<FiltersState>(initialFilters);
  const [page, setPage] = useState(DEFAULT_PAGE);
  const [limit] = useState(DEFAULT_LIMIT);

  const [items, setItems] = useState<Employee[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await utilizationApi.getEmployees({ ...filters, page, limit });
      setItems(result.items);
      setPagination(result.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load employees.");
    } finally {
      setLoading(false);
    }
  }, [filters, page, limit]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

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
    refetch: fetchEmployees,
  };
}
