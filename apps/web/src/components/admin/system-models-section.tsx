"use client";

import type { AdminDictionary } from "@/lib/admin-i18n";
import { notify } from "@/components/toast-host";

/**
 * 系统管理预览：平台拥有模型目录，再按租户分配。
 * 密钥只显示是否已保存在服务端，页面不得出现明文。
 */
export function SystemModelsSection({ dictionary }: { dictionary: AdminDictionary }) {
  const catalog = [
    {
      name: dictionary.modelConversationDefault,
      source: dictionary.modelSourceCompatible,
      status: dictionary.statusActive,
      secret: dictionary.modelSecretStored,
      tenants: dictionary.tenantBeichen,
    },
    {
      name: dictionary.modelLocalName,
      source: dictionary.modelSourceLocal,
      status: dictionary.statusActive,
      secret: dictionary.modelSecretStored,
      tenants: [dictionary.tenantBeichen, dictionary.tenantAurora].join(dictionary.listSeparator),
    },
    {
      name: dictionary.modelResearchName,
      source: dictionary.modelSourceCompatible,
      status: dictionary.statusActive,
      secret: dictionary.modelSecretMissing,
      tenants: dictionary.noneAllocated,
    },
  ] as const;
  const allocations = [
    {
      tenant: dictionary.tenantBeichen,
      models: [dictionary.modelConversationDefault, dictionary.modelLocalName].join(
        dictionary.listSeparator,
      ),
    },
    {
      tenant: dictionary.tenantAurora,
      models: dictionary.modelLocalName,
    },
  ] as const;

  return (
    <div className="admin-section-stack">
      <section className="admin-panel admin-table-panel">
        <h2>{dictionary.systemModelsCatalog}</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>{dictionary.tableName}</th>
              <th>{dictionary.modelSource}</th>
              <th>{dictionary.tableStatus}</th>
              <th>{dictionary.modelSecret}</th>
              <th>{dictionary.allocatedTo}</th>
            </tr>
          </thead>
          <tbody>
            {catalog.map((row) => (
              <tr key={row.name}>
                <td>{row.name}</td>
                <td>{row.source}</td>
                <td>{row.status}</td>
                <td>{row.secret}</td>
                <td>{row.tenants}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="admin-panel admin-table-panel">
        <h2>{dictionary.systemModelsAllocation}</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>{dictionary.tenantName}</th>
              <th>{dictionary.allocatedModels}</th>
              <th>{dictionary.tableActions}</th>
            </tr>
          </thead>
          <tbody>
            {allocations.map((row) => (
              <tr key={row.tenant}>
                <td>{row.tenant}</td>
                <td>{row.models}</td>
                <td>
                  <span className="table-actions">
                    <button
                      type="button"
                      className="table-action"
                      onClick={() => notify(dictionary.localOnlyNotice)}
                    >
                      {dictionary.allocateToTenant}
                    </button>
                    <button
                      type="button"
                      className="table-action is-danger"
                      onClick={() => notify(dictionary.localOnlyNotice)}
                    >
                      {dictionary.revokeFromTenant}
                    </button>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
