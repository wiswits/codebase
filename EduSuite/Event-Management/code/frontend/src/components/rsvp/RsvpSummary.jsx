import {
  CheckCircle2,
  Clock3,
  HelpCircle,
  Users,
  XCircle,
} from "lucide-react";

import Loader from "../common/Loader";

function getNumber(summary, keys) {
  for (const key of keys) {
    const value = summary?.[key];

    if (value !== undefined) {
      return Number(value) || 0;
    }
  }

  return 0;
}

export default function RsvpSummary({
  summary,
  loading = false,
}) {
  if (loading) {
    return (
      <article className="panel">
        <Loader text="Loading RSVP summary..." />
      </article>
    );
  }

  const going = getNumber(summary, [
    "going",
    "goingCount",
  ]);

  const maybe = getNumber(summary, [
    "maybe",
    "maybeCount",
  ]);

  const declined = getNumber(summary, [
    "declined",
    "declinedCount",
  ]);

  const pending = getNumber(summary, [
    "pending",
    "pendingCount",
  ]);

  const total =
    summary?.total ??
    going +
      maybe +
      declined +
      pending;

  const items = [
    {
      label: "Going",
      value: going,
      icon: CheckCircle2,
    },
    {
      label: "Maybe",
      value: maybe,
      icon: HelpCircle,
    },
    {
      label: "Declined",
      value: declined,
      icon: XCircle,
    },
    {
      label: "Pending",
      value: pending,
      icon: Clock3,
    },
  ];

  return (
    <article className="panel rsvp-summary">
      <div className="panel-header">
        <div>
          <span className="section-kicker">
            RSVP OVERVIEW
          </span>

          <h2>Response Summary</h2>

          <p>
            Attendance responses for this
            event.
          </p>
        </div>

        <div className="summary-total">
          <Users size={19} />

          <div>
            <strong>{total}</strong>
            <span>Total</span>
          </div>
        </div>
      </div>

      <div className="rsvp-summary-grid">
        {items.map(
          ({
            label,
            value,
            icon: Icon,
          }) => (
            <div
              className="rsvp-summary-item"
              key={label}
            >
              <div className="summary-icon">
                <Icon size={18} />
              </div>

              <div>
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            </div>
          )
        )}
      </div>
    </article>
  );
}