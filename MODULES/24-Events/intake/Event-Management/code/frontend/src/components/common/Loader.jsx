import { LoaderCircle } from "lucide-react";

export default function Loader({
  text = "Loading...",
  size = "md",
  fullPage = false,
}) {
  return (
    <div
      className={[
        "loader-container",
        `loader-${size}`,
        fullPage ? "loader-full-page" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      role="status"
      aria-live="polite"
    >
      <LoaderCircle
        className="loader-spinner"
        aria-hidden="true"
      />

      {text && (
        <span className="loader-text">
          {text}
        </span>
      )}
    </div>
  );
}