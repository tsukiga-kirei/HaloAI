import { DocumentIdSchema, WorkspaceIdSchema } from "@haloai/contracts";
import { describe, expect, it } from "vitest";
import { formatDocumentName, parseDocumentName } from "../src/document-name";

const identity = {
  workspaceId: WorkspaceIdSchema.parse("workspace_00001"),
  documentId: DocumentIdSchema.parse("document_000001"),
};

describe("协作文档名", () => {
  it("以版本化规范编码同时携带 workspaceId 与 documentId", () => {
    const documentName = formatDocumentName(identity);

    expect(documentName.startsWith("v1.")).toBe(true);
    expect(parseDocumentName(documentName)).toEqual(identity);
  });

  it("拒绝只携带 documentId 或额外 query 作用域的名称", () => {
    expect(() => parseDocumentName("document_000001")).toThrow();
    expect(() => parseDocumentName(`${formatDocumentName(identity)}?tenantId=other`)).toThrow();
  });

  it("拒绝额外分段、padding 与解码后不合法的资源 ID", () => {
    const workspace = Buffer.from("workspace_00001", "utf8").toString("base64url");
    const document = Buffer.from("document_000001", "utf8").toString("base64url");
    const invalidDocument = Buffer.from("document/../../other", "utf8").toString("base64url");

    expect(() => parseDocumentName(`v1.${workspace}.${document}.extra`)).toThrow();
    expect(() => parseDocumentName(`v1.${workspace}.${document}=`)).toThrow();
    expect(() => parseDocumentName(`v1.${workspace}.${invalidDocument}`)).toThrow();
  });

  it("不同工作空间中的相同 documentId 具有不同文档名", () => {
    const other = {
      ...identity,
      workspaceId: WorkspaceIdSchema.parse("workspace_00002"),
    };

    expect(formatDocumentName(other)).not.toBe(formatDocumentName(identity));
  });
});
