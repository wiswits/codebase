"use client";

import { FormEvent, useState } from "react";
import { useVisitorPass } from "../hooks/useVisitorPass";

export default function PassGenerator() {
  const [visitorId, setVisitorId] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const {
    pass,
    loading,
    error,
    generatePass,
    printPass,
  } = useVisitorPass();

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const id = Number(visitorId);

    if (!Number.isInteger(id) || id <= 0) {
      return;
    }

    try {
      await generatePass(
        id,
        expiresAt
          ? new Date(expiresAt).toISOString()
          : null
      );
    } catch {
      // Hook handles error.
    }
  }

  return (
    <main className="visitor-page">
      <header className="visitor-page-header">
        <div>
          <p className="visitor-eyebrow">
            VISITOR MANAGEMENT
          </p>

          <h1>Pass Generator</h1>

          <p>
            Generate a pass for an active visitor.
          </p>
        </div>
      </header>

      <section className="visitor-card">
        <form onSubmit={handleSubmit}>
          <label htmlFor="passVisitorId">
            Visitor ID
          </label>

          <input
            id="passVisitorId"
            type="number"
            min="1"
            required
            value={visitorId}
            onChange={(event) =>
              setVisitorId(event.target.value)
            }
          />

          <label htmlFor="expiresAt">
            Expiry Date & Time
          </label>

          <input
            id="expiresAt"
            type="datetime-local"
            value={expiresAt}
            onChange={(event) =>
              setExpiresAt(event.target.value)
            }
          />

          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Generating..."
              : "Generate Pass"}
          </button>
        </form>

        {error && (
          <div role="alert">{error}</div>
        )}

        {pass && (
          <div className="visitor-pass-result">
            <h2>Visitor Pass</h2>

            <p>
              <strong>Pass Code:</strong>{" "}
              {pass.pass_code}
            </p>

            <p>
              <strong>Status:</strong>{" "}
              {pass.status}
            </p>

            <p>
              <strong>Issued:</strong>{" "}
              {new Date(
                pass.issued_at
              ).toLocaleString("en-IN")}
            </p>

            <button
              type="button"
              onClick={() => printPass(pass)}
            >
              Print Pass
            </button>
          </div>
        )}
      </section>
    </main>
  );
}