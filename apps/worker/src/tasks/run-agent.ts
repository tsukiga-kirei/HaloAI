import type { Task } from "graphile-worker";
import { z } from "zod";

const runAgentPayloadSchema = z.object({
  workspaceId: z.string().uuid(),
  runId: z.string().uuid(),
  attempt: z.number().int().min(1),
});

/**
 * 当前任务只建立耐久任务的执行边界。真正运行时必须先在同一工作空间内领取 Run 租约，
 * 再从数据库重新读取固定版本、最新权限和预算；队列 payload 不能携带提示词、密钥或完整文档。
 */
export const runAgentTask: Task = async (rawPayload, helpers) => {
  const payload = runAgentPayloadSchema.parse(rawPayload);
  helpers.logger.info(`已领取 Agent Run ${payload.runId}，尝试次数 ${payload.attempt}`);

  // Foundation 阶段不调用模型；后续由 AgentRuntimePort 驱动状态机并写入递增事件序列。
};
