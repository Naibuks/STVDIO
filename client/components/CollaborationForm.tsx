"use client";

import { useState } from "react";
import { formatCategory } from "@/lib/format";
import { toMajorUnits, toMinorUnits } from "@/lib/money";
import {
  CATEGORIES,
  CURRENCIES,
  type Category,
  type Collaboration,
  type CollaborationInput,
  type Currency,
} from "@/types/api";

const fieldClass =
  "mt-2 w-full border-b bg-transparent py-2 outline-none transition focus:border-current";
const labelClass =
  "font-mono text-[0.65rem] uppercase tracking-widest text-current/50";

/**
 * Shared create/edit form for an opportunity.
 *
 * Budget is entered in whole naira and converted to the minor units the API
 * stores, the same way ServiceForm handles a price.
 */
export default function CollaborationForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
  fieldErrors,
  formError,
  saving,
}: {
  initial?: Collaboration;
  submitLabel: string;
  onSubmit: (input: CollaborationInput) => void;
  onCancel: () => void;
  fieldErrors: Record<string, string>;
  formError: string | null;
  saving: boolean;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [category, setCategory] = useState<Category>(
    initial?.category ?? "PHOTOGRAPHY",
  );
  const [location, setLocation] = useState(initial?.location ?? "");
  const [isRemote, setIsRemote] = useState(initial?.isRemote ?? false);
  const [budgetMin, setBudgetMin] = useState(
    initial?.budget?.min != null ? String(toMajorUnits(initial.budget.min)) : "",
  );
  const [budgetMax, setBudgetMax] = useState(
    initial?.budget?.max != null ? String(toMajorUnits(initial.budget.max)) : "",
  );
  const [currency, setCurrency] = useState<Currency>(
    initial?.budget?.currency ?? "NGN",
  );
  const [deadline, setDeadline] = useState(
    initial?.deadline ? initial.deadline.slice(0, 10) : "",
  );
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  const errors = { ...localErrors, ...fieldErrors };

  /** Mirrors the server rules so obvious mistakes never leave the browser. */
  const validate = () => {
    const next: Record<string, string> = {};
    if (!title.trim()) next.title = "Title is required";
    if (!description.trim()) next.description = "Description is required";
    const min = budgetMin.trim() ? Number(budgetMin) : null;
    const max = budgetMax.trim() ? Number(budgetMax) : null;
    if (budgetMin.trim() && (Number.isNaN(min) || (min ?? 0) < 0))
      next.budget = "Minimum budget must be a positive number";
    else if (budgetMax.trim() && (Number.isNaN(max) || (max ?? 0) < 0))
      next.budget = "Maximum budget must be a positive number";
    else if (min != null && max != null && max < min)
      next.budget = "Maximum cannot be less than minimum";
    return next;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const next = validate();
    setLocalErrors(next);
    if (Object.keys(next).length) return;

    const budget: CollaborationInput["budget"] = {};
    if (budgetMin.trim()) budget.min = toMinorUnits(budgetMin);
    if (budgetMax.trim()) budget.max = toMinorUnits(budgetMax);
    if (budget.min != null || budget.max != null) budget.currency = currency;

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      category,
      location: location.trim(),
      isRemote,
      ...(budget.min != null || budget.max != null ? { budget } : {}),
      deadline: deadline || null,
    });
  };

  const errorFor = (key: string) =>
    errors[key] ? (
      <span role="alert" className="mt-1 block text-xs text-red-500">
        {errors[key]}
      </span>
    ) : null;
  const borderFor = (key: string) =>
    errors[key] ? "border-red-500" : "border-current/30";

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-10 space-y-7">
      <label className="block">
        <span className={labelClass}>Title</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          placeholder="Photographer for a Lagos fashion campaign"
          className={`${fieldClass} ${borderFor("title")}`}
        />
        {errorFor("title")}
      </label>

      <label className="block">
        <span className={labelClass}>Brief</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={6}
          maxLength={5000}
          placeholder="What the work is, when it happens, who you are looking for."
          className={`${fieldClass} ${borderFor("description")} resize-y`}
        />
        {errorFor("description")}
      </label>

      <fieldset>
        <legend className={labelClass}>Discipline</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {CATEGORIES.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setCategory(option)}
              aria-pressed={category === option}
              className={`border px-2 py-1 font-mono text-[0.6rem] uppercase tracking-widest transition ${
                category === option
                  ? "border-current bg-current/10"
                  : "border-current/20 text-current/50 hover:border-current/40"
              }`}
            >
              {formatCategory(option)}
            </button>
          ))}
        </div>
        {errorFor("category")}
      </fieldset>

      <div className="grid gap-7 sm:grid-cols-2">
        <label className="block">
          <span className={labelClass}>Location</span>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            maxLength={120}
            placeholder="Lagos, Nigeria"
            className={`${fieldClass} ${borderFor("location")}`}
          />
          {errorFor("location")}
        </label>

        <label className="block">
          <span className={labelClass}>Deadline</span>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className={`${fieldClass} ${borderFor("deadline")}`}
          />
          {errorFor("deadline")}
        </label>
      </div>

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={isRemote}
          onChange={(e) => setIsRemote(e.target.checked)}
          className="h-4 w-4 accent-current"
        />
        <span className={labelClass}>Can be done remotely</span>
      </label>

      <fieldset>
        <legend className={labelClass}>Budget — optional</legend>
        <div className="mt-3 grid gap-7 sm:grid-cols-3">
          <label className="block">
            <span className="font-mono text-[0.6rem] uppercase tracking-widest text-current/40">
              Minimum
            </span>
            <input
              inputMode="decimal"
              value={budgetMin}
              onChange={(e) => setBudgetMin(e.target.value)}
              placeholder="200000"
              className={`${fieldClass} ${borderFor("budget")}`}
            />
          </label>
          <label className="block">
            <span className="font-mono text-[0.6rem] uppercase tracking-widest text-current/40">
              Maximum
            </span>
            <input
              inputMode="decimal"
              value={budgetMax}
              onChange={(e) => setBudgetMax(e.target.value)}
              placeholder="450000"
              className={`${fieldClass} ${borderFor("budget")}`}
            />
          </label>
          <label className="block">
            <span className="font-mono text-[0.6rem] uppercase tracking-widest text-current/40">
              Currency
            </span>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Currency)}
              className={`${fieldClass} border-current/30 bg-transparent`}
            >
              {CURRENCIES.map((code) => (
                <option key={code} value={code} className="bg-neutral-900">
                  {code}
                </option>
              ))}
            </select>
          </label>
        </div>
        {errorFor("budget")}
      </fieldset>

      {formError && (
        <p role="alert" className="text-sm text-red-500">
          {formError}
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="border border-current px-4 py-3 font-mono text-[0.65rem] uppercase tracking-widest hover:bg-current/5 disabled:opacity-40"
        >
          {saving ? "Saving…" : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="border border-current/30 px-4 py-3 font-mono text-[0.65rem] uppercase tracking-widest text-current/60 hover:bg-current/5"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
