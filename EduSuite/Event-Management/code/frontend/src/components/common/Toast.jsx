import { useEffect } from "react";
import {
  CheckCircle2,
  AlertCircle,
  Info,
  TriangleAlert,
  X,
} from "lucide-react";

const TOAST_TYPES = {
  success: {
    icon: CheckCircle2,
    title: "Success",
  },

  error: {
    icon: AlertCircle,
    title: "Something went wrong",
  },

  warning: {
    icon: TriangleAlert,
    title: "Warning",
  },

  info: {
    icon: Info,
    title: "Information",
  },
};

export default function Toast({
  open,
  type = "success",
  title,
  message,
  duration = 3500,
  onClose,
}) {
  useEffect(() => {
    if (!open || !duration) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      onClose?.();
    }, duration);

    return () => {
      window.clearTimeout(timer);
    };
  }, [open, duration, onClose]);

  if (!open) {
    return null;
  }

  const config =
    TOAST_TYPES[type] || TOAST_TYPES.info;

  const Icon = config.icon;

  return (
    <div
      className={`toast toast-${type}`}
      role={type === "error" ? "alert" : "status"}
      aria-live={
        type === "error"
          ? "assertive"
          : "polite"
      }
    >
      <div className="toast-icon">
        <Icon
          size={20}
          aria-hidden="true"
        />
      </div>

      <div className="toast-content">
        <strong className="toast-title">
          {title || config.title}
        </strong>

        {message && (
          <p className="toast-message">
            {message}
          </p>
        )}
      </div>

      <button
        type="button"
        className="toast-close"
        onClick={onClose}
        aria-label="Dismiss notification"
      >
        <X size={17} />
      </button>
    </div>
  );
}