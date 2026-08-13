"use client";

import UsersView from "@/components/admin/UsersView";

export default function AdminBrandsPage() {
  return (
    <UsersView
      title="Brands"
      subtitle="Accounts with the BRAND role"
      fixedRole="BRAND"
    />
  );
}
