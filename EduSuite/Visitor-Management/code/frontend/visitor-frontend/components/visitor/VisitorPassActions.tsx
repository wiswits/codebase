"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  VisitorService,
  type VisitorPass,
  type VisitorStatus,
} from "@/services/visitor.service";
import { getApiErrorMessage } from "@/lib/interceptors";

interface VisitorPassActionsProps {
  visitorId: number;
  visitorStatus: VisitorStatus;
  pass?: VisitorPass | null;
  onSuccess?: (
    pass: VisitorPass
  ) => void | Promise<void>;
}

export default function VisitorPassActions({
  visitorId,
  visitorStatus,
  pass,
  onSuccess,
}: VisitorPassActionsProps) {
  const router = useRouter();

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [success, setSuccess] =
    useState<string | null>(null);

  const [expiresAt, setExpiresAt] =
    useState("");

  const canIssue =
    visitorStatus === "checked_in" &&
    !pass;

  async function handleGeneratePass() {
    if (!canIssue || loading) return;

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      let expiration: string | null = null;

      if (expiresAt) {
        const parsedDate = new Date(expiresAt);

        if (Number.isNaN(parsedDate.getTime())) {
          setError(
            "Please enter a valid expiration date."
          );
          return;
        }

        expiration = parsedDate.toISOString();
      }

      const response =
        await VisitorService.issuePass(
          visitorId,
          expiration
        );

      setSuccess(
        response.message ||
          "Visitor pass generated successfully."
      );

      if (onSuccess) {
        await onSuccess(response.data);
      }

      router.refresh();
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          "Unable to generate visitor pass."
        )
      );
    } finally {
      setLoading(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  if (pass) {
    return (
      <div>
        <div
          style={{
            display: "flex",
            gap: "12px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={handlePrint}
            style={{
              padding: "12px 20px",
              border: "1px solid #0b2859",
              borderRadius: "10px",
              backgroundColor: "#0b2859",
              color: "#ffffff",
              fontSize: "14px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Print Pass
          </button>

          <span
            style={{
              color: "#60708c",
              fontSize: "14px",
            }}
          >
            Pass:{" "}
            <strong
              style={{
                color: "#0b2859",
              }}
            >
              {pass.pass_code}
            </strong>
          </span>
        </div>

        {pass.status !== "active" && (
          <div
            style={{
              marginTop: "12px",
              padding: "10px 12px",
              borderRadius: "8px",
              backgroundColor: "#f8fafc",
              color: "#60708c",
              fontSize: "14px",
            }}
          >
            This pass is currently{" "}
            <strong>{pass.status}</strong>.
          </div>
        )}
      </div>
    );
  }

  if (visitorStatus !== "checked_in") {
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
        A pass cannot be issued because this
        visit is no longer active.
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          maxWidth: "380px",
        }}
      >
        <label
          htmlFor={`pass-expiration-${visitorId}`}
          style={{
            color: "#0b2859",
            fontSize: "14px",
            fontWeight: 600,
          }}
        >
          Pass Expiration
        </label>

        <input
          id={`pass-expiration-${visitorId}`}
          type="datetime-local"
          value={expiresAt}
          disabled={loading}
          onChange={(event) =>
            setExpiresAt(event.target.value)
          }
          style={{
            minHeight: "46px",
            padding: "0 12px",
            border: "1px solid #d6deea",
            borderRadius: "9px",
            backgroundColor: "#ffffff",
            color: "#0b2859",
            fontSize: "14px",
          }}
        />

        <span
          style={{
            color: "#60708c",
            fontSize: "12px",
          }}
        >
          Optional. Leave empty to use the
          backend&apos;s default expiration.
        </span>
      </div>

      <button
        type="button"
        disabled={loading}
        onClick={handleGeneratePass}
        style={{
          marginTop: "16px",
          padding: "12px 20px",
          border: "none",
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
        {loading
          ? "Generating Pass..."
          : "Generate Visitor Pass"}
      </button>

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