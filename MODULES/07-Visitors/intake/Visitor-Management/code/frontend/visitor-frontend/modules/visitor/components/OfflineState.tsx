interface OfflineStateProps {
  onRetry?: () => void;
}

export default function OfflineState({
  onRetry,
}: OfflineStateProps) {
  return (
    <div
      style={{
        padding: 40,
        textAlign: "center",
        borderRadius: 16,
        border: "1px solid #d8e0eb",
        background: "#ffffff",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          fontSize: 50,
        }}
      >
        📡
      </div>

      <h2
        style={{
          color: "#071f4e",
        }}
      >
        You&apos;re Offline
      </h2>

      <p
        style={{
          color: "#60708c",
          maxWidth: 500,
          margin: "12px auto 24px",
        }}
      >
        Internet connection was lost. Reconnect and
        try again.
      </p>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          style={{
            padding: "12px 22px",
            background: "#0b2859",
            color: "#ffffff",
            border: "none",
            borderRadius: 10,
            cursor: "pointer",
          }}
        >
          Retry
        </button>
      )}
    </div>
  );
}