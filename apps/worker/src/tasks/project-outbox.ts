import type { Task } from "graphile-worker";
import { z } from "zod";
import { diagnosticFields } from "@haloai/logger";
import { getWorkerLogger } from "../logger";

const projectOutboxPayloadSchema = z.object({
  workspaceId: z.string().uuid(),
  outboxEventId: z.string().uuid(),
});

/**
 * Outbox 投影任务允许重复执行：处理器必须用事件 ID 去重，只有目标投影确认完成后才标记
 * 已消费。这样 API 事务提交后即使进程崩溃，通知、搜索和运行任务也不会静默丢失。
 */
export const projectOutboxTask: Task = async (rawPayload, helpers) => {
  const payload = projectOutboxPayloadSchema.parse(rawPayload);
  getWorkerLogger().info(
    diagnosticFields({
      workspaceId: payload.workspaceId,
      jobId: helpers.job.id,
      taskIdentifier: helpers.job.task_identifier,
      outboxEventId: payload.outboxEventId,
    }),
    "准备投影 Outbox 事件",
  );
};
