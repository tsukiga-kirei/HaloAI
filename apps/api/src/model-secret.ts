import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

export interface EncryptedModelSecret {
  readonly secretCiphertext: string;
  readonly secretIv: string;
  readonly secretTag: string;
  readonly secretKeyVersion: string;
}

/**
 * 模型凭据使用带认证的对称加密。每次写入生成独立 IV，并把模型 ID 作为 AAD 绑定，
 * 防止把一条密文复制到另一模型记录后仍能成功解密。主密钥只来自服务端环境。
 */
export class ModelSecretCipher {
  private readonly key: Buffer;

  constructor(
    encodedKey: string,
    private readonly keyVersion: string,
  ) {
    this.key = Buffer.from(encodedKey, "base64");
    if (this.key.byteLength !== 32) throw new TypeError("模型密钥加密主密钥必须为 32 字节");
  }

  encrypt(modelId: string, plaintext: string): EncryptedModelSecret {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", this.key, iv);
    cipher.setAAD(Buffer.from(modelId, "utf8"));
    const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
    return {
      secretCiphertext: ciphertext.toString("base64url"),
      secretIv: iv.toString("base64url"),
      secretTag: cipher.getAuthTag().toString("base64url"),
      secretKeyVersion: this.keyVersion,
    };
  }

  /** 仅供模型网关读取或轮换验证，任何 API 响应与日志都不得调用后输出结果。 */
  decrypt(
    modelId: string,
    encrypted: Pick<EncryptedModelSecret, "secretCiphertext" | "secretIv" | "secretTag">,
  ): string {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      this.key,
      Buffer.from(encrypted.secretIv, "base64url"),
    );
    decipher.setAAD(Buffer.from(modelId, "utf8"));
    decipher.setAuthTag(Buffer.from(encrypted.secretTag, "base64url"));
    return Buffer.concat([
      decipher.update(Buffer.from(encrypted.secretCiphertext, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  }
}
