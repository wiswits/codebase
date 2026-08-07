"use client";

import type { ReactNode } from "react";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  action?: ReactNode;
}

export default function ErrorState({
  title = "Unable to load data",
  message = "Something went wrong while processing your request.",
  onRetry,
  retryLabel = "Try Again",
  action,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      style={{
        width: "100%",
        padding: "24px",
        border: "1px solid #fecaca",
        borderRadius: "12px",
        backgroundColor: "#fff5f5",
      }}
    >
      <h3
        style={{
          margin: 0,
          color: "#991b1b",
          fontSize: "16px",
          fontWeight: 700,
        }}
      >
        {title}
      </h3>

      <p
        style={{
          margin: "8px 0 0",
          color: "#b42318",
          fontSize: "14px",
          lineHeight: 1.6,
        }}
      >
        {message}
      </p>

      {(onRetry || action) && (
        <div
          style={{
            marginTop: "16px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              style={{
                padding: "10px 16px",
                border: "1px solid #991b1b",
                borderRadius: "8px",
                backgroundColor: "#ffffff",
                color: "#991b1b",
                fontSize: "14px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {retryLabel}
            </button>
          )}

          {action}
        </div>
      )}
    </div>
  );
}