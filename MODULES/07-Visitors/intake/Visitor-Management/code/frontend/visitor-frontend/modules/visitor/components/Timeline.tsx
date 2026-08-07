interface TimelineItem {
  id?: string | number;
  title: string;
  description?: string;
  timestamp?: string | null;
}

interface TimelineProps {
  items: TimelineItem[];
  emptyMessage?: string;
}

function formatDate(value?: string | null) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function Timeline({
  items,
  emptyMessage = "No activity available.",
}: TimelineProps) {
  if (items.length === 0) {
    return (
      <div style={emptyStyle}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div style={timelineStyle}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <div
            key={item.id ?? index}
            style={itemStyle}
          >
            <div style={markerColumnStyle}>
              <div style={markerStyle} />

              {!isLast && (
                <div style={lineStyle} />
              )}
            </div>

            <div style={contentStyle}>
              <div style={topRowStyle}>
                <strong style={titleStyle}>
                  {item.title}
                </strong>

                {item.timestamp && (
                  <span style={dateStyle}>
                    {formatDate(item.timestamp)}
                  </span>
                )}
              </div>

              {item.description && (
                <p style={descriptionStyle}>
                  {item.description}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const timelineStyle = {
  width: "100%",
};

const itemStyle = {
  display: "flex",
  gap: 16,
  minHeight: 78,
};

const markerColumnStyle = {
  width: 18,
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "center",
};

const markerStyle = {
  width: 12,
  height: 12,
  marginTop: 5,
  borderRadius: "50%",
  background: "#c9922e",
  border: "3px solid #f7f0df",
  boxSizing: "content-box" as const,
};

const lineStyle = {
  width: 2,
  flex: 1,
  marginTop: 5,
  background: "#d8e0eb",
};

const contentStyle = {
  flex: 1,
  paddingBottom: 24,
};

const topRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  flexWrap: "wrap" as const,
  gap: 10,
};

const titleStyle = {
  color: "#071f4e",
  fontSize: 14,
};

const dateStyle = {
  color: "#60708c",
  fontSize: 12,
};

const descriptionStyle = {
  margin: "7px 0 0",
  color: "#60708c",
  fontSize: 13,
  lineHeight: 1.5,
};

const emptyStyle = {
  padding: 24,
  borderRadius: 12,
  background: "#f8f5ed",
  color: "#60708c",
  textAlign: "center" as const,
};