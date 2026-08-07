import type { ObservationAuthor as Author } from "../../types/observation.types";
import { getStudentInitials } from "../../utils/observationFormatters";

interface ObservationAuthorProps {
  author?: Author;
}

export default function ObservationAuthor({
  author,
}: ObservationAuthorProps) {
  if (!author) {
    return (
      <div className="text-sm text-slate-500">
        Author information unavailable
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0F2147] text-sm font-semibold text-white">
        {getStudentInitials(author.name)}
      </div>

      <div>
        <p className="font-semibold text-[#0F2147]">
          {author.name}
        </p>
        <p className="text-sm text-slate-500">
          {author.role}
        </p>
      </div>
    </div>
  );
}