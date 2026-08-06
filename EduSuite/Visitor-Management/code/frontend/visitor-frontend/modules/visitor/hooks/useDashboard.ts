"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Visitor,
  VisitorService,
} from "@/services/visitor.service";

export interface VisitorDashboardStats {
  total: number;
  checkedIn: number;
  checkedOut: number;
  cancelled: number;
  activePasses: number;
}

const initialStats: VisitorDashboardStats = {
  total: 0,
  checkedIn: 0,
  checkedOut: 0,
  cancelled: 0,
  activePasses: 0,
};

function calculateStats(
  visitors: Visitor[],
  total: number
): VisitorDashboardStats {
  return {
    total,

    checkedIn: visitors.filter(
      (visitor) =>
        visitor.status === "checked_in"
    ).length,

    checkedOut: visitors.filter(
      (visitor) =>
        visitor.status === "checked_out"
    ).length,

    cancelled: visitors.filter(
      (visitor) =>
        visitor.status === "cancelled"
    ).length,

    activePasses: visitors.filter(
      (visitor) =>
        visitor.pass?.status === "active"
    ).length,
  };
}

export function useDashboard() {
  const [visitors, setVisitors] = useState<Visitor[]>(
    []
  );

  const [stats, setStats] =
    useState<VisitorDashboardStats>(initialStats);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response =
        await VisitorService.list({
          page: 1,
          limit: 100,
        });

      const data = response.data;

      setVisitors(data);

      setStats(
        calculateStats(
          data,
          response.pagination.total
        )
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load dashboard."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function initializeDashboard() {
      try {
        const response =
          await VisitorService.list({
            page: 1,
            limit: 100,
          });

        if (cancelled) {
          return;
        }

        const data = response.data;

        setVisitors(data);

        setStats(
          calculateStats(
            data,
            response.pagination.total
          )
        );

        setError(null);
      } catch (err) {
        if (cancelled) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load dashboard."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void initializeDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    visitors,
    stats,
    loading,
    error,
    refresh: loadDashboard,
  };
}