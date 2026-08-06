import Link from "next/link";

import { VisitorService } from "@/services/visitor.service";
import PassPreview from "@/modules/visitor/components/PassPreview";
import PrintButton from "@/components/visitor/PrintButton";

function formatDate(value: string | null) {
  if (!value) return "—";

  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatStatus(status: string) {
  return status
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}

export default async function VisitorPassPage({
  params,
}: {
  params: Promise<{ visitorId: string }>;
}) {
  const { visitorId } = await params;

  const id = Number(visitorId);

  if (!Number.isInteger(id) || id <= 0) {
    return (
      <main style={pageStyle}>
        <div style={containerStyle}>
          <div style={errorStyle}>
            Invalid visitor ID.
          </div>

          <Link
            href="/visitors"
            style={backLinkStyle}
          >
            ← Back to Visitor Log
          </Link>
        </div>
      </main>
    );
  }

  let visitor = null;
  let errorMessage: string | null = null;

  try {
    const response =
      await VisitorService.get(id);

    visitor = response.data;
  } catch (error) {
    errorMessage =
      error instanceof Error
        ? error.message
        : "Unable to load visitor pass.";
  }

  if (errorMessage || !visitor) {
    return (
      <main style={pageStyle}>
        <div style={containerStyle}>
          <Link
            href="/visitors"
            style={backLinkStyle}
          >
            ← Back to Visitor Log
          </Link>

          <div style={errorStyle}>
            <strong>
              Unable to load visitor pass
            </strong>

            <div style={{ marginTop: "6px" }}>
              {errorMessage ??
                "Visitor not found."}
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!visitor.pass) {
    return (
      <main style={pageStyle}>
        <div style={containerStyle}>
          <Link
            href={`/visitors/${visitor.id}`}
            style={backLinkStyle}
          >
            ← Back to Visitor Details
          </Link>

          <section style={emptyStyle}>
            <p style={eyebrowStyle}>
              VISITOR PASS
            </p>

            <h1 style={titleStyle}>
              No Pass Available
            </h1>

            <p style={descriptionStyle}>
              A visitor pass has not been issued
              for{" "}
              <strong>
                {visitor.visitor_name}
              </strong>
              .
            </p>

            <Link
              href={`/visitors/${visitor.id}`}
              style={primaryButtonStyle}
            >
              Return to Visitor Details
            </Link>
          </section>
        </div>
      </main>
    );
  }

  const pass = visitor.pass;

  return (
    <main className="pass-preview-page">
      <div style={containerStyle}>
        <div className="pass-preview-toolbar">
          <Link
            href={`/visitors/${visitor.id}`}
            style={backLinkStyle}
          >
            ← Visitor Details
          </Link>

          <PrintButton />
        </div>

        <div style={headingStyle}>
          <p style={eyebrowStyle}>
            VISITOR MANAGEMENT
          </p>

          <h1 style={titleStyle}>
            Visitor Pass
          </h1>

          <p style={descriptionStyle}>
            Pass issued to{" "}
            <strong>
              {visitor.visitor_name}
            </strong>
            .
          </p>
        </div>

        <div className="pass-print-area">
          <div style={previewWrapperStyle}>
            <PassPreview
              visitor={visitor}
              pass={pass}
            />

            <div style={metadataStyle}>
              <div>
                <span style={metadataLabelStyle}>
                  Pass Status
                </span>

                <strong style={metadataValueStyle}>
                  {formatStatus(pass.status)}
                </strong>
              </div>

              <div>
                <span style={metadataLabelStyle}>
                  Issued
                </span>

                <strong style={metadataValueStyle}>
                  {formatDate(pass.issued_at)}
                </strong>
              </div>

              <div>
                <span style={metadataLabelStyle}>
                  Expires
                </span>

                <strong style={metadataValueStyle}>
                  {formatDate(pass.expires_at)}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

const pageStyle = {
  minHeight: "100vh",
  padding: "40px 24px",
  background: "#f8f5ed",
  fontFamily: "Arial, sans-serif",
};

const containerStyle = {
  width: "100%",
  maxWidth: "900px",
  margin: "0 auto",
};

const headingStyle = {
  marginBottom: "26px",
};

const eyebrowStyle = {
  margin: "0 0 8px",
  color: "#c9922e",
  fontSize: "13px",
  fontWeight: 700,
  letterSpacing: "0.05em",
};

const titleStyle = {
  margin: 0,
  color: "#071f4e",
  fontSize: "34px",
  fontWeight: 600,
};

const descriptionStyle = {
  marginTop: "10px",
  color: "#60708c",
  lineHeight: 1.6,
};

const previewWrapperStyle = {
  width: "100%",
  maxWidth: "760px",
};

const metadataStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(160px, 1fr))",
  gap: "12px",
  marginTop: "18px",
  padding: "20px",
  background: "#ffffff",
  border: "1px solid #d8e0eb",
  borderRadius: "14px",
};

const metadataLabelStyle = {
  display: "block",
  marginBottom: "6px",
  color: "#60708c",
  fontSize: "12px",
};

const metadataValueStyle = {
  color: "#071f4e",
  fontSize: "14px",
};

const backLinkStyle = {
  color: "#071f4e",
  textDecoration: "none",
  fontWeight: 700,
};

const emptyStyle = {
  marginTop: "24px",
  padding: "32px",
  background: "#ffffff",
  border: "1px solid #d8e0eb",
  borderRadius: "18px",
};

const primaryButtonStyle = {
  display: "inline-block",
  marginTop: "20px",
  padding: "13px 20px",
  background: "#0b2859",
  color: "#ffffff",
  borderRadius: "10px",
  textDecoration: "none",
  fontWeight: 700,
};

const errorStyle = {
  padding: "24px",
  marginBottom: "20px",
  border: "1px solid #fda29b",
  borderRadius: "14px",
  background: "#fff1f1",
  color: "#b42318",
};