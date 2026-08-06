import Link from "next/link";
import { PMS_ROUTES } from "../../constants";
import { Card } from "../shared/Card";

const LINKS = [
  {
    href: PMS_ROUTES.cycles,
    title: "Appraisal Cycles",
    description: "Review or manage the appraisal cycles for your organization.",
  },
  {
    href: PMS_ROUTES.goals,
    title: "Goals",
    description: "Set and track goals tied to the active appraisal cycle.",
  },
  {
    href: PMS_ROUTES.selfReview,
    title: "Self Review",
    description: "Complete your own review for the current cycle.",
  },
  {
    href: PMS_ROUTES.reviews,
    title: "Reviewer Form",
    description: "Submit or update reviews for your reports.",
  },
  {
    href: PMS_ROUTES.summary,
    title: "Rating Summary",
    description: "See the combined self and reviewer summary for a cycle.",
  },
];

export function QuickLinks() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {LINKS.map((link) => (
        <Link key={link.href} href={link.href} className="block focus:outline-none">
          <Card className="h-full transition-shadow hover:shadow-md focus-within:ring-2 focus-within:ring-[#1F3A5F]/40">
            <h3 className="font-semibold text-slate-900">{link.title}</h3>
            <p className="mt-1 text-sm text-slate-500">{link.description}</p>
          </Card>
        </Link>
      ))}
    </div>
  );
}
