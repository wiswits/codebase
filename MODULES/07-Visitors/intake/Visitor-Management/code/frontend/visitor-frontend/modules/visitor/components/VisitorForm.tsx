"use client";

import { FormEvent, useState } from "react";
import type { CheckInVisitorInput } from "@/services/visitor.service";

interface VisitorFormProps {
  onSubmit: (
    input: CheckInVisitorInput
  ) => void | Promise<void>;
  loading?: boolean;
  initialValues?: Partial<CheckInVisitorInput>;
  submitLabel?: string;
}

export default function VisitorForm({
  onSubmit,
  loading = false,
  initialValues = {},
  submitLabel = "Check In Visitor",
}: VisitorFormProps) {
  const [visitorName, setVisitorName] = useState(
    initialValues.visitorName ?? ""
  );
  const [visitorPhone, setVisitorPhone] = useState(
    initialValues.visitorPhone ?? ""
  );
  const [visitorEmail, setVisitorEmail] = useState(
    initialValues.visitorEmail ?? ""
  );
  const [visitorType, setVisitorType] = useState(
    initialValues.visitorType ?? "guest"
  );
  const [purpose, setPurpose] = useState(
    initialValues.purpose ?? ""
  );
  const [hostId, setHostId] = useState(
    initialValues.hostId
      ? String(initialValues.hostId)
      : ""
  );
  const [hostName, setHostName] = useState(
    initialValues.hostName ?? ""
  );

  const [error, setError] = useState<string | null>(
    null
  );

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError(null);

    const parsedHostId = Number(hostId);

    if (!visitorName.trim()) {
      setError("Visitor name is required.");
      return;
    }

    if (!purpose.trim()) {
      setError("Purpose of visit is required.");
      return;
    }

    if (
      !Number.isInteger(parsedHostId) ||
      parsedHostId <= 0
    ) {
      setError("Please enter a valid Host ID.");
      return;
    }

    if (
      visitorEmail.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        visitorEmail.trim()
      )
    ) {
      setError("Please enter a valid email address.");
      return;
    }

    await onSubmit({
      visitorName: visitorName.trim(),
      visitorPhone:
        visitorPhone.trim() || undefined,
      visitorEmail:
        visitorEmail.trim() || undefined,
      visitorType:
        visitorType.trim() || undefined,
      purpose: purpose.trim(),
      hostId: parsedHostId,
      hostName: hostName.trim() || undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} style={formStyle}>
      {error && (
        <div style={errorStyle}>{error}</div>
      )}

      <div style={gridStyle}>
        <Field label="Visitor Name" required>
          <input
            value={visitorName}
            onChange={(e) =>
              setVisitorName(e.target.value)
            }
            placeholder="Enter visitor name"
            style={inputStyle}
            disabled={loading}
          />
        </Field>

        <Field label="Phone Number">
          <input
            value={visitorPhone}
            onChange={(e) =>
              setVisitorPhone(e.target.value)
            }
            placeholder="Enter phone number"
            style={inputStyle}
            disabled={loading}
          />
        </Field>

        <Field label="Email Address">
          <input
            type="email"
            value={visitorEmail}
            onChange={(e) =>
              setVisitorEmail(e.target.value)
            }
            placeholder="visitor@example.com"
            style={inputStyle}
            disabled={loading}
          />
        </Field>

        <Field label="Visitor Type">
          <select
            value={visitorType}
            onChange={(e) =>
              setVisitorType(e.target.value)
            }
            style={inputStyle}
            disabled={loading}
          >
            <option value="guest">Guest</option>
            <option value="parent">Parent</option>
            <option value="vendor">Vendor</option>
            <option value="contractor">
              Contractor
            </option>
            <option value="interview">
              Interview
            </option>
            <option value="other">Other</option>
          </select>
        </Field>

        <Field label="Host ID" required>
          <input
            type="number"
            min="1"
            value={hostId}
            onChange={(e) =>
              setHostId(e.target.value)
            }
            placeholder="Enter host ID"
            style={inputStyle}
            disabled={loading}
          />
        </Field>

        <Field label="Host Name">
          <input
            value={hostName}
            onChange={(e) =>
              setHostName(e.target.value)
            }
            placeholder="Enter host name"
            style={inputStyle}
            disabled={loading}
          />
        </Field>
      </div>

      <Field label="Purpose of Visit" required>
        <textarea
          value={purpose}
          onChange={(e) =>
            setPurpose(e.target.value)
          }
          placeholder="Enter purpose of visit"
          rows={4}
          style={{
            ...inputStyle,
            height: "auto",
            paddingTop: 12,
            resize: "vertical",
          }}
          disabled={loading}
        />
      </Field>

      <div style={actionsStyle}>
        <button
          type="submit"
          disabled={loading}
          style={{
            ...buttonStyle,
            opacity: loading ? 0.65 : 1,
          }}
        >
          {loading ? "Processing..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label style={fieldStyle}>
      <span style={labelStyle}>
        {label}
        {required && (
          <span style={{ color: "#b42318" }}>
            {" "}*
          </span>
        )}
      </span>

      {children}
    </label>
  );
}

const formStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: 20,
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(240px, 1fr))",
  gap: 18,
};

const fieldStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: 8,
};

const labelStyle = {
  color: "#071f4e",
  fontSize: 13,
  fontWeight: 600,
};

const inputStyle = {
  width: "100%",
  height: 46,
  padding: "0 13px",
  border: "1px solid #d8e0eb",
  borderRadius: 9,
  background: "#ffffff",
  color: "#071f4e",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box" as const,
};

const actionsStyle = {
  display: "flex",
  justifyContent: "flex-end",
};

const buttonStyle = {
  padding: "12px 20px",
  border: "none",
  borderRadius: 9,
  background: "#0b2859",
  color: "#ffffff",
  cursor: "pointer",
  fontWeight: 700,
};

const errorStyle = {
  padding: 14,
  border: "1px solid #fecdca",
  borderRadius: 9,
  background: "#fff1f0",
  color: "#b42318",
};