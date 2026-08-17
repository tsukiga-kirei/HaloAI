"use client";

import type {
  SessionContext,
  WorkspaceInvitationCreated,
  WorkspaceMember,
  WorkspaceRole,
} from "@haloai/contracts";
import { Copy, LoaderCircle, Mail, UserPlus, X } from "lucide-react";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import type { AdminDictionary } from "@/lib/admin-i18n";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { notify } from "@/components/toast-host";
import { FieldError } from "@/components/ui/field-error";
import { HaloDialog } from "@/components/ui/halo-dialog";
import { HaloSelect } from "@/components/ui/halo-select";

const roles: readonly WorkspaceRole[] = ["owner", "admin", "member", "guest"];

function roleLabel(role: WorkspaceRole, chinese: boolean): string {
  if (!chinese) return { owner: "Owner", admin: "Admin", member: "Member", guest: "Guest" }[role];
  return { owner: "所有者", admin: "管理员", member: "成员", guest: "访客" }[role];
}

function looksLikeEmail(value: string): boolean {
  // 邀请表单禁止 type=email 原生气泡，校验必须走产品浮层。
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function LiveMembers({ dictionary }: { dictionary: AdminDictionary }) {
  const chinese = dictionary.membersTitle === "成员与访问角色";
  const [session, setSession] = useState<SessionContext | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [inviteRole, setInviteRole] = useState<WorkspaceRole>("member");
  const [emailError, setEmailError] = useState(false);

  const activeWorkspace =
    session?.workspaces.find(
      (workspace) => workspace.id === window.localStorage.getItem("haloai.workspaceId"),
    ) ?? session?.workspaces[0];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const nextSession = await apiFetch<SessionContext>("/v1/session");
      const remembered = window.localStorage.getItem("haloai.workspaceId");
      const workspace =
        nextSession.workspaces.find((item) => item.id === remembered) ?? nextSession.workspaces[0];
      setSession(nextSession);
      if (!workspace) return;
      const result = await apiFetch<{ members: WorkspaceMember[] }>(
        `/v1/workspaces/${workspace.id}/members`,
      );
      setMembers(result.members);
    } catch {
      notify(
        chinese
          ? "无法读取成员列表，请确认当前账户具有管理权限。"
          : "Could not load members. Check your workspace permissions.",
      );
    } finally {
      setLoading(false);
    }
  }, [chinese]);

  useEffect(() => {
    void load();
  }, [load]);

  async function invite(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!activeWorkspace) return;
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    if (!looksLikeEmail(email)) {
      setEmailError(true);
      return;
    }
    setSubmitting(true);
    try {
      const result = await apiFetch<{ invitation: WorkspaceInvitationCreated }>(
        `/v1/workspaces/${activeWorkspace.id}/invitations`,
        {
          method: "POST",
          body: JSON.stringify({
            email,
            role: inviteRole,
          }),
        },
      );
      setInviteLink(
        result.invitation.token
          ? `${window.location.origin}/invite/${result.invitation.token}`
          : null,
      );
      notify(
        chinese ? "邀请已创建，有效期为 72 小时。" : "Invitation created and valid for 72 hours.",
      );
    } catch (caught) {
      const denied = caught instanceof ApiClientError && caught.code === "delegation_denied";
      notify(
        denied
          ? chinese
            ? "当前角色不能授予管理员权限。"
            : "Your role cannot grant admin access."
          : chinese
            ? "邀请创建失败，请检查邮箱与权限。"
            : "Could not create the invitation.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function updateRole(member: WorkspaceMember, role: WorkspaceRole): Promise<void> {
    if (!activeWorkspace || role === member.role) return;
    const previous = member.role;
    setMembers((current) =>
      current.map((item) => (item.membershipId === member.membershipId ? { ...item, role } : item)),
    );
    try {
      await apiFetch<void>(
        `/v1/workspaces/${activeWorkspace.id}/members/${member.membershipId}/role`,
        { method: "PATCH", body: JSON.stringify({ role }) },
      );
      notify(chinese ? "成员角色已更新。" : "Member role updated.");
    } catch (caught) {
      setMembers((current) =>
        current.map((item) =>
          item.membershipId === member.membershipId ? { ...item, role: previous } : item,
        ),
      );
      const lastOwner = caught instanceof ApiClientError && caught.code === "last_owner_required";
      notify(
        lastOwner
          ? chinese
            ? "必须先指定另一位所有者，才能调整最后一位所有者。"
            : "Assign another owner before changing the final owner."
          : chinese
            ? "角色更新失败，请检查权限。"
            : "Could not update this role.",
      );
    }
  }

  if (loading)
    return (
      <div className="admin-live-loading">
        <LoaderCircle size={20} /> {chinese ? "正在读取成员…" : "Loading members…"}
      </div>
    );

  return (
    <>
      <div className="admin-section-heading">
        <h1>{dictionary.membersTitle}</h1>
        <button
          type="button"
          className="admin-primary-button"
          onClick={() => {
            setInviteOpen(true);
            setInviteLink(null);
            setInviteRole("member");
            setEmailError(false);
          }}
        >
          <UserPlus size={17} /> {dictionary.inviteMember}
        </button>
      </div>
      <section className="admin-panel admin-table-panel">
        <div className="admin-table" role="table" aria-label={dictionary.membersTitle}>
          <div className="admin-table-row is-header" role="row">
            {[
              dictionary.tableName,
              dictionary.tableType,
              dictionary.tableRole,
              dictionary.tableStatus,
              dictionary.tableLastActive,
            ].map((label) => (
              <span role="columnheader" key={label}>
                {label}
              </span>
            ))}
          </div>
          {members.map((member) => (
            <div className="admin-table-row" role="row" key={member.membershipId}>
              <span role="cell" className="admin-table-person">
                <span>{member.name.slice(0, 2).toLocaleUpperCase()}</span>
                <span>
                  <strong>{member.name}</strong>
                  <small>{member.email}</small>
                </span>
              </span>
              <span role="cell" data-label={dictionary.tableType}>
                {dictionary.typePerson}
              </span>
              <span role="cell" data-label={dictionary.tableRole}>
                <HaloSelect
                  compact
                  value={member.role}
                  disabled={activeWorkspace?.role !== "owner"}
                  ariaLabel={dictionary.tableRole}
                  onValueChange={(next) => void updateRole(member, next as WorkspaceRole)}
                  options={roles.map((role) => ({
                    value: role,
                    label: roleLabel(role, chinese),
                  }))}
                />
              </span>
              <span role="cell" data-label={dictionary.tableStatus}>
                <span className="admin-status-badge is-success">
                  {member.status === "active" ? dictionary.statusActive : member.status}
                </span>
              </span>
              <span role="cell" data-label={dictionary.tableLastActive}>
                {member.joinedAt
                  ? new Intl.DateTimeFormat(chinese ? "zh-CN" : "en-US", {
                      month: "short",
                      day: "numeric",
                    }).format(new Date(member.joinedAt))
                  : "—"}
              </span>
            </div>
          ))}
        </div>
      </section>

      <HaloDialog
        open={inviteOpen}
        title={dictionary.inviteMember}
        description={
          chinese
            ? "邀请与登录邮箱绑定，链接 72 小时内有效。"
            : "Invites are email-bound and valid for 72 hours."
        }
        icon={<Mail size={20} />}
        onClose={() => setInviteOpen(false)}
        closeLabel={chinese ? "关闭邀请窗口" : "Close invitation dialog"}
      >
        <form noValidate onSubmit={(event) => void invite(event)}>
          <label>
            <span>{chinese ? "成员邮箱" : "Member email"}</span>
            <FieldError
              open={emailError}
              message={chinese ? "请输入有效的工作邮箱。" : "Enter a valid work email."}
            >
              <div>
                <input
                  name="email"
                  type="text"
                  inputMode="email"
                  autoComplete="email"
                  autoFocus
                  placeholder="name@company.com"
                  onChange={() => setEmailError(false)}
                />
              </div>
            </FieldError>
          </label>
          <label>
            <span>{dictionary.tableRole}</span>
            <HaloSelect
              name="role"
              value={inviteRole}
              onValueChange={(next) => setInviteRole(next as WorkspaceRole)}
              ariaLabel={dictionary.tableRole}
              options={[
                { value: "member", label: roleLabel("member", chinese) },
                { value: "guest", label: roleLabel("guest", chinese) },
                ...(activeWorkspace?.role === "owner"
                  ? [{ value: "admin" as const, label: roleLabel("admin", chinese) }]
                  : []),
              ]}
            />
          </label>
          {inviteLink ? (
            <div className="admin-invite-link">
              <span>{chinese ? "开发环境邀请链接" : "Development invite link"}</span>
              <code>{inviteLink}</code>
              <button type="button" onClick={() => void navigator.clipboard.writeText(inviteLink)}>
                <Copy size={15} /> {chinese ? "复制" : "Copy"}
              </button>
            </div>
          ) : null}
          <div className="dialog-actions">
            <button type="button" className="secondary-button" onClick={() => setInviteOpen(false)}>
              <X size={16} /> {chinese ? "取消" : "Cancel"}
            </button>
            <button type="submit" className="primary-button" disabled={submitting}>
              {submitting ? <LoaderCircle size={16} /> : <UserPlus size={16} />}
              {submitting ? (chinese ? "正在创建…" : "Creating…") : dictionary.inviteMember}
            </button>
          </div>
        </form>
      </HaloDialog>
    </>
  );
}
