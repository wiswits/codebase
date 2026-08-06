import type { ReactNode } from "react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({
  title = "No data found",
  description = "There is currently nothing to display.",
  action,
}: EmptyStateProps) {
  return (
    <div
      style={{
        width: "100%",
        padding: "48px 24px",
        border: "1px dashed #d6deea",
        borderRadius: "14px",
        backgroundColor: "#fafafa",
        textAlign: "center",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          width: "48px",
          height: "48px",
          margin: "0 auto 16px",
          borderRadius: "50%",
          backgroundColor: "#f6f1e7",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#c68f2b",
          fontSize: "22px",
          fontWeight: 700,
        }}
      >
        —
      </div>

      <h3
        style={{
          margin: 0,
          color: "#0b2859",
          fontSize: "18px",
          fontWeight: 700,
        }}
      >
        {title}
      </h3>

      <p
        style={{
          maxWidth: "500px",
          margin: "8px auto 0",
          color: "#60708c",
          fontSize: "14px",
          lineHeight: 1.6,
        }}
      >
        {description}
      </p>

      {action && (
        <div
          style={{
            marginTop: "20px",
            display: "flex",
            justifyContent: "center",
          }}
        >
          {action}
        </div>
      )}
    </div>
  );
}