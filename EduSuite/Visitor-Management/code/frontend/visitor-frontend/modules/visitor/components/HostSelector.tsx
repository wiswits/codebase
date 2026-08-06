"use client";

export interface HostOption {
  id: number;
  name: string;
  department?: string | null;
}

interface HostSelectorProps {
  hosts?: HostOption[];
  value?: number | string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  onChange?: (
    hostId: number | null,
    host?: HostOption
  ) => void;
}

export default function HostSelector({
  hosts = [],
  value = "",
  label = "Host",
  placeholder = "Select host",
  required = false,
  disabled = false,
  error,
  onChange,
}: HostSelectorProps) {
  function handleChange(
    event: React.ChangeEvent<HTMLSelectElement>
  ) {
    const selectedValue = event.target.value;

    if (!selectedValue) {
      onChange?.(null);
      return;
    }

    const hostId = Number(selectedValue);

    const selectedHost = hosts.find(
      (host) => host.id === hostId
    );

    onChange?.(hostId, selectedHost);
  }

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
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
        onChange={handleChange}
        required={required}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        style={{
          width: "100%",
          minHeight: "48px",
          padding: "0 14px",
          border: error
            ? "1px solid #dc2626"
            : "1px solid #d6deea",
          borderRadius: "10px",
          backgroundColor: disabled
            ? "#f4f6f8"
            : "#ffffff",
          color: "#0b2859",
          fontSize: "14px",
          outline: "none",
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        <option value="">{placeholder}</option>

        {hosts.map((host) => (
          <option
            key={host.id}
            value={host.id}
          >
            {host.name}
            {host.department
              ? ` — ${host.department}`
              : ""}
          </option>
        ))}
      </select>

      {error && (
        <span
          role="alert"
          style={{
            color: "#b42318",
            fontSize: "13px",
          }}
        >
          {error}
        </span>
      )}
    </div>
  );
}