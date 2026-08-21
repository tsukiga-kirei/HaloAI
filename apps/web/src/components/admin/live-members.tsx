"use client";

import {
  WorkspaceOrganizationOverviewSchema,
  type SessionContext,
  type WorkspaceDepartment,
  type WorkspaceInvitationCreated,
  type WorkspaceMember,
  type WorkspaceRole,
} from "@haloai/contracts";
import {
  createColumnHelper,
  createPaginatedRowModel,
  rowPaginationFeature,
  tableFeatures,
  useTable,
  type PaginationState,
} from "@tanstack/react-table";
import {
  Building2,
  Copy,
  LoaderCircle,
  Mail,
  Pencil,
  Plus,
  Search,
  UserCog,
  UserPlus,
  UsersRound,
} from "lucide-react";
import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { notify, notifyError } from "@/components/toast-host";
import { AdminPageHeader } from "./admin-page-header";
import { FieldError } from "@/components/ui/field-error";
import { HaloDialog } from "@/components/ui/halo-dialog";
import { HaloEmptyState } from "@/components/ui/halo-empty-state";
import { HaloPagination } from "@/components/ui/halo-pagination";
import { HaloSelect } from "@/components/ui/halo-select";
import { resolveActiveWorkspace } from "@/lib/active-workspace";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { useShellPreferences } from "@/lib/shell-preferences";
import { workspaceOrganizationDictionaries } from "@/lib/workspace-organization-i18n";

const roles: readonly WorkspaceRole[] = ["owner", "admin", "member", "guest"];
const memberTableFeatures = tableFeatures({
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
});
const memberColumnHelper = createColumnHelper<typeof memberTableFeatures, WorkspaceMember>();
const unassignedValue = "__unassigned__";
const rootValue = "__root__";
const noManagerValue = "__no_manager__";

