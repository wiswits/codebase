import { Inbox } from "lucide-react";
import Button from "./Button";

export default function EmptyState({
  icon: Icon = Inbox,
  title = "Nothing here yet",
  description = "There is currently no information to display.",
  actionLabel,
  actionIcon,
  onAction,
  className = "",
}) {
  return (
    <div className={`empty-state ${className}`}>
      <div className="empty-state-icon">
        <Icon
          size={30}
          strokeWidth={1.8}
          aria-hidden="true"
        />
      </div>

      <div className="empty-state-content">
        <h3>{title}</h3>

        {description && (
          <p>{description}</p>
        )}
      </div>

      {actionLabel && onAction && (
        <Button
          variant="primary"
          icon={actionIcon}
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}