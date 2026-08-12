export type PersistenceErrorCode =
  | "invalid_context"
  | "invalid_input"
  | "access_denied"
  | "not_found"
  | "conflict"
  | "last_owner_required"
  | "invitation_invalid"
  | "delegation_denied";

/**
 * Repository 只暴露稳定错误码，不把 SQL、表名或连接信息传播到 API。
 * 调用方可以映射为 HTTP 错误，但不能依据数据库驱动的原始消息决定权限。
 */
export class PersistenceError extends Error {
  constructor(
    readonly code: PersistenceErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "PersistenceError";
  }
}
