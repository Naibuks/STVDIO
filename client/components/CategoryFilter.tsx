"use client";

import { formatCategory } from "@/lib/format";
import { CATEGORIES, type Category } from "@/types/api";

/** Horizontal category chips. An empty value means "all". */
export default function CategoryFilter({
  value,
  onChange,
}: {
  value: Category | "";
  onChange: (category: Category | "") => void;
}) {
  const chip = (active: boolean) =>
    `shrink-0 border px-2 py-1 font-mono text-[0.6rem] uppercase tracking-widest transition ${
      active
        ? "border-current bg-current/10"
        : "border-current/20 text-current/50 hover:border-current/40"
    }`;

  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      <button
        type="button"
        onClick={() => onChange("")}
        aria-pressed={value === ""}
        className={chip(value === "")}
      >
        All
      </button>
      {CATEGORIES.map((category) => (
        <button
          key={category}
          type="button"
          onClick={() => onChange(category)}
          aria-pressed={value === category}
          className={chip(value === category)}
        >
          {formatCategory(category)}
        </button>
      ))}
    </div>
  );
}
