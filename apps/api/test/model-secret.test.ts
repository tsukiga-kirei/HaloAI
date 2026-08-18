import { describe, expect, it } from "vitest";
import { ModelSecretCipher } from "../src/model-secret";

const key = "aGFsb2FpLWRldi1tb2RlbC1zZWNyZXQta2V5LTMyISE=";

describe("模型凭据对称加密", () => {
  it("使用随机 IV 加密并可在相同模型 AAD 下解密", () => {
    const cipher = new ModelSecretCipher(key, "test-v1");
    const first = cipher.encrypt("00000000-0000-4000-8000-000000000901", "sk-example-secret");
    const second = cipher.encrypt("00000000-0000-4000-8000-000000000901", "sk-example-secret");

    expect(first.secretCiphertext).not.toBe("sk-example-secret");
    expect(first.secretIv).not.toBe(second.secretIv);
    expect(cipher.decrypt("00000000-0000-4000-8000-000000000901", first)).toBe("sk-example-secret");
  });

  it("拒绝把密文复制到另一个模型记录", () => {
    const cipher = new ModelSecretCipher(key, "test-v1");
    const encrypted = cipher.encrypt("00000000-0000-4000-8000-000000000901", "sk-example-secret");
    expect(() => cipher.decrypt("00000000-0000-4000-8000-000000000902", encrypted)).toThrow();
  });
});
