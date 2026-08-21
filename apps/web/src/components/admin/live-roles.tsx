"use client";

import type { CapabilityKey, CustomRole, SessionContext } from "@haloai/contracts";
import {
  Bot,
  Building2,
  Check,
  FileText,
  LoaderCircle,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  Trash2,
  Users,
  Wrench,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { notify, notifyError } from "@/components/toast-host";
import { HaloDialog } from "@/components/ui/halo-dialog";
import { HaloModal } from "@/components/ui/halo-modal";
import { resolveActiveWorkspace } from "@/lib/active-workspace";
import type { AdminDictionary } from "@/lib/admin-i18n";
import { apiFetch } from "@/lib/api-client";
import { AdminPageHeader } from "./admin-page-header";

type CapabilityCategory =
  "workspace" | "member" | "agent" | "room" | "document" | "integration" | "security";

interface CapabilityItem {
  key: CapabilityKey;
  category: CapabilityCategory;
}

const ALL_CAPABILITIES: readonly CapabilityItem[] = [
  { key: "workspace.read", category: "workspace" },
  { key: "workspace.manage", category: "workspace" },
  { key: "workspace.security.manage", category: "workspace" },
  { key: "member.invite", category: "member" },
  { key: "member.manage", category: "member" },
  { key: "agent.profile.read", category: "agent" },
  { key: "agent.profile.create", category: "agent" },
  { key: "agent.profile.publish", category: "agent" },
  { key: "agent.invoke", category: "agent" },
  { key: "room.read", category: "room" },
  { key: "room.manage", category: "room" },
  { key: "room.message.create", category: "room" },
  { key: "document.read", category: "document" },
  { key: "document.edit", category: "document" },
  { key: "document.proposal.create", category: "document" },
  { key: "document.proposal.review", category: "document" },
  { key: "document.publish", category: "document" },
  { key: "integration.tool.read.execute", category: "integration" },
  { key: "integration.tool.write.execute", category: "integration" },
  { key: "approval.request", category: "security" },
  { key: "approval.review", category: "security" },
  { key: "audit.read", category: "security" },
];

function getCapabilityTexts(
  key: CapabilityKey,
  dictionary: AdminDictionary,
): { label: string; description: string } {
  switch (key) {
    case "workspace.read":
      return {
        label: dictionary.capWorkspaceReadName,
        description: dictionary.capWorkspaceReadDesc,
      };
    case "workspace.manage":
      return {
        label: dictionary.capWorkspaceManageName,
        description: dictionary.capWorkspaceManageDesc,
      };
    case "workspace.security.manage":
      return {
        label: dictionary.capWorkspaceSecurityManageName,
        description: dictionary.capWorkspaceSecurityManageDesc,
      };
    case "member.invite":
      return { label: dictionary.capMemberInviteName, description: dictionary.capMemberInviteDesc };
    case "member.manage":
      return { label: dictionary.capMemberManageName, description: dictionary.capMemberManageDesc };
    case "agent.profile.read":
      return {
        label: dictionary.capAgentProfileReadName,
        description: dictionary.capAgentProfileReadDesc,
      };
    case "agent.profile.create":
      return {
        label: dictionary.capAgentProfileCreateName,
        description: dictionary.capAgentProfileCreateDesc,
      };
    case "agent.profile.publish":
      return {
        label: dictionary.capAgentProfilePublishName,
        description: dictionary.capAgentProfilePublishDesc,
      };
    case "agent.invoke":
      return { label: dictionary.capAgentInvokeName, description: dictionary.capAgentInvokeDesc };
    case "room.read":
      return { label: dictionary.capRoomReadName, description: dictionary.capRoomReadDesc };
    case "room.manage":
      return { label: dictionary.capRoomManageName, description: dictionary.capRoomManageDesc };
    case "room.message.create":
      return {
        label: dictionary.capRoomMessageCreateName,
        description: dictionary.capRoomMessageCreateDesc,
      };
    case "document.read":
      return { label: dictionary.capDocumentReadName, description: dictionary.capDocumentReadDesc };
    case "document.edit":
      return { label: dictionary.capDocumentEditName, description: dictionary.capDocumentEditDesc };
    case "document.proposal.create":
      return {
        label: dictionary.capDocumentProposalCreateName,
        description: dictionary.capDocumentProposalCreateDesc,
      };
    case "document.proposal.review":
      return {
        label: dictionary.capDocumentProposalReviewName,
        description: dictionary.capDocumentProposalReviewDesc,
      };
    case "document.publish":
      return {
        label: dictionary.capDocumentPublishName,
        description: dictionary.capDocumentPublishDesc,
      };
    case "integration.tool.read.execute":
      return {
        label: dictionary.capIntegrationToolReadExecuteName,
        description: dictionary.capIntegrationToolReadExecuteDesc,
      };
    case "integration.tool.write.execute":
      return {
        label: dictionary.capIntegrationToolWriteExecuteName,
        description: dictionary.capIntegrationToolWriteExecuteDesc,
      };
    case "approval.request":
      return {
        label: dictionary.capApprovalRequestName,
        description: dictionary.capApprovalRequestDesc,
      };
    case "approval.review":
      return {
        label: dictionary.capApprovalReviewName,
        description: dictionary.capApprovalReviewDesc,
      };
    case "audit.read":
      return { label: dictionary.capAuditReadName, description: dictionary.capAuditReadDesc };
  }
}

export function LiveRoles({ dictionary }: { dictionary: AdminDictionary }) {
  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // 创建/编辑抽屉状态
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<CustomRole | null>(null);
  const [formKey, setFormKey] = useState("");
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [selectedCaps, setSelectedCaps] = useState<Set<CapabilityKey>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  // 删除弹窗
  const [deletingRole, setDeletingRole] = useState<CustomRole | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const session = await apiFetch<SessionContext>("/v1/session");
      const workspace = resolveActiveWorkspace(session);
      if (!workspace) {
        setRoles([]);
        return;
      }
      const res = await apiFetch<{ items: CustomRole[] }>(`/v1/workspaces/${workspace.id}/roles`);
      setRoles(res.items);
    } catch {
      notifyError(dictionary.roleLoadError, "load-roles-error");
    } finally {
      setLoading(false);
    }
  }, [dictionary.roleLoadError]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredRoles = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return roles;
    return roles.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.key.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q),
    );
  }, [roles, search]);

  function handleOpenCreate() {
    setEditingRole(null);
    setFormKey("");
    setFormName("");
    setFormDescription("");
    setSelectedCaps(new Set(["workspace.read", "room.read", "document.read"]));
    setDrawerOpen(true);
  }

  function handleOpenEdit(role: CustomRole) {
    setEditingRole(role);
    setFormKey(role.key);
    setFormName(role.name);
    setFormDescription(role.description);
    setSelectedCaps(new Set(role.capabilities));
    setDrawerOpen(true);
  }

  function toggleCap(cap: CapabilityKey) {
    setSelectedCaps((prev) => {
      const next = new Set(prev);
      if (next.has(cap)) {
        next.delete(cap);
      } else {
        next.add(cap);
      }
      return next;
    });
  }

  function toggleCategory(category: CapabilityCategory) {
    const catCaps = ALL_CAPABILITIES.filter((c) => c.category === category).map((c) => c.key);
    const allSelected = catCaps.every((c) => selectedCaps.has(c));
    setSelectedCaps((prev) => {
      const next = new Set(prev);
      for (const cap of catCaps) {
        if (allSelected) {
          next.delete(cap);
        } else {
          next.add(cap);
        }
      }
      return next;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!formName.trim()) return;
    if (!editingRole && !formKey.trim()) return;
    if (selectedCaps.size === 0) {
      notifyError(dictionary.roleCapsRequired, "caps-required");
      return;
    }

    setSubmitting(true);
    try {
      const session = await apiFetch<SessionContext>("/v1/session");
      const workspace = resolveActiveWorkspace(session);
      if (!workspace) return;

      if (editingRole) {
        await apiFetch<void>(`/v1/workspaces/${workspace.id}/roles/${editingRole.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            name: formName.trim(),
            description: formDescription.trim(),
            capabilities: Array.from(selectedCaps),
          }),
        });
        notify(dictionary.roleUpdated);
      } else {
        await apiFetch<void>(`/v1/workspaces/${workspace.id}/roles`, {
          method: "POST",
          body: JSON.stringify({
            key: formKey.trim().toLowerCase(),
            name: formName.trim(),
            description: formDescription.trim(),
            capabilities: Array.from(selectedCaps),
          }),
        });
        notify(dictionary.roleCreated);
      }
      setDrawerOpen(false);
      await load();
    } catch {
      notifyError(dictionary.roleSaveError, "save-role-error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteRole(): Promise<void> {
    if (!deletingRole) return;
    setDeleteSubmitting(true);
    try {
      const session = await apiFetch<SessionContext>("/v1/session");
      const workspace = resolveActiveWorkspace(session);
      if (!workspace) return;

      await apiFetch<void>(`/v1/workspaces/${workspace.id}/roles/${deletingRole.id}`, {
        method: "DELETE",
      });
      notify(dictionary.roleDeleted);
      setDeletingRole(null);
      await load();
    } catch {
      notifyError(dictionary.roleDeleteError, "delete-role-error");
    } finally {
      setDeleteSubmitting(false);
    }
  }

  const categories: Array<{
    id: CapabilityCategory;
    title: string;
    icon: typeof Building2;
  }> = [
    { id: "workspace", title: dictionary.capCategoryWorkspace, icon: Building2 },
    { id: "member", title: dictionary.capCategoryMember, icon: Users },
    { id: "agent", title: dictionary.capCategoryAgent, icon: Bot },
    { id: "room", title: dictionary.capCategoryRoom, icon: MessageSquare },
    { id: "document", title: dictionary.capCategoryDocument, icon: FileText },
    { id: "integration", title: dictionary.capCategoryIntegration, icon: Wrench },
    { id: "security", title: dictionary.capCategorySecurity, icon: ShieldAlert },
  ];

  return (
    <>
      <AdminPageHeader
        kicker={dictionary.navGroupGovernance}
        title={dictionary.rolesTitle}
        actions={
          <button type="button" className="admin-primary-button" onClick={handleOpenCreate}>
            <Plus size={16} /> {dictionary.createRole}
          </button>
        }
      />

      <div className="organization-surface">
        <div className="organization-toolbar">
          <label className="organization-search">
            <Search size={16} />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={dictionary.roleSearchPlaceholder}
            />
          </label>

          <button
            type="button"
            className="icon-button"
            aria-label="refresh"
            onClick={() => void load()}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        <div className="organization-table-wrap">
          <table className="organization-table">
            <thead>
              <tr>
                <th>{dictionary.roleName}</th>
                <th>{dictionary.roleKey}</th>
                <th>{dictionary.roleCapabilities}</th>
                <th>{dictionary.roleType}</th>
                <th>{dictionary.actions}</th>
              </tr>
            </thead>
            <tbody>
              {filteredRoles.map((role) => (
                <tr key={role.id}>
                  <td>
                    <strong>{role.name}</strong>
                    {role.description ? (
                      <p
                        style={{ fontSize: "0.75rem", color: "var(--halo-text-muted)", margin: 0 }}
                      >
                        {role.description}
                      </p>
                    ) : null}
                  </td>
                  <td>
                    <code>{role.key}</code>
                  </td>
                  <td>
                    <span className="admin-status-badge is-muted">
                      {dictionary.roleCapabilitiesCount.replace(
                        "{count}",
                        String(role.capabilities.length),
                      )}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`admin-status-badge is-${role.isBuiltIn ? "info" : "success"}`}
                    >
                      {role.isBuiltIn ? dictionary.roleBuiltIn : dictionary.roleCustom}
                    </span>
                  </td>
                  <td>
                    <span className="admin-table-actions">
                      <button
                        type="button"
                        className="admin-table-action"
                        onClick={() => handleOpenEdit(role)}
                      >
                        {dictionary.editRole}
                      </button>
                      {!role.isBuiltIn && (
                        <button
                          type="button"
                          className="admin-table-action is-danger"
                          onClick={() => setDeletingRole(role)}
                        >
                          <Trash2 size={14} /> {dictionary.deleteRole}
                        </button>
                      )}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 角色创建与编辑抽屉 */}
      <HaloDialog
        open={drawerOpen}
        className="workspace-admin-drawer"
        onClose={() => setDrawerOpen(false)}
        closeLabel={dictionary.cancel}
        title={editingRole ? dictionary.editRole : dictionary.createRole}
        description={dictionary.roleDrawerDescription}
        icon={<Shield size={18} />}
        footer={
          <>
            <button
              type="button"
              className="admin-secondary-button"
              onClick={() => setDrawerOpen(false)}
            >
              {dictionary.cancel}
            </button>
            <button
              type="submit"
              form="custom-role-form"
              className="admin-primary-button"
              disabled={submitting || !formName.trim() || (!editingRole && !formKey.trim())}
            >
              {submitting ? <LoaderCircle size={16} className="animate-spin" /> : null}
              {dictionary.saveRole}
            </button>
          </>
        }
      >
        <form
          id="custom-role-form"
          className="organization-form"
          onSubmit={(e) => void handleSubmit(e)}
        >
          <label>
            <span>{dictionary.roleName}</span>
            <input
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder={dictionary.roleNamePlaceholder}
              maxLength={120}
            />
          </label>

          <label>
            <span>{dictionary.roleKey}</span>
            <input
              required
              value={formKey}
              onChange={(e) => setFormKey(e.target.value.toLowerCase())}
              placeholder={dictionary.roleKeyPlaceholder}
              disabled={Boolean(editingRole)}
              maxLength={64}
              pattern="[a-z0-9_-]+"
            />
          </label>

          <label>
            <span>{dictionary.roleDescription}</span>
            <textarea
              rows={2}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder={dictionary.roleDescPlaceholder}
              maxLength={500}
            />
          </label>

          <div style={{ marginTop: "1rem" }}>
            <h4 style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.75rem" }}>
              {dictionary.roleCapabilities} ({selectedCaps.size} / {ALL_CAPABILITIES.length})
            </h4>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {categories.map((cat) => {
                const Icon = cat.icon;
                const catCaps = ALL_CAPABILITIES.filter((c) => c.category === cat.id);
                const allSelected = catCaps.every((c) => selectedCaps.has(c.key));

                return (
                  <div
                    key={cat.id}
                    style={{
                      border: "1px solid var(--halo-border)",
                      borderRadius: "var(--halo-radius-md)",
                      padding: "0.75rem 1rem",
                      background: "var(--halo-bg-surface)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "0.5rem",
                      }}
                    >
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          fontWeight: 600,
                          fontSize: "0.875rem",
                        }}
                      >
                        <Icon size={16} /> {cat.title}
                      </span>
                      <button
                        type="button"
                        className="admin-secondary-button compact"
                        onClick={() => toggleCategory(cat.id)}
                        style={{ fontSize: "0.75rem", padding: "0.125rem 0.5rem" }}
                      >
                        {allSelected ? dictionary.deselectAll : dictionary.selectAll}
                      </button>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                      {catCaps.map((cap) => {
                        const checked = selectedCaps.has(cap.key);
                        const texts = getCapabilityTexts(cap.key, dictionary);
                        return (
                          <label
                            key={cap.key}
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: "0.75rem",
                              cursor: "pointer",
                              padding: "0.5rem 0.625rem",
                              borderRadius: "8px",
                              background: checked
                                ? "color-mix(in srgb, var(--accent) 6%, var(--surface))"
                                : "transparent",
                              border: checked
                                ? "1px solid color-mix(in srgb, var(--accent) 30%, var(--border))"
                                : "1px solid transparent",
                              transition: "all 0.15s ease",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleCap(cap.key)}
                              style={{
                                width: "16px",
                                minWidth: "16px",
                                height: "16px",
                                minHeight: "16px",
                                margin: "2px 0 0 0",
                                accentColor: "var(--accent)",
                                cursor: "pointer",
                                flexShrink: 0,
                              }}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <strong
                                style={{
                                  display: "block",
                                  fontSize: "0.8125rem",
                                  fontWeight: 600,
                                  color: "var(--text)",
                                }}
                              >
                                {texts.label}
                              </strong>
                              <p
                                style={{
                                  fontSize: "0.75rem",
                                  color: "var(--text-muted)",
                                  margin: "2px 0 0",
                                  lineHeight: 1.4,
                                }}
                              >
                                {texts.description}
                              </p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </form>
      </HaloDialog>

      {/* 删除确认居中 Modal */}
      <HaloModal
        open={Boolean(deletingRole)}
        danger
        title={dictionary.deleteRoleConfirmTitle}
        description={dictionary.deleteRoleConfirmDesc.replace("{name}", deletingRole?.name ?? "")}
        icon={<Trash2 size={18} />}
        closeLabel={dictionary.cancel}
        onClose={() => setDeletingRole(null)}
        footer={
          <>
            <button
              type="button"
              className="admin-secondary-button"
              onClick={() => setDeletingRole(null)}
            >
              {dictionary.cancel}
            </button>
            <button
              type="button"
              className="admin-secondary-button is-danger"
              style={{ color: "#ffffff", background: "#ef4444", borderColor: "#ef4444" }}
              disabled={deleteSubmitting}
              onClick={() => void handleDeleteRole()}
            >
              {deleteSubmitting ? <LoaderCircle size={16} className="animate-spin" /> : null}
              {dictionary.confirmDelete}
            </button>
          </>
        }
      >
        <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.5 }}>
          {dictionary.irreversibleAction}
        </p>
      </HaloModal>
    </>
  );
}
