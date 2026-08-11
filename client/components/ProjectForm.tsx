"use client";

import { useState } from "react";
import { formatCategory } from "@/lib/format";
import {
  CATEGORIES,
  VISIBILITIES,
  type Category,
  type Project,
  type ProjectInput,
  type Visibility,
} from "@/types/api";

const fieldClass =
  "mt-2 w-full border-b border-current/30 bg-transparent py-2 outline-none focus:border-current";
const labelClass =
  "font-mono text-[0.65rem] uppercase tracking-widest text-current/50";

/**
 * Shared create/edit form. One component so the two pages cannot drift apart
 * in validation or field coverage.
 */
export default function ProjectForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
  errors,
  saving,
}: {
  initial?: Project;
  submitLabel: string;
  onSubmit: (input: ProjectInput) => void;
  onCancel: () => void;
  errors: string[];
  saving: boolean;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [category, setCategory] = useState<Category>(
    initial?.category ?? "PHOTOGRAPHY",
  );
  const [mediaText, setMediaText] = useState(
    (initial?.media ?? []).map((m) => m.url).join("\n"),
  );
  const [tags, setTags] = useState((initial?.tags ?? []).join(", "));
  const [tools, setTools] = useState((initial?.tools ?? []).join(", "));
  const [projectUrl, setProjectUrl] = useState(initial?.projectUrl ?? "");
  const [visibility, setVisibility] = useState<Visibility>(
    initial?.visibility ?? "PUBLIC",
  );

  const splitList = (value: string, separator: RegExp) =>
    value
      .split(separator)
      .map((s) => s.trim())
      .filter(Boolean);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit({
      title,
      description,
      category,
      media: splitList(mediaText, /\n+/),
      tags: splitList(tags, /,/),
      tools: splitList(tools, /,/),
      projectUrl,
      visibility,
    });
  };

  const previews = splitList(mediaText, /\n+/);

  return (
    <form onSubmit={handleSubmit} className="mt-10 space-y-7">
      <label className="block">
        <span className={labelClass}>Title</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={120}
          className={fieldClass}
        />
      </label>

      <label className="block">
        <span className={labelClass}>Description</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          maxLength={5000}
          className={`${fieldClass} resize-y`}
        />
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
      </fieldset>

      <label className="block">
        <span className={labelClass}>
          Image URLs — one per line, first is the cover
        </span>
        <textarea
          value={mediaText}
          onChange={(e) => setMediaText(e.target.value)}
          rows={4}
          placeholder={"https://…/one.jpg\nhttps://…/two.jpg"}
          className={`${fieldClass} resize-y font-mono text-xs`}
        />
      </label>

      {previews.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {previews.map((url, index) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`${url}-${index}`}
              src={url}
              alt={`Preview ${index + 1}`}
              className="h-20 w-20 border border-current/15 object-cover"
            />
          ))}
        </div>
      )}

      <label className="block">
        <span className={labelClass}>Tools — comma separated</span>
        <input
          value={tools}
          onChange={(e) => setTools(e.target.value)}
          placeholder="Figma, Lightroom"
          className={fieldClass}
        />
      </label>

      <label className="block">
        <span className={labelClass}>Tags — comma separated</span>
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="Editorial, Lagos"
          className={fieldClass}
        />
      </label>

      <label className="block">
        <span className={labelClass}>Project URL</span>
        <input
          value={projectUrl}
          onChange={(e) => setProjectUrl(e.target.value)}
          placeholder="https://…"
          className={fieldClass}
        />
      </label>

      <fieldset>
        <legend className={labelClass}>Visibility</legend>
        <div className="mt-3 flex gap-2">
          {VISIBILITIES.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setVisibility(option)}
              aria-pressed={visibility === option}
              className={`border px-3 py-1 font-mono text-[0.6rem] uppercase tracking-widest transition ${
                visibility === option
                  ? "border-current bg-current/10"
                  : "border-current/20 text-current/50 hover:border-current/40"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </fieldset>

      {errors.length > 0 && (
        <ul role="alert" className="space-y-1 text-sm text-red-500">
          {errors.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
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
