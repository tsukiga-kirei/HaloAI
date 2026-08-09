import type { FastifyInstance } from "fastify";
import { z } from "zod";

const paramsSchema = z.object({ runId: z.string().min(1).max(120) });

function writeSseEvent(
  reply: { raw: NodeJS.WritableStream },
  event: { id: number; type: string; data: unknown },
): void {
  reply.raw.write(`id: ${event.id}\n`);
  reply.raw.write(`event: ${event.type}\n`);
  reply.raw.write(`data: ${JSON.stringify(event.data)}\n\n`);
}

/**
 * 这条路由只验证 SSE 信封、事件序号和浏览器断线恢复的技术链路，不调用真实模型。
 * 正式运行时会从持久事件表按 `Last-Event-ID` 补发，绝不能依赖进程内定时器保存事实。
 */
export async function registerDemoEventRoutes(app: FastifyInstance): Promise<void> {
  app.get("/v1/demo/runs/:runId/events", async (request, reply) => {
    const { runId } = paramsSchema.parse(request.params);
    const rawLastEventId = request.headers["last-event-id"];
    const lastEventIdHeader = Array.isArray(rawLastEventId) ? rawLastEventId[0] : rawLastEventId;
    const lastEventId = Number.parseInt(lastEventIdHeader ?? "0", 10) || 0;

    reply.hijack();
    reply.raw.writeHead(200, {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      "x-accel-buffering": "no",
    });

    const events = [
      { id: 1, type: "run.status", data: { runId, status: "preparing" } },
      { id: 2, type: "run.status", data: { runId, status: "streaming" } },
      {
        id: 3,
        type: "message.delta",
        data: { runId, delta: "演示连接已建立；正式数据会由持久事件流恢复。" },
      },
      { id: 4, type: "run.completed", data: { runId, finishReason: "stop" } },
    ];

    for (const event of events) {
      if (event.id > lastEventId) writeSseEvent(reply, event);
    }
    reply.raw.end();
  });
}
