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
    `shrink-0 border px-3 py-2 font-mono text-[0.56rem] uppercase tracking-[0.24em] transition-colors duration-200 ${
      active
        ? "border-[#f3efe8] bg-[#f3efe8] text-[#070707]"
        : "border-[#1d1d1d] bg-transparent text-[#f3efe8]/60 hover:border-[#2a2a2a] hover:text-[#f3efe8]"
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
