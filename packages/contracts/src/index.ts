/**
 * 本包只验证跨进程、网络与持久化边界上的数据形状和领域内不变量，不提供授权结论。
 * ID 通过校验不代表资源存在、属于当前工作空间或对当前 Actor 可见；所有引用都必须由
 * 服务端在可信租户上下文中重新解析，并与当前权限、运行授权快照和资源策略取交集。
 * 模型输出、客户端载荷、SSE 重放数据及外部工具结果均应先经过这里的严格 schema，
 * 未知字段与未知协议枚举必须拒绝或隔离，不能用类型断言绕过运行时校验。
 */
export * from "./agent-run";
export * from "./api-error";
export * from "./approval";
export * from "./authentication";
export * from "./collaboration";
export * from "./document-proposal";
export * from "./primitives";
export * from "./system-administration";
export * from "./workspace-collaboration";
