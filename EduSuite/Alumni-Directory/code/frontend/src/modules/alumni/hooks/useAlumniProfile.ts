"use client";

import {
  useCallback,
  useEffect,
  useState
} from "react";

import {
  fetchAlumniProfile
} from "../services/alumniApi";

import type {
  Alumni
} from "../types/alumni.types";

export function useAlumniProfile(
  id: string
) {
  const [alumni, setAlumni] =
    useState<Alumni | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const load = useCallback(
    async () => {
      if (!id) {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const result =
          await fetchAlumniProfile(id);

        setAlumni(result);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Unable to load alumni profile."
        );
      } finally {
        setLoading(false);
      }
    },
    [id]
  );

  useEffect(() => {
    void load();
  }, [load]);

  return {
    alumni,
    loading,
    error,
    refresh: load
  };
}