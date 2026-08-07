// src/modules/utilization/hooks/useEmployee.ts

"use client";

import { useCallback, useEffect, useState } from "react";
import { utilizationApi } from "../services/utilizationApi";
import { Employee, EmployeeInput } from "../types/utilization.types";

export function useEmployee(employeeId?: number) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(Boolean(employeeId));
  const [error, setError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchEmployee = useCallback(async () => {
    if (!employeeId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await utilizationApi.getEmployee(employeeId);
      setEmployee(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load this employee.");
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    fetchEmployee();
  }, [fetchEmployee]);

  const create = async (input: EmployeeInput) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const created = await utilizationApi.createEmployee(input);
      setEmployee(created);
      return created;
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Unable to add this employee.");
      return null;
    } finally {
      setSubmitting(false);
    }
  };

  const update = async (input: Partial<EmployeeInput>) => {
    if (!employeeId) return null;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const updated = await utilizationApi.updateEmployee(employeeId, input);
      setEmployee(updated);
      return updated;
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Unable to update this employee.");
      return null;
    } finally {
      setSubmitting(false);
    }
  };

  return {
    employee,
    loading,
    error,
    submitting,
    submitError,
    create,
    update,
    refetch: fetchEmployee,
  };
}
