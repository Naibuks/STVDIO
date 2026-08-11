"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import ProfileForm from "@/components/ProfileForm";

/**
 * /profile/edit
 *
 * This page only resolves who is signed in. The form itself is a child that
 * seeds its state from the `user` prop, so nothing has to be copied into state
 * inside an effect — the child simply does not mount until the user is known.
 */
export default function EditProfilePage() {
  const { user, loading, setUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

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
    </main>
  );
}
