import { describe, expect, it } from "vitest";
import { canonicalJson, sha256Digest } from "./canonical-json";

describe("规范化 JSON", () => {
  it("对象键顺序不同仍生成相同内容与摘要", () => {
    const left = { z: 3, nested: { b: true, a: "值" }, list: [2, 1] };
    const right = { list: [2, 1], nested: { a: "值", b: true }, z: 3 };

    expect(canonicalJson(left)).toBe(canonicalJson(right));
    expect(sha256Digest(left)).toBe(sha256Digest(right));
    expect(sha256Digest(left)).toMatch(/^[0-9a-f]{64}$/u);
  });

  it("拒绝 JSON 会静默丢弃或改写的值", () => {
    expect(() => canonicalJson({ missing: undefined })).toThrow("undefined");
    expect(() => canonicalJson(Number.POSITIVE_INFINITY)).toThrow("非有限数字");
    expect(() => canonicalJson(new Date())).toThrow("普通对象");
  });
});
