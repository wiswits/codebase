"use client";

import {
  useCallback,
  useEffect,
  useState
} from "react";

import {
  fetchAlumniBatches,
  fetchAlumniStats
} from "../services/alumniApi";

import type {
  AlumniBatch,
  AlumniStats
} from "../types/alumni.types";

export function useAlumniStats() {
  const [stats, setStats] =
    useState<AlumniStats | null>(null);

  const [batches, setBatches] =
    useState<AlumniBatch[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const load = useCallback(
    async () => {
      try {
        setLoading(true);
        setError(null);

        const [
          statsResult,
          batchesResult
        ] = await Promise.all([
          fetchAlumniStats(),
          fetchAlumniBatches()
        ]);

        setStats(statsResult);
        setBatches(batchesResult);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Unable to load alumni statistics."
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    void load();
  }, [load]);

  return {
    stats,
    batches,
    loading,
    error,
    refresh: load
  };
}