"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AdminTable, { type Column } from "./AdminTable";
import {
  AdminHeading,
  FilterChips,
  Pagination,
  SearchBox,
} from "./AdminControls";
import { useAuth } from "@/components/AuthProvider";
import * as admin from "@/services/admin";
import { formatDate } from "@/lib/format";
import type { AdminPaginated, AdminUsersPayload, User, UserRole } from "@/types/api";

/**
 * Shared account management screen.
 *
 * /admin/users, /admin/creatives and /admin/brands are the same view with the
 * role fixed, so filtering, search, pagination and the activate/deactivate
 * flow exist once rather than three times.
 */
export default function UsersView({
  title,
  subtitle,
  fixedRole,
}: {
  title: string;
  subtitle?: string;
  /** When set, the role filter is hidden and this role is always applied. */
  fixedRole?: UserRole;
}) {
  const { user: me } = useAuth();

  const [rows, setRows] = useState<User[] | null>(null);
  const [meta, setMeta] = useState<AdminPaginated | null>(null);
  const [page, setPage] = useState(1);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<string>("");
  const [active, setActive] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(
    () =>
      Promise.resolve()
        .then(() => {
          setError(null);
          const query = {
            page,
            search,
            ...(active === "" ? {} : { isActive: active === "true" }),
            ...(fixedRole ? {} : role ? { role: role as UserRole } : {}),
          };
          if (fixedRole === "CREATIVE") return admin.getCreatives(query);
          if (fixedRole === "BRAND") return admin.getBrands(query);
          return admin.getUsers(query);
        })
        .then((data: AdminUsersPayload) => {
          setRows(data.users);
          setMeta(data);
        })
        .catch((err: unknown) => {
          setRows([]);
          setError(err instanceof Error ? err.message : "Could not load users");
        }),
    [page, search, role, active, fixedRole],
  );

  useEffect(() => {
    load();
  }, [load]);

  const toggleStatus = async (target: User) => {
    const next = !target.isActive;
    const verb = next ? "Reactivate" : "Deactivate";
    if (
      !window.confirm(
        `${verb} @${target.username}? ${
          next
            ? "They will be able to sign in again."
            : "They will be signed out and unable to sign in until reactivated."
        }`,
      )
    )
      return;

    setBusy(target._id);
    setError(null);
    try {
      const { user } = await admin.setUserStatus(target._id, next);
      setRows((current) =>
        (current ?? []).map((row) => (row._id === user._id ? user : row)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update account");
    } finally {
      setBusy(null);
    }
  };

  const columns: Column<User>[] = [
    {
      key: "name",
      header: "Account",
      render: (row) => (
        <Link href={`/admin/users/${row._id}`} className="hover:opacity-60">
          <span className="font-medium">{row.name}</span>
          <span className="ml-2 text-current/40">@{row.username}</span>
        </Link>
      ),
    },
    {
      key: "email",
      header: "Email",
      render: (row) => (
        <span className="text-current/60">{row.email ?? "—"}</span>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (row) => (
        <span className="font-mono text-[0.6rem] uppercase tracking-widest text-current/50">
          {row.role}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <span
          className={`font-mono text-[0.6rem] uppercase tracking-widest ${
            row.isActive ? "text-emerald-500" : "text-red-500"
          }`}
        >
          {row.isActive ? "Active" : "Deactivated"}
        </span>
      ),
    },
    {
      key: "joined",
      header: "Joined",
      render: (row) => (
        <span className="font-mono text-[0.6rem] uppercase tracking-widest text-current/40">
          {formatDate(row.createdAt)}
        </span>
      ),
    },
  ];

  return (
    <div>
      <AdminHeading title={title} subtitle={subtitle} />

      <div className="mb-4 flex flex-wrap items-center gap-4">
        <SearchBox
          value={input}
          onChange={setInput}
          onSubmit={() => {
            setPage(1);
            setSearch(input.trim());
          }}
          placeholder="Search name, username or email"
        />
      </div>

      <div className="mb-2 flex flex-wrap gap-4">
        {!fixedRole && (
          <FilterChips
            options={[
              { value: "CREATIVE", label: "Creative" },
              { value: "BRAND", label: "Brand" },
              { value: "ADMIN", label: "Admin" },
            ]}
            value={role}
            onChange={(value) => {
              setPage(1);
              setRole(value);
            }}
            allLabel="All roles"
          />
        )}
        <FilterChips
          options={[
            { value: "true", label: "Active" },
            { value: "false", label: "Deactivated" },
          ]}
          value={active}
          onChange={(value) => {
            setPage(1);
            setActive(value);
          }}
          allLabel="Any status"
        />
      </div>

      {error && (
        <p role="alert" className="py-4 text-sm text-red-500">
          {error}
        </p>
      )}

      <AdminTable
        rows={rows}
        columns={columns}
        emptyMessage="No accounts match those filters."
        actions={(row) => (
          <>
            <Link
              href={`/admin/users/${row._id}`}
              className="border border-current/30 px-3 py-1.5 font-mono text-[0.55rem] uppercase tracking-widest hover:bg-current/5"
            >
              View
            </Link>
            {/* An admin cannot change their own status — the API rejects it,
                so the control is not offered either. */}
            {row._id !== me?._id && (
              <button
                type="button"
                onClick={() => toggleStatus(row)}
                disabled={busy === row._id}
                className={`border px-3 py-1.5 font-mono text-[0.55rem] uppercase tracking-widest disabled:opacity-40 ${
                  row.isActive
                    ? "border-red-500/40 text-red-500 hover:bg-red-500/10"
                    : "border-current/30 hover:bg-current/5"
                }`}
              >
                {busy === row._id
                  ? "Working…"
                  : row.isActive
                    ? "Deactivate"
                    : "Reactivate"}
              </button>
            )}
          </>
        )}
      />

      <Pagination meta={meta} onPage={setPage} />
    </div>
  );
}
