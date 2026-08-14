"use client";

import { useState } from "react";
import MediaUploader from "./MediaUploader";
import { formatCategory } from "@/lib/format";
import {
  CATEGORIES,
  VISIBILITIES,
  type Category,
  type Media,
  type Project,
  type ProjectInput,
  type Visibility,
} from "@/types/api";

const fieldClass =
  "mt-2 w-full border-b border-[#2a2a2a] bg-transparent py-2 text-[#f5f1ea] placeholder:text-[#f5f1ea]/35 outline-none transition focus:border-[#d66a38]";
const labelClass =
  "font-mono text-[0.62rem] uppercase tracking-[0.24em] text-[#f5f1ea]/55";

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
  // Existing media is kept as-is when editing, so a project uploaded before
  // this change keeps its items and can still be reordered by removal.
  const [media, setMedia] = useState<Media[]>(initial?.media ?? []);
  const [uploadBusy, setUploadBusy] = useState(false);
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
      media,
      tags: splitList(tags, /,/),
      tools: splitList(tools, /,/),
      projectUrl,
      visibility,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mt-10 space-y-8 rounded-none border border-[#1d1d1d] bg-[#0d0d0d] p-5 sm:p-8">
      <label className="block">
        <span className={labelClass}>Title</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={120}
          placeholder="Untitled project"
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
          placeholder="Tell the story behind the work…"
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
              className={`border px-2.5 py-2 font-mono text-[0.56rem] uppercase tracking-[0.22em] transition ${
                category === option
                  ? "border-[#d66a38] bg-[#d66a38]/10 text-[#f7c1a4]"
                  : "border-[#2a2a2a] text-[#f5f1ea]/55 hover:border-[#d66a38] hover:text-[#f5f1ea]"
              }`}
            >
              {formatCategory(option)}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="border-t border-[#1d1d1d] pt-6">
        <MediaUploader
          value={media}
          onChange={setMedia}
          onBusyChange={setUploadBusy}
        />
      </div>

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
        <div className="mt-3 flex flex-wrap gap-2">
          {VISIBILITIES.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setVisibility(option)}
              aria-pressed={visibility === option}
              className={`border px-3 py-2 font-mono text-[0.56rem] uppercase tracking-[0.22em] transition ${
                visibility === option
                  ? "border-[#d66a38] bg-[#d66a38]/10 text-[#f7c1a4]"
                  : "border-[#2a2a2a] text-[#f5f1ea]/55 hover:border-[#d66a38] hover:text-[#f5f1ea]"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </fieldset>

      {errors.length > 0 && (
        <ul role="alert" className="space-y-1 text-sm text-[#f76b5f]">
          {errors.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-3 pt-2">
        <button
          type="submit"
          // Publishing mid-upload would drop the files still in flight.
          disabled={saving || uploadBusy}
          className="border border-[#d66a38] bg-[#d66a38]/10 px-5 py-3 font-mono text-[0.58rem] uppercase tracking-[0.22em] text-[#f7c1a4] transition hover:bg-[#d66a38]/15 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving ? "Saving…" : uploadBusy ? "Uploading…" : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="border border-[#2a2a2a] bg-[#111111] px-5 py-3 font-mono text-[0.58rem] uppercase tracking-[0.22em] text-[#f5f1ea] transition hover:border-[#d66a38]"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
