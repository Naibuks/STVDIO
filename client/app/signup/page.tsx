"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { ApiRequestError } from "@/services/api";

type Role = "CREATIVE" | "BRAND";

const fieldClass =
  "mt-2 w-full border-b bg-transparent py-2 outline-none transition focus:border-current";
const labelClass =
  "font-mono text-[0.65rem] uppercase tracking-widest text-current/50";

/**
 * /signup — create an account.
 *
 * Client-side checks exist only to save a round trip; every rule is enforced
 * again by the server, which is the authority. Field errors returned by the
 * API are rendered under their own input via the `fields` map.
 */
export default function SignupPage() {
  const { signUp } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [role, setRole] = useState<Role>("CREATIVE");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const set = (key: keyof typeof form) => (value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    // Clear a field's error as soon as the user starts correcting it.
    setFieldErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  /** Mirrors the server rules so obvious mistakes are caught before submit. */
  const validate = () => {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = "Name is required";
    if (!form.username.trim()) errors.username = "Username is required";
    else if (!/^[a-zA-Z0-9_]{3,30}$/.test(form.username.trim()))
      errors.username =
        "Username must be 3-30 characters: letters, numbers and underscores";
    if (!form.email.trim()) errors.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(form.email.trim()))
      errors.email = "Please provide a valid email address";
    if (!form.password) errors.password = "Password is required";
    else if (form.password.length < 8)
      errors.password = "Password must be at least 8 characters";
    if (form.confirmPassword !== form.password)
      errors.confirmPassword = "Passwords do not match";
    return errors;
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;

    setFormError(null);
    const localErrors = validate();
    if (Object.keys(localErrors).length) {
      setFieldErrors(localErrors);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);
    try {
      await signUp({
        name: form.name.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
        role,
      });
      router.push("/profile");
    } catch (err) {
      if (err instanceof ApiRequestError) {
        if (err.fields) setFieldErrors(err.fields);
        // Only show the banner when nothing landed on a specific input.
        if (!err.fields || Object.keys(err.fields).length === 0) {
          setFormError(err.message);
        }
      } else {
        setFormError(
          err instanceof Error ? err.message : "Could not create your account",
        );
      }
      setSubmitting(false);
    }
  };

  const field = (
    key: keyof typeof form,
    label: string,
    type: string,
    extra?: { autoComplete?: string; hint?: string; maxLength?: number },
  ) => {
    const error = fieldErrors[key];
    return (
      <label className="block">
        <span className={labelClass}>{label}</span>
        <input
          type={type}
          value={form[key]}
          onChange={(e) => set(key)(e.target.value)}
          autoComplete={extra?.autoComplete}
          maxLength={extra?.maxLength}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${key}-error` : undefined}
          className={`${fieldClass} ${
            error ? "border-red-500" : "border-current/30"
          }`}
        />
        {error ? (
          <span
            id={`${key}-error`}
            role="alert"
            className="mt-1 block text-xs text-red-500"
          >
            {error}
          </span>
        ) : (
          extra?.hint && (
            <span className="mt-1 block font-mono text-[0.6rem] uppercase tracking-widest text-current/30">
              {extra.hint}
            </span>
          )
        )}
      </label>
    );
  };

  return (
    <main className="mx-auto w-full max-w-sm px-6 py-16">
      <h1 className="text-2xl font-medium tracking-tight">
        Join STVDIO<span className="align-super text-[0.5em]">°</span>
      </h1>
      <p className="mt-2 font-mono text-[0.65rem] uppercase tracking-widest text-current/50">
        Create an account and start showing your work
      </p>

      <form onSubmit={onSubmit} noValidate className="mt-10 space-y-6">
        {field("name", "Name", "text", {
          autoComplete: "name",
          maxLength: 80,
        })}
        {field("username", "Username", "text", {
          autoComplete: "username",
          hint: "Letters, numbers and underscores",
          maxLength: 30,
        })}
        {field("email", "Email", "email", { autoComplete: "email" })}
        {field("password", "Password", "password", {
          autoComplete: "new-password",
          hint: "At least 8 characters",
        })}
        {field("confirmPassword", "Confirm password", "password", {
          autoComplete: "new-password",
        })}

        <fieldset>
          <legend className={labelClass}>I am a</legend>
          <div className="mt-3 flex gap-2">
            {(["CREATIVE", "BRAND"] as Role[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setRole(option)}
                aria-pressed={role === option}
                className={`border px-3 py-2 font-mono text-[0.6rem] uppercase tracking-widest transition ${
                  role === option
                    ? "border-current bg-current/10"
                    : "border-current/20 text-current/50 hover:border-current/40"
                }`}
              >
                {option === "CREATIVE" ? "Creative" : "Brand"}
              </button>
            ))}
          </div>
        </fieldset>

        {formError && (
          <p role="alert" className="text-sm text-red-500">
            {formError}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full border border-current px-4 py-3 font-mono text-[0.65rem] uppercase tracking-widest hover:bg-current/5 disabled:opacity-40"
        >
          {submitting ? "Creating account…" : "Sign up"}
        </button>
      </form>

      <p className="mt-8 font-mono text-[0.65rem] uppercase tracking-widest text-current/50">
        Already have an account?{" "}
        <Link href="/login" className="underline underline-offset-4 hover:opacity-60">
          Sign in
        </Link>
      </p>
    </main>
  );
}
