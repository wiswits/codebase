"use client";

import type {
  VisitorFilters as VisitorFilterValues,
  VisitorStatus,
} from "@/services/visitor.service";

interface VisitorFiltersProps {
  filters: VisitorFilterValues;

  onChange: (
    filters: VisitorFilterValues
  ) => void;

  onReset?: () => void;
}

export default function VisitorFilters({
  filters,
  onChange,
  onReset,
}: VisitorFiltersProps) {
  function updateFilter<
    K extends keyof VisitorFilterValues
  >(
    key: K,
    value: VisitorFilterValues[K]
  ) {
    onChange({
      ...filters,
      [key]: value,
      page: 1,
    });
  }

  return (
    <section style={containerStyle}>
      <div style={headingStyle}>
        <div>
          <h3 style={titleStyle}>
            Filter Visitors
          </h3>

          <p style={descriptionStyle}>
            Search and filter visitor activity.
          </p>
        </div>

        {onReset && (
          <button
            type="button"
            onClick={onReset}
            style={resetButtonStyle}
          >
            Clear Filters
          </button>
        )}
      </div>

      <div style={gridStyle}>
        <div style={fieldStyle}>
          <label style={labelStyle}>
            Search
          </label>

          <input
            type="search"
            value={filters.search ?? ""}
            placeholder="Search visitor..."
            onChange={(event) =>
              updateFilter(
                "search",
                event.target.value
              )
            }
            style={inputStyle}
          />
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>
            Status
          </label>

          <select
            value={filters.status ?? ""}
            onChange={(event) =>
              updateFilter(
                "status",
                event.target
                  .value as VisitorStatus | ""
              )
            }
            style={inputStyle}
          >
            <option value="">
              All statuses
            </option>

            <option value="checked_in">
              Checked In
            </option>

            <option value="checked_out">
              Checked Out
            </option>

            <option value="cancelled">
              Cancelled
            </option>
          </select>
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>
            Visitor Type
          </label>

          <select
            value={filters.visitorType ?? ""}
            onChange={(event) =>
              updateFilter(
                "visitorType",
                event.target.value
              )
            }
            style={inputStyle}
          >
            <option value="">
              All visitor types
            </option>

            <option value="guest">
              Guest
            </option>

            <option value="parent">
              Parent
            </option>

            <option value="vendor">
              Vendor
            </option>

            <option value="contractor">
              Contractor
            </option>

            <option value="interview">
              Interview
            </option>

            <option value="other">
              Other
            </option>
          </select>
        </div>
      </div>
    </section>
  );
}

const containerStyle = {
  padding: 20,
  border: "1px solid #d8e0eb",
  borderRadius: 14,
  background: "#ffffff",
};

const headingStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  flexWrap: "wrap" as const,
  gap: 16,
  marginBottom: 20,
};

const titleStyle = {
  margin: 0,
  color: "#071f4e",
  fontSize: 17,
};

const descriptionStyle = {
  margin: "6px 0 0",
  color: "#60708c",
  fontSize: 13,
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(200px, 1fr))",
  gap: 16,
};

const fieldStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: 7,
};

const labelStyle = {
  color: "#071f4e",
  fontSize: 13,
  fontWeight: 600,
};

const inputStyle = {
  width: "100%",
  height: 44,
  padding: "0 13px",
  border: "1px solid #d8e0eb",
  borderRadius: 9,
  background: "#ffffff",
  color: "#071f4e",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box" as const,
};

const resetButtonStyle = {
  padding: "9px 14px",
  border: "1px solid #0b2859",
  borderRadius: 8,
  background: "#ffffff",
  color: "#0b2859",
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 700,
};