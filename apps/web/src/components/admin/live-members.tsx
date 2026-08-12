"use client";

import type {
  SessionContext,
  WorkspaceInvitationCreated,
  WorkspaceMember,
  WorkspaceRole,
} from "@haloai/contracts";
import { Check, Copy, LoaderCircle, Mail, UserPlus, X } from "lucide-react";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import type { AdminDictionary } from "@/lib/admin-i18n";
import { apiFetch, ApiClientError } from "@/lib/api-client";

const roles: readonly WorkspaceRole[] = ["owner", "admin", "member", "guest"];

function roleLabel(role: WorkspaceRole, chinese: boolean): string {
  if (!chinese) return { owner: "Owner", admin: "Admin", member: "Member", guest: "Guest" }[role];
  return { owner: "所有者", admin: "管理员", member: "成员", guest: "访客" }[role];
}

export function LiveMembers({ dictionary }: { dictionary: AdminDictionary }) {
  const chinese = dictionary.membersTitle === "成员与访问角色";
  const [session, setSession] = useState<SessionContext | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

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
      setNotice(
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
    setSubmitting(true);
    setNotice(null);
    const data = new FormData(event.currentTarget);
    try {
      const result = await apiFetch<{ invitation: WorkspaceInvitationCreated }>(
        `/v1/workspaces/${activeWorkspace.id}/invitations`,
        {
          method: "POST",
          body: JSON.stringify({
            email: String(data.get("email")),
            role: String(data.get("role")),
          }),
        },
      );
      setInviteLink(
        result.invitation.token
          ? `${window.location.origin}/invite/${result.invitation.token}`
          : null,
      );
      setNotice(
        chinese ? "邀请已创建，有效期为 72 小时。" : "Invitation created and valid for 72 hours.",
      );
    } catch (caught) {
      const denied = caught instanceof ApiClientError && caught.code === "delegation_denied";
      setNotice(
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
      setNotice(chinese ? "成员角色已更新。" : "Member role updated.");
    } catch (caught) {
      setMembers((current) =>
        current.map((item) =>
          item.membershipId === member.membershipId ? { ...item, role: previous } : item,
        ),
      );
      const lastOwner = caught instanceof ApiClientError && caught.code === "last_owner_required";
      setNotice(
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
        <div>
          <h1>{dictionary.membersTitle}</h1>
          <p>{dictionary.membersDescription}</p>
        </div>
        <button
          type="button"
          className="admin-primary-button"
          onClick={() => {
            setInviteOpen(true);
            setInviteLink(null);
          }}
        >
          <UserPlus size={17} /> {dictionary.inviteMember}
        </button>
      </div>
      {notice ? (
        <div className="admin-inline-notice" role="status">
          <Check size={15} /> {notice}
        </div>
      ) : null}
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
                <select
                  className="admin-role-select"
                  value={member.role}
                  disabled={activeWorkspace?.role !== "owner"}
                  onChange={(event) => void updateRole(member, event.target.value as WorkspaceRole)}
                >
                  {roles.map((role) => (
                    <option value={role} key={role}>
                      {roleLabel(role, chinese)}
                    </option>
                  ))}
                </select>
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

      {inviteOpen ? (
        <div className="dialog-backdrop">
          <div
            className="member-dialog admin-invite-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="invite-member-title"
          >
            <div className="dialog-heading">
              <div>
                <span className="dialog-icon">
                  <Mail size={20} />
                </span>
                <div>
                  <h2 id="invite-member-title">{dictionary.inviteMember}</h2>
                  <p>
                    {chinese
                      ? "邀请与登录邮箱绑定，链接 72 小时内有效。"
                      : "Invites are email-bound and valid for 72 hours."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setInviteOpen(false)}
                aria-label={chinese ? "关闭邀请窗口" : "Close invitation dialog"}
              >
                <X size={19} />
              </button>
            </div>
            <form onSubmit={(event) => void invite(event)}>
              <label>
                <span>{chinese ? "成员邮箱" : "Member email"}</span>
                <input
                  name="email"
                  type="email"
                  required
                  autoFocus
                  placeholder="name@company.com"
                />
              </label>
              <label>
                <span>{dictionary.tableRole}</span>
                <select name="role" defaultValue="member">
                  <option value="member">{roleLabel("member", chinese)}</option>
                  <option value="guest">{roleLabel("guest", chinese)}</option>
                  {activeWorkspace?.role === "owner" ? (
                    <option value="admin">{roleLabel("admin", chinese)}</option>
                  ) : null}
                </select>
              </label>
              {inviteLink ? (
                <div className="admin-invite-link">
                  <span>{chinese ? "开发环境邀请链接" : "Development invite link"}</span>
                  <code>{inviteLink}</code>
                  <button
                    type="button"
                    onClick={() => void navigator.clipboard.writeText(inviteLink)}
                  >
                    <Copy size={15} /> {chinese ? "复制" : "Copy"}
                  </button>
                </div>
              ) : null}
              <div className="dialog-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setInviteOpen(false)}
                >
                  {chinese ? "取消" : "Cancel"}
                </button>
                <button type="submit" className="primary-button" disabled={submitting}>
                  {submitting ? <LoaderCircle size={16} /> : <UserPlus size={16} />}
                  {submitting ? (chinese ? "正在创建…" : "Creating…") : dictionary.inviteMember}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
