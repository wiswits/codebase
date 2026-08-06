interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export default function Pagination({
  page,
  totalPages,
  onChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 12,
        marginTop: 30,
      }}
    >
      <button
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
        style={buttonStyle(page === 1)}
      >
        Previous
      </button>

      <span
        style={{
          color: "#071f4e",
          fontWeight: 700,
        }}
      >
        Page {page} of {totalPages}
      </span>

      <button
        disabled={page === totalPages}
        onClick={() => onChange(page + 1)}
        style={buttonStyle(page === totalPages)}
      >
        Next
      </button>
    </div>
  );
}

function buttonStyle(disabled: boolean) {
  return {
    padding: "10px 18px",
    borderRadius: 8,
    border: "none",
    cursor: disabled ? "default" : "pointer",
    background: disabled ? "#d8d8d8" : "#0b2859",
    color: "#fff",
  };
}