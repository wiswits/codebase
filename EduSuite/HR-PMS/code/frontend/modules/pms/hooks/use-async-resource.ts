"use client";

import { useEffect, useState } from "react";
import type { APIResponse, AsyncState } from "../types";

/**
 * Generic hook that runs an async PMS-service call and exposes a single
 * discriminated-union state (loading / empty / success / error / not_found).
 * Used by every PMS list/detail hook so every screen gets consistent
 * required states (Engineering brief: Loading/Empty/Error/Retry/Success).
 *
 * `deps` should contain everything the fetcher closes over (mirrors a
 * manual dependency array); the hook re-runs whenever those values, or a
 * manual refetch(), change.
 */
export function useAsyncResource<T>(
  fetcher: () => Promise<APIResponse<T>>,
  deps: unknown[],
  options: { isEmpty?: (data: T) => boolean } = {},
) {
  const [state, setState] = useState<AsyncState<T>>({ status: "idle" });
  const [reloadKey, setReloadKey] = useState(0);
  const isEmpty = options.isEmpty;

  useEffect(() => {
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- synchronizing with an external system (the PMS service/mock API); this is the documented data-fetching pattern.
    setState({ status: "loading" });
    fetcher().then((res) => {
      if (!active) return;
      if (!res.success) {
        if (!res.success) {
  const error = res.error ?? {
    code: "UNKNOWN_ERROR",
    message: "Unknown server error",
  };

  if (error.code?.includes("NOT_FOUND")) {
    setState({ status: "not_found" });
  } else if (error.code === "FORBIDDEN") {
    setState({ status: "unauthorized" });
  } else {
    setState({ status: "error", error });
  }

  return;
}
      }
      if (isEmpty?.(res.data)) {
        setState({ status: "empty" });
        return;
      }
      setState({ status: "success", data: res.data });
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadKey]);

  return { state, refetch: () => setReloadKey((k) => k + 1) };
}
