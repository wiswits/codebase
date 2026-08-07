import type { Visitor } from "@/services/visitor.service";

import Timeline from "./Timeline";

interface VisitorTimelineProps {
  visitor: Visitor;
}

export default function VisitorTimeline({
  visitor,
}: VisitorTimelineProps) {
  const items = [
    {
      id: "created",
      title: "Visitor Registered",
      description:
        "Visitor record was created.",
      timestamp: visitor.created_at,
    },

    {
      id: "check-in",
      title: "Visitor Checked In",
      description: visitor.host_name
        ? `Visitor checked in to meet ${visitor.host_name}.`
        : "Visitor checked in.",
      timestamp: visitor.check_in_at,
    },

    ...(visitor.pass
      ? [
          {
            id: "pass",
            title: "Visitor Pass Issued",
            description: `Pass ${visitor.pass.pass_code} was issued.`,
            timestamp: visitor.pass.issued_at,
          },
        ]
      : []),

    ...(visitor.status === "checked_out"
      ? [
          {
            id: "checkout",
            title: "Visitor Checked Out",
            description:
              "Visitor completed the visit and checked out.",
            timestamp: visitor.check_out_at,
          },
        ]
      : []),

    ...(visitor.status === "cancelled"
      ? [
          {
            id: "cancelled",
            title: "Visit Cancelled",
            description:
              "The visitor visit was cancelled.",
            timestamp: visitor.updated_at,
          },
        ]
      : []),
  ];

  return (
    <section style={containerStyle}>
      <div style={headerStyle}>
        <h2 style={titleStyle}>
          Visitor Activity
        </h2>

        <p style={descriptionStyle}>
          Timeline of visitor activity and status
          changes.
        </p>
      </div>

      <Timeline items={items} />
    </section>
  );
}

const containerStyle = {
  padding: 24,
  border: "1px solid #d8e0eb",
  borderRadius: 16,
  background: "#ffffff",
};

const headerStyle = {
  marginBottom: 24,
};

const titleStyle = {
  margin: 0,
  color: "#071f4e",
  fontSize: 20,
};

const descriptionStyle = {
  margin: "7px 0 0",
  color: "#60708c",
  fontSize: 13,
};