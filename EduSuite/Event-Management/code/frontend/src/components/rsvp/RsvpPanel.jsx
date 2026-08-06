import {
  Check,
  HelpCircle,
  X,
} from "lucide-react";

import Button from "../common/Button";

export default function RsvpPanel({
  currentStatus,
  onRespond,
  loading = false,
}) {
  return (
    <article className="panel rsvp-panel">
      <div className="panel-header">
        <div>
          <span className="section-kicker">
            RSVP
          </span>

          <h2>Will you attend?</h2>

          <p>
            Let the event organizer know
            your response.
          </p>
        </div>
      </div>

      {currentStatus && (
        <div className="current-rsvp">
          Current response:
          <strong>
            {String(
              currentStatus
            ).toUpperCase()}
          </strong>
        </div>
      )}

      <div className="rsvp-actions">
        <Button
          icon={Check}
          disabled={loading}
          onClick={() =>
            onRespond?.("going")
          }
        >
          Going
        </Button>

        <Button
          variant="secondary"
          icon={HelpCircle}
          disabled={loading}
          onClick={() =>
            onRespond?.("maybe")
          }
        >
          Maybe
        </Button>

        <Button
          variant="danger"
          icon={X}
          disabled={loading}
          onClick={() =>
            onRespond?.("declined")
          }
        >
          Can't attend
        </Button>
      </div>
    </article>
  );
}