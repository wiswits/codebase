import { LoaderCircle } from "lucide-react";

export default function Button({
  children,
  type = "button",
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  icon: Icon,
  iconPosition = "left",
  className = "",
  onClick,
  ...props
}) {
  const classes = [
    "ui-button",
    `ui-button-${variant}`,
    `ui-button-${size}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <>
          <LoaderCircle
            size={18}
            className="button-spinner"
            aria-hidden="true"
          />
          <span>{children}</span>
        </>
      ) : (
        <>
          {Icon && iconPosition === "left" && (
            <Icon
              size={18}
              aria-hidden="true"
            />
          )}

          <span>{children}</span>

          {Icon && iconPosition === "right" && (
            <Icon
              size={18}
              aria-hidden="true"
            />
          )}
        </>
      )}
    </button>
  );
}