function looksLikeEmail(value: string): boolean {
  // 邀请表单禁用浏览器原生气泡，错误统一进入产品化字段提示。
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function LiveMembers() {
  const { locale } = useShellPreferences();
  const dictionary = workspaceOrganizationDictionaries[locale];
  const [session, setSession] = useState<SessionContext | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [departments, setDepartments] = useState<WorkspaceDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [inviteRole, setInviteRole] = useState<WorkspaceRole>("member");
  const [inviteDepartmentId, setInviteDepartmentId] = useState(unassignedValue);
  const [inviteJobTitle, setInviteJobTitle] = useState("");
  const [emailError, setEmailError] = useState(false);
  const [editingMember, setEditingMember] = useState<WorkspaceMember | null>(null);
  const [memberDepartmentId, setMemberDepartmentId] = useState(unassignedValue);
  const [memberJobTitle, setMemberJobTitle] = useState("");
  const [editingDepartment, setEditingDepartment] = useState<WorkspaceDepartment | null>(null);
  const [departmentOpen, setDepartmentOpen] = useState(false);
  const [departmentName, setDepartmentName] = useState("");
  const [departmentCode, setDepartmentCode] = useState("");
  const [departmentDescription, setDepartmentDescription] = useState("");
  const [parentDepartmentId, setParentDepartmentId] = useState(rootValue);
  const [managerActorId, setManagerActorId] = useState(noManagerValue);
  const [sortOrder, setSortOrder] = useState("0");
  const [submitting, setSubmitting] = useState(false);

  const activeWorkspace = useMemo(() => {
    if (!session) return undefined;
    return resolveActiveWorkspace(session);
  }, [session]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const nextSession = await apiFetch<SessionContext>("/v1/session");
      const workspace = resolveActiveWorkspace(nextSession);
      setSession(nextSession);
      if (!workspace) {
        setMembers([]);
        setDepartments([]);
        return;
      }
      const payload = await apiFetch<unknown>(`/v1/workspaces/${workspace.id}/organization`);
      const organization = WorkspaceOrganizationOverviewSchema.parse(payload);
      setMembers(organization.members);
      setDepartments(organization.departments);
    } catch {
      notifyError(dictionary.loadError, "workspace-organization-load-error");
    } finally {
      setLoading(false);
    }
  }, [dictionary.loadError]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredMembers = useMemo(() => {
    // 先按当前空间已授权快照过滤部门和检索，再交给表格分页；分页不得扩大可见范围。
    const normalized = query.trim().toLocaleLowerCase(locale);
    return members.filter((member) => {
      const inDepartment =
        selectedDepartment === null
          ? true
          : selectedDepartment === "unassigned"
            ? member.departmentId === null
            : member.departmentId === selectedDepartment;
      if (!inDepartment) return false;
      if (!normalized) return true;
      return [member.name, member.email, member.jobTitle, member.departmentName ?? ""]
        .join(" ")
        .toLocaleLowerCase(locale)
        .includes(normalized);
    });
  }, [locale, members, query, selectedDepartment]);

  useEffect(() => {
    setPagination((current) => ({ ...current, pageIndex: 0 }));
  }, [query, selectedDepartment]);

  const roleLabel = useCallback(
    (role: WorkspaceRole) =>
      ({
        owner: dictionary.owner,
        admin: dictionary.admin,
        member: dictionary.regularMember,
        guest: dictionary.guest,
      })[role],
    [dictionary],
  );

  const updateRole = useCallback(
    async (member: WorkspaceMember, role: WorkspaceRole): Promise<void> => {
      if (!activeWorkspace || role === member.role) return;
      const previous = member.role;
      setMembers((current) =>
        current.map((item) =>
          item.membershipId === member.membershipId ? { ...item, role } : item,
        ),
      );
      try {
        await apiFetch<void>(
          `/v1/workspaces/${activeWorkspace.id}/members/${member.membershipId}/role`,
          { method: "PATCH", body: JSON.stringify({ role }) },
        );
        notify(dictionary.memberUpdated);
      } catch (caught) {
        setMembers((current) =>
          current.map((item) =>
            item.membershipId === member.membershipId ? { ...item, role: previous } : item,
          ),
        );
        const lastOwner = caught instanceof ApiClientError && caught.code === "last_owner_required";
        notifyError(
          lastOwner ? dictionary.lastOwnerRequired : dictionary.loadError,
          "workspace-member-role-error",
        );
      }
    },
    [activeWorkspace, dictionary.lastOwnerRequired, dictionary.loadError, dictionary.memberUpdated],
  );

  const updateStatus = useCallback(
    async (member: WorkspaceMember, status: "active" | "suspended"): Promise<void> => {
      if (!activeWorkspace || status === member.status) return;
      const previous = member.status;
      setMembers((current) =>
        current.map((item) =>
          item.membershipId === member.membershipId ? { ...item, status } : item,
        ),
      );
      try {
        await apiFetch<void>(
          `/v1/workspaces/${activeWorkspace.id}/members/${member.membershipId}/status`,
          { method: "PATCH", body: JSON.stringify({ status }) },
        );
        notify(dictionary.memberStatusUpdated);
      } catch (caught) {
        setMembers((current) =>
          current.map((item) =>
            item.membershipId === member.membershipId ? { ...item, status: previous } : item,
          ),
        );
        const lastOwner = caught instanceof ApiClientError && caught.code === "last_owner_required";
        notifyError(
          lastOwner ? dictionary.lastOwnerRequired : dictionary.loadError,
          "workspace-member-status-error",
        );
      }
    },
    [
      activeWorkspace,
      dictionary.lastOwnerRequired,
      dictionary.loadError,
      dictionary.memberStatusUpdated,
    ],
  );

  const openMember = useCallback((member: WorkspaceMember) => {
    setEditingMember(member);
    setMemberDepartmentId(member.departmentId ?? unassignedValue);
    setMemberJobTitle(member.jobTitle);
  }, []);

  const columns = useMemo(
    () =>
      memberColumnHelper.columns([
        memberColumnHelper.accessor("name", {
          header: dictionary.member,
          cell: ({ row }) => (
            <span className="admin-table-person">
              <span>{row.original.name.slice(0, 2).toLocaleUpperCase(locale)}</span>
              <span>
                <strong>{row.original.name}</strong>
                <small>{row.original.email}</small>
              </span>
            </span>
          ),
        }),
        memberColumnHelper.accessor("departmentName", {
          header: dictionary.department,
          cell: ({ row }) => (
            <span className="organization-cell-stack">
              <strong>{row.original.departmentName ?? dictionary.unassigned}</strong>
              <small>{row.original.jobTitle || "—"}</small>
            </span>
          ),
        }),
        memberColumnHelper.accessor("role", {
          header: dictionary.role,
          cell: ({ row }) => (
            <HaloSelect
              compact
              value={row.original.role}
              disabled={activeWorkspace?.role !== "owner"}
              ariaLabel={`${dictionary.role} · ${row.original.name}`}
              onValueChange={(next) => void updateRole(row.original, next as WorkspaceRole)}
              options={roles.map((role) => ({ value: role, label: roleLabel(role) }))}
            />
          ),
        }),
        memberColumnHelper.accessor("status", {
          header: dictionary.status,
          cell: ({ row }) => {
            const status = row.original.status;
            const tone =
              status === "active" ? "success" : status === "invited" ? "warning" : "muted";
            const label =
              status === "active"
                ? dictionary.active
                : status === "invited"
                  ? dictionary.invited
                  : status === "suspended"
                    ? dictionary.suspended
                    : dictionary.left;
            return <span className={`admin-status-badge is-${tone}`}>{label}</span>;
          },
        }),
        memberColumnHelper.display({
          id: "actions",
          header: dictionary.actions,
          cell: ({ row }) => (
            <span className="admin-table-actions">
              <button
                type="button"
                className="admin-table-action"
                onClick={() => openMember(row.original)}
              >
                <Pencil size={14} /> {dictionary.edit}
              </button>
              {row.original.status === "left" || row.original.role === "owner" ? null : (
                <button
                  type="button"
                  className={`admin-table-action${row.original.status === "suspended" ? "" : " is-danger"}`}
                  onClick={() =>
                    void updateStatus(
                      row.original,
                      row.original.status === "suspended" ? "active" : "suspended",
                    )
                  }
                >
                  {row.original.status === "suspended"
                    ? dictionary.restoreMember
                    : dictionary.suspendMember}
                </button>
              )}
            </span>
          ),
        }),
      ]),
    [activeWorkspace?.role, dictionary, locale, openMember, roleLabel, updateRole, updateStatus],
  );

  const table = useTable(
    {
      features: memberTableFeatures,
      columns,
      data: filteredMembers,
      getRowId: (member) => member.membershipId,
      state: { pagination },
      onPaginationChange: setPagination,
      autoResetPageIndex: false,
    },
    (state) => ({ pagination: state.pagination }),
  );

  const roots = departments.filter((department) => department.parentId === null);
  const unassignedCount = members.filter((member) => member.departmentId === null).length;
  const ownerCount = members.filter((member) => member.role === "owner").length;

  async function saveMember(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!activeWorkspace || !editingMember) return;
    setSubmitting(true);
    try {
      await apiFetch<void>(
        `/v1/workspaces/${activeWorkspace.id}/members/${editingMember.membershipId}/organization`,
        {
          method: "PATCH",
          body: JSON.stringify({
            departmentId: memberDepartmentId === unassignedValue ? null : memberDepartmentId,
            jobTitle: memberJobTitle,
          }),
        },
      );
      notify(dictionary.memberUpdated);
      setEditingMember(null);
      await load();
    } catch {
      notifyError(dictionary.loadError, "workspace-member-organization-error");
    } finally {
      setSubmitting(false);
    }
  }

  function openDepartment(department?: WorkspaceDepartment): void {
    setEditingDepartment(department ?? null);
    setDepartmentName(department?.name ?? "");
    setDepartmentCode(department?.code ?? "");
    setDepartmentDescription(department?.description ?? "");
    setParentDepartmentId(department?.parentId ?? rootValue);
    setManagerActorId(department?.managerActorId ?? noManagerValue);
    setSortOrder(String(department?.sortOrder ?? 0));
    setDepartmentOpen(true);
  }

  async function saveDepartment(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!activeWorkspace || !departmentName.trim() || !departmentCode.trim()) return;
    setSubmitting(true);
    try {
      await apiFetch<void>(
        editingDepartment
          ? `/v1/workspaces/${activeWorkspace.id}/departments/${editingDepartment.id}`
          : `/v1/workspaces/${activeWorkspace.id}/departments`,
        {
          method: editingDepartment ? "PATCH" : "POST",
          body: JSON.stringify({
            name: departmentName,
            code: departmentCode,
            description: departmentDescription,
            parentId: parentDepartmentId === rootValue ? null : parentDepartmentId,
            managerActorId: managerActorId === noManagerValue ? null : managerActorId,
            status: editingDepartment?.status ?? "active",
            sortOrder: Number.parseInt(sortOrder, 10) || 0,
          }),
        },
      );
      notify(dictionary.departmentSaved);
      setDepartmentOpen(false);
      await load();
    } catch {
      notifyError(dictionary.loadError, "workspace-department-save-error");
    } finally {
      setSubmitting(false);
    }
  }

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
            departmentId: inviteDepartmentId === unassignedValue ? null : inviteDepartmentId,
            jobTitle: inviteJobTitle,
          }),
        },
      );
      setInviteLink(
        result.invitation.token
          ? `${window.location.origin}/invite/${result.invitation.token}`
          : null,
      );
      notify(dictionary.inviteCreated);
    } catch {
      notifyError(dictionary.loadError, "workspace-invitation-error");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="admin-live-loading">
        <LoaderCircle size={20} /> {dictionary.loading}
      </div>
    );
  }

  return (
    <>
      <AdminPageHeader
        kicker={dictionary.sectionGroup}
        title={dictionary.title}
        actions={
          <>
            <button
              type="button"
              className="admin-secondary-button"
              onClick={() => openDepartment()}
            >
              <Plus size={17} /> {dictionary.addDepartment}
            </button>
            <button
              type="button"
              className="admin-primary-button"
              onClick={() => {
                setInviteOpen(true);
                setInviteLink(null);
                setInviteRole("member");
                setInviteDepartmentId(unassignedValue);
                setInviteJobTitle("");
                setEmailError(false);
              }}
            >
              <UserPlus size={17} /> {dictionary.inviteMember}
            </button>
          </>
        }
      />

      <section className="organization-summary" aria-label={dictionary.organizationOverview}>
        <span>
          <UsersRound size={18} />
          <strong>{dictionary.membersCount.replace("{count}", String(members.length))}</strong>
        </span>
        <span>
          <Building2 size={18} />
          <strong>
            {dictionary.departmentCount.replace("{count}", String(departments.length))}
          </strong>
        </span>
        <span>
          <UserCog size={18} />
          <strong>{dictionary.ownersCount.replace("{count}", String(ownerCount))}</strong>
        </span>
      </section>

      <div className="organization-layout">
        <aside className="organization-tree admin-panel">
          <div className="organization-tree-heading">
            <h2>
              {dictionary.departments}
              <span>{departments.length}</span>
            </h2>
            <button
              type="button"
              className="icon-button tiny"
              aria-label={dictionary.addDepartment}
              onClick={() => openDepartment()}
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="organization-tree-list">
            <div className="organization-tree-row">
              <button
                type="button"
                className={`organization-tree-item${selectedDepartment === null ? " is-active" : ""}`}
                onClick={() => setSelectedDepartment(null)}
              >
                <UsersRound size={16} />
                <span>{dictionary.allMembers}</span>
                <strong>{members.length}</strong>
              </button>
              <span className="organization-tree-edit-slot" aria-hidden="true" />
            </div>
            {roots
              .flatMap((root) => [root, ...departments.filter((item) => item.parentId === root.id)])
              .map((department) => (
                <div className="organization-tree-row" key={department.id}>
                  <button
                    type="button"
                    className={`organization-tree-item${selectedDepartment === department.id ? " is-active" : ""}`}
                    aria-level={department.parentId ? 2 : 1}
                    onClick={() => setSelectedDepartment(department.id)}
                  >
                    <Building2 size={16} />
                    <span>{department.name}</span>
                    <strong>{department.memberCount}</strong>
                  </button>
                  <span className="organization-tree-edit-slot">
                    <button
                      type="button"
                      className="organization-tree-edit"
                      aria-label={`${dictionary.editDepartment} · ${department.name}`}
                      onClick={() => openDepartment(department)}
                    >
                      <Pencil size={14} />
                    </button>
                  </span>
                </div>
              ))}
            <div className="organization-tree-row">
              <button
                type="button"
                className={`organization-tree-item${selectedDepartment === "unassigned" ? " is-active" : ""}`}
                onClick={() => setSelectedDepartment("unassigned")}
              >
                <Building2 size={16} />
                <span>{dictionary.unassigned}</span>
                <strong>{unassignedCount}</strong>
              </button>
              <span className="organization-tree-edit-slot" aria-hidden="true" />
            </div>
          </div>
        </aside>

        <section className="organization-members admin-panel">
          <div className="organization-toolbar">
            <h2>
              {dictionary.member}
              <span>{filteredMembers.length}</span>
            </h2>
            <label className="organization-search">
              <Search size={17} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={dictionary.searchPlaceholder}
              />
            </label>
          </div>
          {table.getRowModel().rows.length === 0 ? (
            <HaloEmptyState icon={<UsersRound size={22} />} title={dictionary.emptyMembers} />
          ) : (
            <div className="organization-table-wrap">
              <table className="organization-table">
                <thead>
                  {table.getHeaderGroups().map((group) => (
                    <tr key={group.id}>
                      {group.headers.map((header) => (
                        <th key={header.id}>
                          {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map((row) => (
                    <tr key={row.id}>
                      {row.getAllCells().map((cell) => (
                        <td key={cell.id} data-label={String(cell.column.columnDef.header ?? "")}>
                          <table.FlexRender cell={cell} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <HaloPagination
            page={pagination.pageIndex + 1}
            pageSize={pagination.pageSize}
            total={filteredMembers.length}
            onPageChange={(nextPage) => table.setPageIndex(nextPage - 1)}
            onPageSizeChange={(size) => {
              table.setPageSize(size);
              table.setPageIndex(0);
            }}
            labels={{
              previous: dictionary.previousPage,
              next: dictionary.nextPage,
              summary: dictionary.pageSummary,
              pageSize: dictionary.pageSize,
            }}
          />
        </section>
      </div>

      <HaloDialog
        open={editingMember !== null}
        className="workspace-admin-drawer"
        title={dictionary.editMember}
        description={editingMember?.email ?? ""}
        icon={<UserCog size={18} />}
        onClose={() => setEditingMember(null)}
        closeLabel={dictionary.close}
        footer={
          <>
            <button
              type="button"
              className="secondary-button"
              onClick={() => setEditingMember(null)}
            >
              {dictionary.cancel}
            </button>
            <button
              type="submit"
              form="workspace-edit-member"
              className="primary-button"
              disabled={submitting}
            >
              {submitting ? <LoaderCircle size={16} /> : null}
              {dictionary.save}
            </button>
          </>
        }
      >
        <form
          id="workspace-edit-member"
          className="organization-form"
          noValidate
          onSubmit={(event) => void saveMember(event)}
        >
          <label>
            <span>{dictionary.department}</span>
            <HaloSelect
              value={memberDepartmentId}
              onValueChange={setMemberDepartmentId}
              ariaLabel={dictionary.department}
              options={[
                { value: unassignedValue, label: dictionary.unassigned },
                ...departments
                  .filter((item) => item.status === "active")
                  .map((item) => ({ value: item.id, label: item.name })),
              ]}
            />
          </label>
          <label>
            <span>{dictionary.jobTitle}</span>
            <input
              value={memberJobTitle}
              maxLength={120}
              onChange={(event) => setMemberJobTitle(event.target.value)}
            />
          </label>
        </form>
      </HaloDialog>

      <HaloDialog
        open={departmentOpen}
        className="workspace-admin-drawer"
        title={editingDepartment ? dictionary.editDepartment : dictionary.createDepartment}
        description={dictionary.departmentCodeHint}
        icon={<Building2 size={18} />}
        onClose={() => setDepartmentOpen(false)}
        closeLabel={dictionary.close}
        footer={
          <>
            <button
              type="button"
              className="secondary-button"
              onClick={() => setDepartmentOpen(false)}
            >
              {dictionary.cancel}
            </button>
            <button
              type="submit"
              form="workspace-department"
              className="primary-button"
              disabled={submitting}
            >
              {submitting ? <LoaderCircle size={16} /> : null}
              {dictionary.save}
            </button>
          </>
        }
      >
        <form
          id="workspace-department"
          className="organization-form"
          noValidate
          onSubmit={(event) => void saveDepartment(event)}
        >
          <label>
            <span>{dictionary.departmentName}</span>
            <input
              required
              value={departmentName}
              maxLength={200}
              onChange={(event) => setDepartmentName(event.target.value)}
            />
          </label>
          <label>
            <span>{dictionary.departmentCode}</span>
            <input
              required
              value={departmentCode}
              maxLength={64}
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              onChange={(event) => setDepartmentCode(event.target.value.toLowerCase())}
            />
          </label>
          <label>
            <span>{dictionary.departmentDescription}</span>
            <textarea
              value={departmentDescription}
              maxLength={500}
              rows={3}
              onChange={(event) => setDepartmentDescription(event.target.value)}
            />
          </label>
          <label>
            <span>{dictionary.parentDepartment}</span>
            <HaloSelect
              value={parentDepartmentId}
              onValueChange={setParentDepartmentId}
              ariaLabel={dictionary.parentDepartment}
              options={[
                { value: rootValue, label: dictionary.rootDepartment },
                ...roots
                  .filter((item) => item.id !== editingDepartment?.id)
                  .map((item) => ({ value: item.id, label: item.name })),
              ]}
            />
          </label>
          <label>
            <span>{dictionary.manager}</span>
            <HaloSelect
              value={managerActorId}
              onValueChange={setManagerActorId}
              ariaLabel={dictionary.manager}
              options={[
                { value: noManagerValue, label: dictionary.noManager },
                ...members.map((member) => ({ value: member.actorId, label: member.name })),
              ]}
            />
          </label>
          <label>
            <span>{dictionary.sortOrder}</span>
            <input
              type="number"
              value={sortOrder}
              min={-10000}
              max={10000}
              onChange={(event) => setSortOrder(event.target.value)}
            />
          </label>
        </form>
      </HaloDialog>

      <HaloDialog
        open={inviteOpen}
        className="workspace-admin-drawer"
        title={dictionary.inviteMember}
        description={dictionary.inviteDescription}
        icon={<Mail size={18} />}
        onClose={() => setInviteOpen(false)}
        closeLabel={dictionary.close}
        footer={
          <>
            <button type="button" className="secondary-button" onClick={() => setInviteOpen(false)}>
              {dictionary.cancel}
            </button>
            <button
              type="submit"
              form="workspace-invite-member"
              className="primary-button"
              disabled={submitting}
            >
              {submitting ? <LoaderCircle size={16} /> : null}
              {dictionary.inviteMember}
            </button>
          </>
        }
      >
        <form
          id="workspace-invite-member"
          className="organization-form"
          noValidate
          onSubmit={(event) => void invite(event)}
        >
          <label>
            <span>{dictionary.memberEmail}</span>
            <FieldError open={emailError} message={dictionary.invalidEmail}>
              <div>
                <input
                  name="email"
                  type="text"
                  inputMode="email"
                  autoComplete="email"
                  autoFocus
                  placeholder={dictionary.inviteEmailPlaceholder}
                  onChange={() => setEmailError(false)}
                />
              </div>
            </FieldError>
          </label>
          <label>
            <span>{dictionary.department}</span>
            <HaloSelect
              value={inviteDepartmentId}
              onValueChange={setInviteDepartmentId}
              ariaLabel={dictionary.department}
              options={[
                { value: unassignedValue, label: dictionary.unassigned },
                ...departments
                  .filter((item) => item.status === "active")
                  .map((item) => ({ value: item.id, label: item.name })),
              ]}
            />
          </label>
          <label>
            <span>{dictionary.jobTitle}</span>
            <input
              value={inviteJobTitle}
              maxLength={120}
              onChange={(event) => setInviteJobTitle(event.target.value)}
            />
          </label>
          <label>
            <span>{dictionary.inviteRole}</span>
            <HaloSelect
              value={inviteRole}
              onValueChange={(next) => setInviteRole(next as WorkspaceRole)}
              ariaLabel={dictionary.inviteRole}
              options={[
                { value: "member", label: roleLabel("member") },
                { value: "guest", label: roleLabel("guest") },
                ...(activeWorkspace?.role === "owner"
                  ? [{ value: "admin", label: roleLabel("admin") }]
                  : []),
              ]}
            />
          </label>
          {inviteLink ? (
            <div className="admin-invite-link">
              <span>{dictionary.developmentInviteLink}</span>
              <code>{inviteLink}</code>
              <button type="button" onClick={() => void navigator.clipboard.writeText(inviteLink)}>
                <Copy size={15} /> {dictionary.copy}
              </button>
            </div>
          ) : null}
        </form>
      </HaloDialog>
    </>
  );
}
