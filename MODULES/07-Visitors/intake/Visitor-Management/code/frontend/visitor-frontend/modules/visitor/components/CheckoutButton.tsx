"use client";

import { useState } from "react";
import { VisitorService } from "@/services/visitor.service";

interface CheckoutButtonProps {
  visitorId: number;
  disabled?: boolean;
  onSuccess?: () => void | Promise<void>;
}

export default function CheckoutButton({
  visitorId,
  disabled = false,
  onSuccess,
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout() {
    if (loading || disabled) return;

    const confirmed = window.confirm(
      "Are you sure you want to check out this visitor?"
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      setError(null);

      await VisitorService.checkOut(visitorId);

      if (onSuccess) {
        await onSuccess();
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to check out visitor."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleCheckout}
        disabled={disabled || loading}
        style={{
          padding: "12px 20px",
          border: "none",
          borderRadius: "10px",
          background:
            disabled || loading ? "#94a3b8" : "#0b2859",
          color: "#ffffff",
          fontSize: "14px",
          fontWeight: 700,
          cursor:
            disabled || loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Checking Out..." : "Check Out Visitor"}
      </button>

      {error && (
        <p
          role="alert"
          style={{
            marginTop: "10px",
            marginBottom: 0,
            color: "#b42318",
            fontSize: "14px",
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}