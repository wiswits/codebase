"use client";

interface RetryStateProps {
  title?: string;
  message?: string;
  onRetry: () => void | Promise<void>;
  retrying?: boolean;
}

export default function RetryState({
  title = "Something went wrong",
  message = "We couldn't load the requested information.",
  onRetry,
  retrying = false,
}: RetryStateProps) {
  return (
    <div style={containerStyle}>
      <div style={iconStyle}>!</div>

      <h3 style={titleStyle}>{title}</h3>

      <p style={messageStyle}>{message}</p>

      <button
        type="button"
        disabled={retrying}
        onClick={() => void onRetry()}
        style={{
          ...buttonStyle,
          opacity: retrying ? 0.65 : 1,
          cursor: retrying ? "not-allowed" : "pointer",
        }}
      >
        {retrying ? "Retrying..." : "Try Again"}
      </button>
    </div>
  );
}

const containerStyle = {
  padding: "36px 24px",
  border: "1px solid #f0c6c2",
  borderRadius: 16,
  background: "#fffafa",
  textAlign: "center" as const,
};

const iconStyle = {
  width: 42,
  height: 42,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  margin: "0 auto 16px",
  borderRadius: "50%",
  background: "#fff1f0",
  color: "#b42318",
  fontSize: 20,
  fontWeight: 800,
};

const titleStyle = {
  margin: 0,
  color: "#071f4e",
  fontSize: 18,
};

const messageStyle = {
  maxWidth: 520,
  margin: "10px auto 20px",
  color: "#60708c",
  fontSize: 14,
  lineHeight: 1.6,
};

const buttonStyle = {
  padding: "11px 18px",
  border: "none",
  borderRadius: 9,
  background: "#0b2859",
  color: "#ffffff",
  fontWeight: 700,
};