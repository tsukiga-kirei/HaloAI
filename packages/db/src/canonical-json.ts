import { createHash } from "node:crypto";
/**
 * 对对象键排序，确保同一份结构化内容不会因属性插入顺序不同而产生不同摘要。
 * 输入来自带类型的领域对象，但仍在运行时拒绝 undefined、非有限数字和非普通对象，
 * 避免 JSON.stringify 静默删除字段后生成具有误导性的摘要。
 */
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError("规范化 JSON 不接受非有限数字");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (typeof value !== "object" || Object.getPrototypeOf(value) !== Object.prototype) {
    throw new TypeError("规范化 JSON 只接受 JSON 基础值、数组和普通对象");
  }

  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => {
      if (record[key] === undefined) throw new TypeError("规范化 JSON 不接受 undefined");
      return `${JSON.stringify(key)}:${canonicalJson(record[key])}`;
    })
    .join(",")}}`;
}

export function sha256Digest(value: unknown): string {
  return createHash("sha256").update(canonicalJson(value), "utf8").digest("hex");
}
