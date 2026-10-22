"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  createAdminAccountAction,
  deleteAdminAccountAction,
  updateAdminAccountAction,
} from "@/app/admin/(dashboard)/admins/actions";
import {
  AdminBadge,
  AdminNotice,
  AdminPageHeader,
  AdminPanel,
  adminDangerButtonClass,
  adminInputClass,
  adminLabelClass,
  adminPrimaryButtonClass,
  adminSecondaryButtonClass,
  formatAdminDate,
} from "@/components/admin/AdminUi";
import { Popup } from "@/components/ui";
import type { AdminRole } from "@/lib/auth";

export type AdminAccountRow = {
  id: string;
  email: string;
  fullName: string;
  role: AdminRole;
  createdAt: string | null;
  lastSignInAt: string | null;
};

const ROLE_LABEL: Record<AdminRole, string> = { admin: "Admin", super_admin: "Super admin" };

function AdminAccountForm({
  account,
  isSelf,
  onDone,
}: {
  account: AdminAccountRow | null;
  isSelf: boolean;
  onDone: (message: string) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState(account?.email ?? "");
  const [fullName, setFullName] = useState(account?.fullName ?? "");
  const [role, setRole] = useState<AdminRole>(account?.role ?? "admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = account
        ? await updateAdminAccountAction({
            id: account.id,
            fullName,
            role,
            password: password || undefined,
          })
        : await createAdminAccountAction({ email, fullName, password, role });

      if (!result.success) {
        setError(result.error || "Unable to save admin.");
        return;
      }
      onDone(result.message || "Saved.");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className={adminLabelClass}>Email</span>
        <input
          type="email"
          required
          value={email}
          readOnly={Boolean(account)}
          onChange={(event) => setEmail(event.target.value)}
          className={adminInputClass}
        />
      </label>
      <label className="block">
        <span className={adminLabelClass}>Full name</span>
        <input
          required
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          className={adminInputClass}
        />
      </label>
      <label className="block">
        <span className={adminLabelClass}>Role</span>
        <select
          value={role}
          disabled={isSelf}
          onChange={(event) => setRole(event.target.value as AdminRole)}
          className={adminInputClass}
        >
          <option value="admin">Admin — operations, catalog and settings</option>
          <option value="super_admin">Super admin — adds reports and admin accounts</option>
        </select>
        {isSelf ? (
          <p className="font-body mt-1 text-xs text-on-surface-variant">
            You can’t change your own role.
          </p>
        ) : null}
      </label>
      <label className="block">
        <span className={adminLabelClass}>
          {account ? "New password (leave blank to keep)" : "Password"}
        </span>
        <input
          type="password"
          autoComplete="new-password"
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={adminInputClass}
        />
        {!account ? (
          <p className="font-body mt-1 text-xs text-on-surface-variant">
            At least 8 characters. If the email already has a customer account, it is granted
            admin access and keeps its existing password.
          </p>
        ) : null}
      </label>

      {error ? <AdminNotice tone="error">{error}</AdminNotice> : null}

      <button type="submit" disabled={isPending} className={`${adminPrimaryButtonClass} w-full`}>
        {isPending ? "Saving..." : account ? "Save changes" : "Create admin"}
      </button>
    </form>
  );
}

export function AdminAccountsAdmin({
  rows,
  currentAdminId,
  loadError,
}: {
  rows: AdminAccountRow[];
  currentAdminId: string;
  loadError: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState<AdminAccountRow | "new" | null>(null);
  const [deleting, setDeleting] = useState<AdminAccountRow | null>(null);
  const [feedback, setFeedback] = useState<{ tone: "error" | "success"; text: string } | null>(
    null,
  );

  function handleDone(message: string) {
    setEditing(null);
    setFeedback({ tone: "success", text: message });
    router.refresh();
  }

  function handleDelete(account: AdminAccountRow) {
    startTransition(async () => {
      const result = await deleteAdminAccountAction(account.id);
      setDeleting(null);
      setFeedback(
        result.success
          ? { tone: "success", text: result.message || "Admin removed." }
          : { tone: "error", text: result.error || "Unable to delete admin." },
      );
      if (result.success) router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Super admin"
        title="Admin accounts"
        description="Create, edit and remove the people who can sign in to this dashboard."
        actions={
          <button
            type="button"
            onClick={() => setEditing("new")}
            className={adminPrimaryButtonClass}
          >
            New admin
          </button>
        }
      />

      {loadError ? <AdminNotice tone="error">{loadError}</AdminNotice> : null}
      {feedback ? <AdminNotice tone={feedback.tone}>{feedback.text}</AdminNotice> : null}

      <AdminPanel title={`${rows.length} admin${rows.length === 1 ? "" : "s"}`}>
        <ul className="divide-y divide-outline-variant">
          {rows.map((account) => {
            const isSelf = account.id === currentAdminId;
            return (
              <li key={account.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-48 flex-1">
                  <p className="font-body flex items-center gap-2 text-sm font-medium text-on-surface">
                    {account.fullName || account.email}
                    {isSelf ? <AdminBadge>You</AdminBadge> : null}
                  </p>
                  <p className="font-body text-xs text-on-surface-variant">
                    {account.email} · added {formatAdminDate(account.createdAt, false)} · last
                    sign-in {account.lastSignInAt ? formatAdminDate(account.lastSignInAt) : "never"}
                  </p>
                </div>
                <AdminBadge
                  className={
                    account.role === "super_admin"
                      ? "border-primary bg-primary text-on-primary"
                      : undefined
                  }
                >
                  {ROLE_LABEL[account.role]}
                </AdminBadge>
                <button
                  type="button"
                  onClick={() => setEditing(account)}
                  className={adminSecondaryButtonClass}
                >
                  Edit
                </button>
                {!isSelf ? (
                  <button
                    type="button"
                    onClick={() => setDeleting(account)}
                    className={adminDangerButtonClass}
                  >
                    Delete
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      </AdminPanel>

      <Popup
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === "new" ? "New admin" : "Edit admin"}
        size="md"
      >
        {editing !== null ? (
          <AdminAccountForm
            key={editing === "new" ? "new" : editing.id}
            account={editing === "new" ? null : editing}
            isSelf={editing !== "new" && editing.id === currentAdminId}
            onDone={handleDone}
          />
        ) : null}
      </Popup>

      <Popup
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title="Delete admin?"
        size="sm"
      >
        {deleting ? (
          <div className="space-y-4">
            <p className="font-body text-sm text-on-surface">
              <strong>{deleting.fullName || deleting.email}</strong> will lose access to the admin
              dashboard immediately. Their login is deleted only if it was created here and has
              no orders; otherwise their customer account is kept.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleDelete(deleting)}
                className={adminDangerButtonClass}
              >
                {isPending ? "Deleting..." : "Delete admin"}
              </button>
              <button
                type="button"
                onClick={() => setDeleting(null)}
                className={adminSecondaryButtonClass}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null}
      </Popup>
    </div>
  );
}
