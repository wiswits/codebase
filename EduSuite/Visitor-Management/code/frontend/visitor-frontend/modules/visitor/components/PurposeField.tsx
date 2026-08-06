"use client";

interface PurposeFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
}

export default function PurposeField({
  value,
  onChange,
  error,
  disabled = false,
  required = true,
}: PurposeFieldProps) {
  return (
    <div style={wrapperStyle}>
      <label
        htmlFor="visitor-purpose"
        style={labelStyle}
      >
        Purpose of Visit
        {required && (
          <span style={requiredStyle}> *</span>
        )}
      </label>

      <textarea
        id="visitor-purpose"
        value={value}
        disabled={disabled}
        required={required}
        rows={4}
        placeholder="Enter the purpose of this visit"
        onChange={(event) =>
          onChange(event.target.value)
        }
        style={{
          ...textareaStyle,
          borderColor: error
            ? "#f04438"
            : "#d8e0eb",
          background: disabled
            ? "#f5f6f8"
            : "#ffffff",
        }}
      />

      <div style={bottomStyle}>
        {error ? (
          <span style={errorStyle}>
            {error}
          </span>
        ) : (
          <span style={hintStyle}>
            Briefly describe why the visitor is here.
          </span>
        )}

        <span style={counterStyle}>
          {value.length} characters
        </span>
      </div>
    </div>
  );
}

const wrapperStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: 8,
  width: "100%",
};

const labelStyle = {
  color: "#071f4e",
  fontSize: 14,
  fontWeight: 600,
};

const requiredStyle = {
  color: "#b42318",
};

const textareaStyle = {
  width: "100%",
  minHeight: 110,
  padding: "14px 16px",
  border: "1px solid #d8e0eb",
  borderRadius: 10,
  outline: "none",
  resize: "vertical" as const,
  color: "#071f4e",
  fontFamily: "inherit",
  fontSize: 14,
  lineHeight: 1.5,
  boxSizing: "border-box" as const,
};

const bottomStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  fontSize: 12,
};

const hintStyle = {
  color: "#60708c",
};

const counterStyle = {
  color: "#60708c",
  whiteSpace: "nowrap" as const,
};

const errorStyle = {
  color: "#b42318",
};