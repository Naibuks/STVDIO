"use client";

import { useState } from "react";
import SafeImage from "./SafeImage";
import { formatCategory } from "@/lib/format";
import { toMajorUnits, toMinorUnits } from "@/lib/money";
import {
  CATEGORIES,
  CURRENCIES,
  type Category,
  type Currency,
  type Service,
  type ServiceInput,
} from "@/types/api";

const fieldClass =
  "mt-2 w-full border-b bg-transparent py-2 outline-none transition focus:border-current";
const labelClass =
  "font-mono text-[0.65rem] uppercase tracking-widest text-current/50";

/**
 * Shared create/edit form for a marketplace listing.
 *
 * Price is entered in major units (naira, dollars) and converted to the minor
 * units the API stores — the user should never have to think in kobo.
 */
export default function ServiceForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
  fieldErrors,
  formError,
  saving,
}: {
  initial?: Service;
  submitLabel: string;
  onSubmit: (input: ServiceInput) => void;
  onCancel: () => void;
  fieldErrors: Record<string, string>;
  formError: string | null;
  saving: boolean;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [category, setCategory] = useState<Category>(
    initial?.category ?? "GRAPHIC_DESIGN",
  );
  const [price, setPrice] = useState(
    initial ? String(toMajorUnits(initial.price)) : "",
  );
  const [currency, setCurrency] = useState<Currency>(initial?.currency ?? "NGN");
  const [deliveryTime, setDeliveryTime] = useState(
    initial ? String(initial.deliveryTime) : "",
  );
  const [deliverables, setDeliverables] = useState(
    (initial?.deliverables ?? []).join(", "),
  );
  const [mediaText, setMediaText] = useState(
    (initial?.media ?? []).map((m) => m.url).join("\n"),
  );
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  const errors = { ...localErrors, ...fieldErrors };
  const splitList = (value: string, separator: RegExp) =>
    value
      .split(separator)
      .map((s) => s.trim())
      .filter(Boolean);

  /** Mirrors the server rules so obvious mistakes never leave the browser. */
  const validate = () => {
    const next: Record<string, string> = {};
    if (!title.trim()) next.title = "Title is required";
    if (!description.trim()) next.description = "Description is required";
    if (!price.trim() || Number.isNaN(Number(price)))
      next.price = "Price is required";
    else if (Number(price) < 0) next.price = "Price cannot be negative";
    const days = Number(deliveryTime);
    if (!deliveryTime.trim() || !Number.isInteger(days))
      next.deliveryTime = "Delivery time must be a whole number of days";
    else if (days < 1 || days > 365)
      next.deliveryTime = "Delivery time must be between 1 and 365 days";
    return next;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const next = validate();
    setLocalErrors(next);
    if (Object.keys(next).length) return;

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      category,
      price: toMinorUnits(price),
      currency,
      deliveryTime: Number(deliveryTime),
      deliverables: splitList(deliverables, /,/),
      media: splitList(mediaText, /\n+/),
    });
  };

  const previews = splitList(mediaText, /\n+/);
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
          className={`${fieldClass} ${borderFor("title")}`}
        />
        {errorFor("title")}
      </label>

      <label className="block">
        <span className={labelClass}>Description</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          maxLength={5000}
          className={`${fieldClass} ${borderFor("description")} resize-y`}
        />
        {errorFor("description")}
      </label>

      <fieldset>
        <legend className={labelClass}>Category</legend>
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

      <div className="grid gap-7 sm:grid-cols-3">
        <label className="block sm:col-span-2">
          <span className={labelClass}>Price</span>
          <input
            inputMode="decimal"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="180000"
            className={`${fieldClass} ${borderFor("price")}`}
          />
          {errorFor("price") ?? (
            <span className="mt-1 block font-mono text-[0.6rem] uppercase tracking-widest text-current/30">
              Whole {currency}, not minor units
            </span>
          )}
        </label>

        <label className="block">
          <span className={labelClass}>Currency</span>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as Currency)}
            className={`${fieldClass} ${borderFor("currency")} bg-transparent`}
          >
            {CURRENCIES.map((code) => (
              <option key={code} value={code} className="bg-neutral-900">
                {code}
              </option>
            ))}
          </select>
          {errorFor("currency")}
        </label>
      </div>

      <label className="block">
        <span className={labelClass}>Delivery time — days</span>
        <input
          inputMode="numeric"
          value={deliveryTime}
          onChange={(e) => setDeliveryTime(e.target.value)}
          placeholder="7"
          className={`${fieldClass} ${borderFor("deliveryTime")}`}
        />
        {errorFor("deliveryTime")}
      </label>

      <label className="block">
        <span className={labelClass}>Deliverables — comma separated</span>
        <input
          value={deliverables}
          onChange={(e) => setDeliverables(e.target.value)}
          placeholder="3 concepts, Source files, Usage rights"
          className={`${fieldClass} ${borderFor("deliverables")}`}
        />
        {errorFor("deliverables")}
      </label>

      <label className="block">
        <span className={labelClass}>Image URLs — one per line</span>
        <textarea
          value={mediaText}
          onChange={(e) => setMediaText(e.target.value)}
          rows={3}
          placeholder={"https://…/one.jpg"}
          className={`${fieldClass} ${borderFor("media")} resize-y font-mono text-xs`}
        />
        {errorFor("media")}
      </label>

      {previews.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {previews.map((url, index) => (
            <SafeImage
              key={`${url}-${index}`}
              src={url}
              alt={`Preview ${index + 1}`}
              className="h-20 w-20 border border-current/15 object-cover"
              fallback={
                <div className="flex h-20 w-20 items-center justify-center border border-dashed border-current/25 text-center font-mono text-[0.5rem] uppercase leading-tight tracking-widest text-current/40">
                  Can&rsquo;t load
                </div>
              }
            />
          ))}
        </div>
      )}

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
