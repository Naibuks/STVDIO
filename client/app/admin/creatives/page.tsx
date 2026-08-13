"use client";

import UsersView from "@/components/admin/UsersView";

/** The users screen with the role fixed — same code, one filter applied. */
export default function AdminCreativesPage() {
  return (
    <UsersView
      title="Creatives"
      subtitle="Accounts with the CREATIVE role"
      fixedRole="CREATIVE"
    />
  );
}
