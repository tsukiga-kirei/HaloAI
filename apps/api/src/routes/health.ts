import type { FastifyInstance } from "fastify";

export async function registerHealthRoutes(app: FastifyInstance): Promise<void> {
  app.get("/health/live", async () => ({ status: "ok" as const }));

  app.get("/health/ready", async (_request, reply) => {
    // Foundation 阶段尚未接入数据库；接入后此处只检查关键依赖的轻量可用性，不能执行迁移。
    reply.header("cache-control", "no-store");
    return { status: "ready" as const, checks: { api: "ok" as const } };
  });
}
