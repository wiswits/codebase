import QRCodeCard from "./QRCodeCard";

interface QRCodePanelProps {
  passCode?: string | null;
  visitorName?: string;
}

export default function QRCodePanel({
  passCode,
  visitorName,
}: QRCodePanelProps) {
  if (!passCode) {
    return (
      <section style={panelStyle}>
        <div style={emptyStyle}>
          <h3 style={emptyTitleStyle}>
            QR Code Unavailable
          </h3>

          <p style={emptyTextStyle}>
            A visitor pass must be generated before
            its QR code can be displayed.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section style={panelStyle}>
      <div style={headingStyle}>
        <div>
          <p style={eyebrowStyle}>
            DIGITAL PASS
          </p>

          <h2 style={titleStyle}>
            QR Code
          </h2>

          <p style={subtitleStyle}>
            {visitorName
              ? `Digital pass for ${visitorName}.`
              : "Digital visitor pass identification."}
          </p>
        </div>
      </div>

      <QRCodeCard
        value={passCode}
        title="Visitor Pass QR"
        description="Use this pass code for visitor identification and verification."
      />
    </section>
  );
}

const panelStyle = {
  width: "100%",
};

const headingStyle = {
  marginBottom: 18,
};

const eyebrowStyle = {
  margin: 0,
  color: "#c9922e",
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: 0.8,
};

const titleStyle = {
  margin: "6px 0",
  color: "#071f4e",
  fontSize: 22,
};

const subtitleStyle = {
  margin: 0,
  color: "#60708c",
  fontSize: 14,
};

const emptyStyle = {
  padding: 28,
  border: "1px solid #d8e0eb",
  borderRadius: 14,
  background: "#f8f5ed",
  textAlign: "center" as const,
};

const emptyTitleStyle = {
  margin: 0,
  color: "#071f4e",
  fontSize: 17,
};

const emptyTextStyle = {
  margin: "9px 0 0",
  color: "#60708c",
  fontSize: 14,
  lineHeight: 1.5,
};