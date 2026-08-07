"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  VisitorService,
  type VisitorStatus,
} from "@/services/visitor.service";
import { getApiErrorMessage } from "@/lib/interceptors";

interface VisitorActionsProps {
  visitorId: number;
  status: VisitorStatus;
  onSuccess?: () => void | Promise<void>;
}

type ActionType = "checkout" | "cancel" | null;

export default function VisitorActions({
  visitorId,
  status,
  onSuccess,
}: VisitorActionsProps) {
  const router = useRouter();

  const [action, setAction] =
    useState<ActionType>(null);

  const [error, setError] =
    useState<string | null>(null);

  const [success, setSuccess] =
    useState<string | null>(null);

  const isActive = status === "checked_in";
  const loading = action !== null;

  async function completeAction(
    type: Exclude<ActionType, null>
  ) {
    if (!isActive || loading) return;

    const message =
      type === "checkout"
        ? "Are you sure you want to check out this visitor?"
        : "Are you sure you want to cancel this visit?";

    if (!window.confirm(message)) {
      return;
    }

    try {
      setAction(type);
      setError(null);
      setSuccess(null);

      if (type === "checkout") {
        await VisitorService.checkOut(visitorId);

        setSuccess(
          "Visitor checked out successfully."
        );
      } else {
        await VisitorService.cancel(visitorId);

        setSuccess(
          "Visit cancelled successfully."
        );
      }

      if (onSuccess) {
        await onSuccess();
      }

      router.refresh();
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          type === "checkout"
            ? "Unable to check out visitor."
            : "Unable to cancel visit."
        )
      );
    } finally {
      setAction(null);
    }
  }

  if (!isActive) {
    return (
      <div
        style={{
          padding: "14px 16px",
          border: "1px solid #d8e0eb",
          borderRadius: "10px",
          backgroundColor: "#f8fafc",
          color: "#60708c",
          fontSize: "14px",
        }}
      >
        {status === "checked_out"
          ? "This visitor has already been checked out."
          : "This visit has been cancelled."}
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          disabled={loading}
          onClick={() =>
            completeAction("checkout")
          }
          style={{
            padding: "12px 20px",
            border: "1px solid #0b2859",
            borderRadius: "10px",
            backgroundColor: loading
              ? "#94a3b8"
              : "#0b2859",
            color: "#ffffff",
            fontSize: "14px",
            fontWeight: 700,
            cursor: loading
              ? "not-allowed"
              : "pointer",
          }}
        >
          {action === "checkout"
            ? "Checking Out..."
            : "Check Out Visitor"}
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={() =>
            completeAction("cancel")
          }
          style={{
            padding: "12px 20px",
            border: "1px solid #0b2859",
            borderRadius: "10px",
            backgroundColor: "#ffffff",
            color: "#0b2859",
            fontSize: "14px",
            fontWeight: 700,
            cursor: loading
              ? "not-allowed"
              : "pointer",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {action === "cancel"
            ? "Cancelling..."
            : "Cancel Visit"}
        </button>
      </div>

      {success && (
        <div
          role="status"
          style={{
            marginTop: "14px",
            padding: "12px 14px",
            border: "1px solid #abefc6",
            borderRadius: "8px",
            backgroundColor: "#ecfdf3",
            color: "#067647",
            fontSize: "14px",
          }}
        >
          {success}
        </div>
      )}

      {error && (
        <div
          role="alert"
          style={{
            marginTop: "14px",
            padding: "12px 14px",
            border: "1px solid #fecaca",
            borderRadius: "8px",
            backgroundColor: "#fff1f1",
            color: "#b42318",
            fontSize: "14px",
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}