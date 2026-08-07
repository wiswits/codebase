import type { ReactNode } from "react";

interface QRCodeCardProps {
  title?: string;
  value: string;
  description?: string;
  children?: ReactNode;
}

export default function QRCodeCard({
  title = "Visitor QR Code",
  value,
  description = "Scan this code to identify the visitor pass.",
  children,
}: QRCodeCardProps) {
  return (
    <div style={cardStyle}>
      <div style={headerStyle}>
        <h3 style={titleStyle}>
          {title}
        </h3>

        <p style={descriptionStyle}>
          {description}
        </p>
      </div>

      <div style={qrContainerStyle}>
        {children || (
          <div style={placeholderStyle}>
            <span style={placeholderTextStyle}>
              QR
            </span>
          </div>
        )}
      </div>

      <div style={valueContainerStyle}>
        <span style={labelStyle}>
          PASS CODE
        </span>

        <strong style={valueStyle}>
          {value}
        </strong>
      </div>
    </div>
  );
}

const cardStyle = {
  width: "100%",
  padding: 24,
  border: "1px solid #d8e0eb",
  borderRadius: 16,
  background: "#ffffff",
  textAlign: "center" as const,
  boxSizing: "border-box" as const,
};

const headerStyle = {
  marginBottom: 22,
};

const titleStyle = {
  margin: 0,
  color: "#071f4e",
  fontSize: 18,
};

const descriptionStyle = {
  margin: "8px 0 0",
  color: "#60708c",
  fontSize: 13,
  lineHeight: 1.5,
};

const qrContainerStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 190,
};

const placeholderStyle = {
  width: 170,
  height: 170,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "2px dashed #b8c2d1",
  borderRadius: 12,
  background: "#f8f9fb",
};

const placeholderTextStyle = {
  color: "#60708c",
  fontSize: 24,
  fontWeight: 800,
};

const valueContainerStyle = {
  paddingTop: 18,
  borderTop: "1px solid #e1e6ee",
};

const labelStyle = {
  display: "block",
  marginBottom: 7,
  color: "#60708c",
  fontSize: 11,
  fontWeight: 700,
};

const valueStyle = {
  color: "#071f4e",
  fontSize: 15,
  wordBreak: "break-all" as const,
};