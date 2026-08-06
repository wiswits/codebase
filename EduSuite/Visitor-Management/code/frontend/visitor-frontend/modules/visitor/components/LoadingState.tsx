interface LoadingStateProps {
  title?: string;
  description?: string;
}

export default function LoadingState({
  title = "Loading...",
  description = "Please wait while we fetch the latest information.",
}: LoadingStateProps) {
  return (
    <div
      style={{
        padding: "60px 30px",
        textAlign: "center",
        border: "1px solid #d8e0eb",
        borderRadius: 16,
        background: "#ffffff",
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          margin: "0 auto 20px",
          border: "5px solid #ececec",
          borderTop: "5px solid #0b2859",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
        }}
      />

      <h2
        style={{
          margin: 0,
          color: "#071f4e",
        }}
      >
        {title}
      </h2>

      <p
        style={{
          marginTop: 10,
          color: "#60708c",
        }}
      >
        {description}
      </p>
    </div>
  );
}