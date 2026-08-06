"use client";

import { FormEvent, useState } from "react";
import { useCheckout } from "../hooks/useCheckout";

export default function CheckOut() {
  const [visitorId, setVisitorId] = useState("");
  const [success, setSuccess] = useState<
    string | null
  >(null);

  const {
    checkout,
    loading,
    error,
    clearError,
  } = useCheckout();

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    clearError();
    setSuccess(null);

    const id = Number(visitorId);

    if (!Number.isInteger(id) || id <= 0) {
      return;
    }

    try {
      const visitor = await checkout(id);

      setSuccess(
        `${visitor.visitor_name} checked out successfully.`
      );
    } catch {
      // Hook already handles the error state.
    }
  }

  return (
    <main className="visitor-page">
      <header className="visitor-page-header">
        <div>
          <p className="visitor-eyebrow">
            VISITOR MANAGEMENT
          </p>

          <h1>Visitor Check-Out</h1>

          <p>
            Complete an active visitor&apos;s visit.
          </p>
        </div>
      </header>

      <section className="visitor-card">
        <form onSubmit={handleSubmit}>
          <label htmlFor="checkoutVisitorId">
            Visitor ID
          </label>

          <input
            id="checkoutVisitorId"
            type="number"
            min="1"
            value={visitorId}
            onChange={(event) =>
              setVisitorId(event.target.value)
            }
            placeholder="Enter visitor ID"
            required
          />

          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Checking Out..."
              : "Check Out Visitor"}
          </button>
        </form>

        {success && (
          <div role="status">{success}</div>
        )}

        {error && (
          <div role="alert">{error}</div>
        )}
      </section>
    </main>
  );
}