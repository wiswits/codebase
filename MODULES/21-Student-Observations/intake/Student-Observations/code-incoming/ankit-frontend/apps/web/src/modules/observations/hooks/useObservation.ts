"use client";

import { useCallback, useEffect, useState } from "react";

import {
  getObservationById,
  getObservations,
} from "../services/observationsApi";

import type { Observation } from "../types/observation.types";

export function useObservation(id?: number) {
  const [observation, setObservation] =
    useState<Observation | null>(null);

  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState<string | null>(null);

  const loadObservation = useCallback(async () => {
    if (!id) {
      setObservation(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await getObservationById(id);
      setObservation(response.data);
    } catch (err) {
      setObservation(null);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load observation."
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadObservation();
  }, [loadObservation]);

  return {
    observation,
    loading,
    error,
    reload: loadObservation,
  };
}

export function useObservations() {
  const [observations, setObservations] = useState<Observation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadObservations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getObservations();
      setObservations(response.data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load observations."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadObservations();
  }, [loadObservations]);

  return {
    observations,
    loading,
    error,
    reload: loadObservations,
  };
}