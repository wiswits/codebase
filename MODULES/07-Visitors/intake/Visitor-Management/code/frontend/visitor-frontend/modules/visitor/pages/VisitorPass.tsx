"use client";

import { FormEvent, useState } from "react";
import { useVisitorPass } from "../hooks/useVisitorPass";

export default function VisitorPass() {
  const [visitorId, setVisitorId] = useState("");

  const {
    pass,
    loading,
    error,
    generatePass,
    printPass,
  } = useVisitorPass();

  async function handleGenerate(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const id = Number(visitorId);

    if (!Number.isInteger(id) || id <= 0) {
      return;
    }

    try {
      await generatePass(id);
    } catch {
      // Error handled by hook.
    }
  }

  return (
    <main className="visitor-page">
      <header className="visitor-page-header">
        <div>
          <p className="visitor-eyebrow">
            VISITOR MANAGEMENT
          </p>

          <h1>Visitor Pass</h1>

          <p>
            Generate and manage visitor passes.
          </p>
        </div>
      </header>

      <section className="visitor-card">
        <form onSubmit={handleGenerate}>
          <label htmlFor="visitorPassId">
            Visitor ID
          </label>

          <input
            id="visitorPassId"
            type="number"
            min="1"
            value={visitorId}
            onChange={(event) =>
              setVisitorId(event.target.value)
            }
            required
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
          <article className="visitor-pass-card">
            <p>VISITOR PASS</p>

            <h2>{pass.pass_code}</h2>

            <p>
              Status: <strong>{pass.status}</strong>
            </p>

            <p>
              Issued:{" "}
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
          </article>
        )}
      </section>
    </main>
  );
}