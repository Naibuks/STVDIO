import Link from "next/link";
import { formatCategory, formatDate } from "@/lib/format";
import { formatMoney } from "@/lib/money";
import type { Budget, Collaboration } from "@/types/api";

/** "₦200,000 — ₦450,000", "From ₦200,000", "Up to ₦450,000", or "" */
export const formatBudget = (budget?: Budget): string => {
  if (!budget) return "";
  const { min, max, currency = "NGN" } = budget;
  if (min != null && max != null) {
    return min === max
      ? formatMoney(min, currency)
      : `${formatMoney(min, currency)} — ${formatMoney(max, currency)}`;
  }
  if (min != null) return `From ${formatMoney(min, currency)}`;
  if (max != null) return `Up to ${formatMoney(max, currency)}`;
  return "";
};

/** One opportunity on the board. */
export default function CollaborationCard({
  collaboration,
}: {
  collaboration: Collaboration;
}) {
  const budget = formatBudget(collaboration.budget);
  const open = collaboration.status === "OPEN";

  return (
    <article className="group border-t border-current/15 py-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <p className="font-mono text-[0.6rem] uppercase tracking-widest text-current/50">
          {formatCategory(collaboration.category)}
          {collaboration.location ? ` · ${collaboration.location}` : ""}
          {collaboration.isRemote ? " · Remote" : ""}
        </p>
        <p
          className={`font-mono text-[0.6rem] uppercase tracking-widest ${
            open ? "text-current/50" : "text-current/30"
          }`}
        >
          {collaboration.status}
        </p>
      </div>

      <h3 className="mt-2 text-xl font-medium leading-snug tracking-tight sm:text-2xl">
        <Link
          href={`/collaborations/${collaboration._id}`}
          className="hover:opacity-60"
        >
          {collaboration.title}
        </Link>
      </h3>

      <p className="mt-2 line-clamp-2 max-w-2xl text-sm text-current/70">
        {collaboration.description}
      </p>

      <div className="mt-4 flex flex-wrap items-baseline gap-x-6 gap-y-2 font-mono text-[0.6rem] uppercase tracking-widest text-current/40">
        <span>
          <Link
            href={`/profile/${collaboration.creator?.username ?? ""}`}
            className="hover:opacity-70"
          >
            {collaboration.creator?.name ?? "Unknown"}
          </Link>
        </span>
        {budget && <span className="text-current/70">{budget}</span>}
        {collaboration.deadline && (
          <span>Closes {formatDate(collaboration.deadline)}</span>
        )}
        <span>
          {collaboration.applicationsCount}{" "}
          {collaboration.applicationsCount === 1 ? "application" : "applications"}
        </span>
      </div>
    </article>
  );
}
