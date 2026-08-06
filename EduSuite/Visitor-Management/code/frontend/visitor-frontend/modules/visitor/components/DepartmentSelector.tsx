"use client";

export interface DepartmentOption {
  id: number | string;
  name: string;
}

interface DepartmentSelectorProps {
  value?: string | number;
  departments?: DepartmentOption[];
  disabled?: boolean;
  required?: boolean;
  label?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
}

export default function DepartmentSelector({
  value = "",
  departments = [],
  disabled = false,
  required = false,
  label = "Department",
  placeholder = "Select department",
  onChange,
}: DepartmentSelectorProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        width: "100%",
      }}
    >
      <label
        style={{
          fontSize: "14px",
          fontWeight: 600,
          color: "#0b2859",
        }}
      >
        {label}
        {required && " *"}
      </label>

      <select
        value={String(value)}
        disabled={disabled}
        required={required}
        onChange={(event) => {
          onChange?.(event.target.value);
        }}
        style={{
          width: "100%",
          minHeight: "46px",
          padding: "0 14px",
          border: "1px solid #d6deea",
          borderRadius: "10px",
          backgroundColor: disabled ? "#f4f6f8" : "#ffffff",
          color: "#0b2859",
          fontSize: "14px",
          outline: "none",
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        <option value="">{placeholder}</option>

        {departments.map((department) => (
          <option
            key={department.id}
            value={String(department.id)}
          >
            {department.name}
          </option>
        ))}
      </select>
    </div>
  );
}