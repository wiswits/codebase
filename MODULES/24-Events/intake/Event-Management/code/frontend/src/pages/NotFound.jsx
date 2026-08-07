import { Link } from "react-router-dom";

import {
  ArrowLeft,
  SearchX,
} from "lucide-react";

export default function NotFound() {
  return (
    <div className="not-found-page">
      <div className="not-found-card">
        <div className="not-found-icon">
          <SearchX size={36} />
        </div>

        <span className="eyebrow">
          ERROR 404
        </span>

        <h1>Page not found</h1>

        <p>
          The page you're looking for doesn't
          exist or has been moved.
        </p>

        <Link
          to="/dashboard"
          className="primary-button"
        >
          <ArrowLeft size={18} />
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}