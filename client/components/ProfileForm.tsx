"use client";

import { useState } from "react";
import { updateMe } from "@/services/users";
import { ApiRequestError } from "@/services/api";
import { formatCategory } from "@/lib/format";
import { CATEGORIES, type Category, type SocialLinks, type User } from "@/types/api";

const SOCIAL_PLATFORMS: (keyof SocialLinks)[] = [
  "instagram",
  "behance",
  "dribbble",
  "twitter",
  "linkedin",
  "youtube",
  "tiktok",
];

const fieldClass =
  "mt-2 w-full border-b border-current/30 bg-transparent py-2 outline-none focus:border-current";
const labelClass =
  "font-mono text-[0.65rem] uppercase tracking-widest text-current/50";

/**
 * Profile editor. State is seeded from the `user` prop in useState
 * initialisers — the component is only mounted once the user is loaded, so no
 * effect is needed to copy props into state.
 */
export default function ProfileForm({
  user,
  onSaved,
  onCancel,
}: {
  user: User;
  onSaved: (user: User) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    name: user.name ?? "",
    username: user.username ?? "",
    bio: user.bio ?? "",
    location: user.location ?? "",
    website: user.website ?? "",
    avatarUrl: user.avatar?.url ?? "",
    skills: (user.skills ?? []).join(", "),
  });
  const [categories, setCategories] = useState<Category[]>(user.categories ?? []);
  const [socials, setSocials] = useState<SocialLinks>(user.socialLinks ?? {});
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const toggleCategory = (category: Category) =>
    setCategories((current) =>
      current.includes(category)
        ? current.filter((c) => c !== category)
        : [...current, category],
    );

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrors([]);
    setSaving(true);
    try {
      const { user: updated } = await updateMe({
        name: form.name,
        username: form.username,
        bio: form.bio,
        location: form.location,
        website: form.website,
        skills: form.skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        categories,
        avatar: form.avatarUrl ? { url: form.avatarUrl } : null,
        socialLinks: socials,
      });
      onSaved(updated);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setErrors(err.errors?.length ? err.errors : [err.message]);
      } else {
        setErrors([err instanceof Error ? err.message : "Update failed"]);
      }
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="mt-10 space-y-7">
      <label className="block">
        <span className={labelClass}>Name</span>
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          maxLength={80}
          className={fieldClass}
        />
      </label>

      <label className="block">
        <span className={labelClass}>Username</span>
        <input
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          className={fieldClass}
        />
      </label>

      <label className="block">
        <span className={labelClass}>Bio — max 500</span>
        <textarea
          value={form.bio}
          onChange={(e) => setForm({ ...form, bio: e.target.value })}
          rows={4}
          maxLength={500}
          className={`${fieldClass} resize-y`}
        />
      </label>

      <label className="block">
        <span className={labelClass}>Location</span>
        <input
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
          className={fieldClass}
        />
      </label>

      <label className="block">
        <span className={labelClass}>Avatar image URL</span>
        <input
          value={form.avatarUrl}
          onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })}
          placeholder="https://…"
          className={fieldClass}
        />
      </label>

      <label className="block">
        <span className={labelClass}>Website</span>
        <input
          value={form.website}
          onChange={(e) => setForm({ ...form, website: e.target.value })}
          placeholder="https://…"
          className={fieldClass}
        />
      </label>

      <label className="block">
        <span className={labelClass}>Skills — comma separated</span>
        <input
          value={form.skills}
          onChange={(e) => setForm({ ...form, skills: e.target.value })}
          placeholder="Photography, Retouching"
          className={fieldClass}
        />
      </label>

      <fieldset>
        <legend className={labelClass}>Categories — up to 5</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {CATEGORIES.map((category) => {
            const active = categories.includes(category);
            return (
              <button
                key={category}
                type="button"
                onClick={() => toggleCategory(category)}
                aria-pressed={active}
                className={`border px-2 py-1 font-mono text-[0.6rem] uppercase tracking-widest transition ${
                  active
                    ? "border-current bg-current/10"
                    : "border-current/20 text-current/50 hover:border-current/40"
                }`}
              >
                {formatCategory(category)}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className={labelClass}>Social links</legend>
        <div className="mt-3 space-y-4">
          {SOCIAL_PLATFORMS.map((platform) => (
            <label key={platform} className="block">
              <span className="font-mono text-[0.6rem] uppercase tracking-widest text-current/40">
                {platform}
              </span>
              <input
                value={socials[platform] ?? ""}
                onChange={(e) =>
                  setSocials({ ...socials, [platform]: e.target.value })
                }
                placeholder="https://…"
                className={fieldClass}
              />
            </label>
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
          {saving ? "Saving…" : "Save changes"}
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
