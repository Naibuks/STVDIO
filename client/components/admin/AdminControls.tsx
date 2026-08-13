"use client";

import type { AdminPaginated } from "@/types/api";

/** A single statistic. Deliberately plain — no charts, no decoration. */
export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="border border-current/15 p-5">
      <p className="font-mono text-[0.55rem] uppercase tracking-widest text-current/40">
        {label}
      </p>
      <p className="mt-2 text-3xl font-medium tracking-tight">{value}</p>
      {hint && (
        <p className="mt-1 font-mono text-[0.55rem] uppercase tracking-widest text-current/30">
          {hint}
        </p>
      )}
    </div>
  );
}

/** Search box that only submits on Enter, so it does not fire per keystroke. */
export function SearchBox({
  value,
  onChange,
  onSubmit,
  placeholder = "Search…",
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="flex max-w-md flex-1 gap-3"
    >
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="min-w-0 flex-1 border-b border-current/30 bg-transparent py-2 text-sm outline-none focus:border-current"
      />
      <button
        type="submit"
        className="shrink-0 border border-current px-3 py-2 font-mono text-[0.6rem] uppercase tracking-widest hover:bg-current/5"
      >
        Search
      </button>
    </form>
  );
}

/** Horizontal filter chips. `value` of "" means no filter. */
export function FilterChips({
  options,
  value,
  onChange,
  allLabel = "All",
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  allLabel?: string;
}) {
  const chip = (active: boolean) =>
    `shrink-0 border px-2 py-1 font-mono text-[0.6rem] uppercase tracking-widest transition ${
      active
        ? "border-current bg-current/10"
        : "border-current/20 text-current/50 hover:border-current/40"
    }`;

  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      <button type="button" onClick={() => onChange("")} className={chip(value === "")}>
        {allLabel}
      </button>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
          className={chip(value === option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function Pagination({
  meta,
  onPage,
}: {
  meta: AdminPaginated | null;
  onPage: (page: number) => void;
}) {
  if (!meta || meta.totalPages <= 1) return null;

  return (
    <div className="mt-8 flex items-center justify-between gap-4 border-t border-current/15 pt-5">
      <p className="font-mono text-[0.6rem] uppercase tracking-widest text-current/40">
        Page {meta.page} of {meta.totalPages} · {meta.total} total
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onPage(meta.page - 1)}
          disabled={meta.page <= 1}
          className="border border-current/30 px-3 py-2 font-mono text-[0.6rem] uppercase tracking-widest hover:bg-current/5 disabled:opacity-30"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={() => onPage(meta.page + 1)}
          disabled={!meta.hasMore}
          className="border border-current/30 px-3 py-2 font-mono text-[0.6rem] uppercase tracking-widest hover:bg-current/5 disabled:opacity-30"
        >
          Next
        </button>
      </div>
    </div>
  );
}

/** Consistent page heading for every admin screen. */
export function AdminHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="mb-6">
      <h1 className="text-2xl font-medium tracking-tight sm:text-3xl">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-2 font-mono text-[0.6rem] uppercase tracking-widest text-current/50">
          {subtitle}
        </p>
      )}
    </header>
  );
}
