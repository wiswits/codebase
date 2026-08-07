"use client";

import { useState } from "react";

interface HostNotificationProps {
  hostName?: string | null;
  visitorName?: string | null;
  onNotify?: () => void | Promise<void>;
  disabled?: boolean;
}

export default function HostNotification({
  hostName,
  visitorName,
  onNotify,
  disabled = false,
}: HostNotificationProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleNotify() {
    if (!onNotify || loading || disabled) return;

    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      await onNotify();

      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to notify the host."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        padding: "20px",
        border: "1px solid #d8e0eb",
        borderRadius: "12px",
        backgroundColor: "#ffffff",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h3
            style={{
              margin: 0,
              fontSize: "16px",
              color: "#0b2859",
            }}
          >
            Host Notification
          </h3>

          <p
            style={{
              margin: "6px 0 0",
              fontSize: "14px",
              lineHeight: 1.5,
              color: "#60708c",
            }}
          >
            Notify{" "}
            <strong>{hostName || "the selected host"}</strong>
            {visitorName
              ? ` that ${visitorName} has arrived.`
              : " that their visitor has arrived."}
          </p>
        </div>

        <button
          type="button"
          disabled={disabled || loading || !onNotify}
          onClick={handleNotify}
          style={{
            padding: "11px 18px",
            border: "none",
            borderRadius: "9px",
            backgroundColor:
              disabled || loading || !onNotify
                ? "#94a3b8"
                : "#0b2859",
            color: "#ffffff",
            fontSize: "14px",
            fontWeight: 700,
            cursor:
              disabled || loading || !onNotify
                ? "not-allowed"
                : "pointer",
          }}
        >
          {loading ? "Notifying..." : "Notify Host"}
        </button>
      </div>

      {success && (
        <div
          role="status"
          style={{
            marginTop: "14px",
            padding: "10px 12px",
            borderRadius: "8px",
            backgroundColor: "#ecfdf3",
            color: "#067647",
            fontSize: "14px",
          }}
        >
          Host notified successfully.
        </div>
      )}

      {error && (
        <div
          role="alert"
          style={{
            marginTop: "14px",
            padding: "10px 12px",
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