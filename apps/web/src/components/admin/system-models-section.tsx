"use client";

import type { AdminDictionary } from "@/lib/admin-i18n";

/**
 * 平台模型目录与租户分配尚未接入 API，禁止用示例租户或示例模型填满页面。
 */
export function SystemModelsSection({ dictionary }: { dictionary: AdminDictionary }) {
  return (
    <div className="admin-section-stack">
      <section className="admin-panel admin-table-panel">
        <h2>{dictionary.systemModelsCatalog}</h2>
        <p className="document-empty-copy">{dictionary.emptyModelCatalog}</p>
      </section>
      <section className="admin-panel admin-table-panel">
        <h2>{dictionary.systemModelsAllocation}</h2>
        <p className="document-empty-copy">{dictionary.emptyAllocation}</p>
      </section>
    </div>
  );
}
