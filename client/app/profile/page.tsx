"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import ProfileView from "@/components/ProfileView";
import { getPortfolio } from "@/services/users";
import type { Project } from "@/types/api";

/** /profile — the signed-in user's own profile, private work included. */
export default function OwnProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    getPortfolio(user.username)
      .then(({ projects }) => setProjects(projects))
      .catch(() => setProjects([]))
      .finally(() => setBusy(false));
  }, [user, loading, router]);

  if (loading || busy || !user) {
    return (
      <main className="px-6 py-20 font-mono text-xs uppercase tracking-widest text-current/40">
        Loading…
      </main>
    );
  }

  return <ProfileView user={user} projects={projects} isOwner />;
}
