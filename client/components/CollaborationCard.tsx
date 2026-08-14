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
    <article className="group border-b border-[#1d1d1d] py-7 transition-colors hover:border-[#2a2a2a]">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <p className="font-mono text-[0.56rem] uppercase tracking-[0.24em] text-[#f5f1ea]/45">
          {formatCategory(collaboration.category)}
          {collaboration.location ? ` · ${collaboration.location}` : ""}
          {collaboration.isRemote ? " · Remote" : ""}
        </p>
        <p
          className={`font-mono text-[0.56rem] uppercase tracking-[0.24em] ${
            open ? "text-[#f7c1a4]" : "text-[#f5f1ea]/35"
          }`}
        >
          {collaboration.status}
        </p>
      </div>

      <h3 className="mt-3 text-2xl font-medium leading-none tracking-[-0.06em] text-[#f5f1ea] sm:text-3xl">
        <Link href={`/collaborations/${collaboration._id}`} className="hover:text-[#f7c1a4]">
          {collaboration.title}
        </Link>
      </h3>

      <p className="mt-3 line-clamp-2 max-w-3xl text-sm leading-relaxed text-[#f5f1ea]/72">
        {collaboration.description}
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[0.56rem] uppercase tracking-[0.22em] text-[#f5f1ea]/45">
        <span>
          <Link href={`/profile/${collaboration.creator?.username ?? ""}`} className="hover:text-[#f5f1ea]">
            {collaboration.creator?.name ?? "Unknown"}
          </Link>
        </span>
        {budget && <span className="text-[#f5f1ea]/70">{budget}</span>}
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
