"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import ProfileForm from "@/components/ProfileForm";
import { deleteMe } from "@/services/users";
import { ApiRequestError } from "@/services/api";

/**
 * /profile/edit
 *
 * This page only resolves who is signed in. The form itself is a child that
 * seeds its state from the `user` prop, so nothing has to be copied into state
 * inside an effect — the child simply does not mount until the user is known.
 */
export default function EditProfilePage() {
  const { user, loading, setUser, signOut } = useAuth();
  const router = useRouter();
  const [confirmText, setConfirmText] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  const handleDelete = async () => {
    if (confirmText !== "DELETE") {
      setDeleteError("Type DELETE to confirm permanent deletion.");
      return;
    }

    setDeleting(true);
    setDeleteError("");

    try {
      await deleteMe({ confirmation: "DELETE" });
      signOut();
      router.replace("/");
    } catch (error) {
      const message =
        error instanceof ApiRequestError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Delete failed";
      setDeleteError(message);
      setDeleting(false);
    }
  };

  if (loading || !user) {
    return (
      <main className="px-6 py-20 font-mono text-xs uppercase tracking-widest text-current/40">
        Loading…
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-14">
      <h1 className="text-2xl font-medium tracking-tight">Edit profile</h1>
      <ProfileForm
        user={user}
        onSaved={(updated) => {
          setUser(updated);
          router.push("/profile");
        }}
        onCancel={() => router.push("/profile")}
      />

      <section className="mt-16 border border-[#d66a38]/40 bg-[#111111] p-6">
        <h2 className="font-mono text-[0.68rem] uppercase tracking-[0.22em] text-[#f7c1a4]">
          Delete account
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-[#f5f1ea]/70">
          This permanently removes your profile and the work, follows, messages,
          and social records you created. Financial history is preserved for
          audit purposes.
        </p>

        <label className="mt-5 block">
          <span className="font-mono text-[0.58rem] uppercase tracking-[0.2em] text-[#f5f1ea]/50">
            Type DELETE to confirm
          </span>
          <input
            value={confirmText}
            onChange={(event) => setConfirmText(event.target.value)}
            className="mt-2 w-full border-b border-current/30 bg-transparent py-2 text-base outline-none focus:border-[#d66a38]"
            placeholder="DELETE"
            autoComplete="off"
          />
        </label>

        {deleteError ? (
          <p className="mt-3 text-sm text-red-400">{deleteError}</p>
        ) : null}

        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="mt-5 border border-red-500/60 bg-red-500/10 px-4 py-3 font-mono text-[0.62rem] uppercase tracking-[0.22em] text-red-200 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {deleting ? "Deleting…" : "Delete account"}
        </button>
      </section>
    </main>
  );
}
