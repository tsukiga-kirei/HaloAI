import { DemoAgentRuntime } from "@haloai/agent-runtime";
import {
  requirePermission,
  type Actor,
  type AgentProfile,
  type AgentVersion,
  type Principal,
} from "@haloai/core";
import { z } from "zod";

export const runtime = "nodejs";

const requestSchema = z.object({
  message: z.string().trim().min(1).max(8_000),
  locale: z.enum(["zh-CN", "en-US"]),
});

const workspaceId = "00000000-0000-4000-8000-000000000001";
const projectId = "00000000-0000-4000-8000-000000000002";
const roomId = "00000000-0000-4000-8000-000000000003";
const humanActorId = "00000000-0000-4000-8000-000000000010";

const demoPrincipal: Principal = {
  actorId: humanActorId,
  actorKind: "human",
  actorStatus: "active",
  workspaceId,
  builtInRole: "member",
  projectIds: new Set([projectId]),
  roomIds: new Set([roomId]),
};

const demoAgent: Actor = {
  id: "00000000-0000-4000-8000-000000000020",
  workspaceId,
  kind: "agent",
  displayName: "Halo",
  handle: "halo",
  status: "active",
  createdAt: new Date(0).toISOString(),
};

const demoProfile: AgentProfile = {
  id: "00000000-0000-4000-8000-000000000021",
  workspaceId,
  actorId: demoAgent.id,
  name: "Halo",
  summary: "协调讨论并帮助团队把结论沉淀为可审阅成果。",
  ownerActorId: humanActorId,
  status: "active",
  currentVersionId: "00000000-0000-4000-8000-000000000022",
  createdAt: new Date(0).toISOString(),
};

const demoVersion: AgentVersion = {
  id: "00000000-0000-4000-8000-000000000022",
  workspaceId,
  profileId: demoProfile.id,
  version: 1,
  responsibility: "协调工作并提出可审阅文档建议",
  nonResponsibilities: ["替人做最终决定", "执行外部写入"],
  instructions: "只整理已授权上下文，所有文档变更先形成提案。",
  expertise: ["coordination", "writing"],
  modelPolicy: { provider: "demo", model: "halo-local-demo" },
  allowedToolIds: [],
  grantedCapabilities: new Set([
    "room.read",
    "room.message.create",
    "document.read",
    "document.proposal.create",
  ]),
  memoryScopes: ["turn", "project"],
  initiative: "coordinator_invited",
  coordinator: true,
  budget: {
    maxInputTokens: 8_000,
    maxOutputTokens: 1_000,
    maxToolCalls: 0,
    maxSteps: 4,
    maxParticipants: 1,
    maxDurationMs: 15_000,
    maxCostMicros: 0,
  },
  requiresApprovalFor: new Set(["integration.tool.write.execute", "document.publish"]),
  policyVersion: "demo-policy-v1",
  contentDigest: "demo-version-v1",
  publishedAt: new Date(0).toISOString(),
};

/**
 * 此 BFF 路由只服务于无密钥 Demo。正式 Agent Run 由独立 API 事务创建并交给耐久 Worker；
 * 浏览器不能提交任意 Agent 配置、委托人 ID 或权限集合来影响执行边界。
 */
export async function POST(request: Request): Promise<Response> {
  const parsed = requestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json(
      { error: { code: "VALIDATION_FAILED", messageKey: "errors.validationFailed" } },
      { status: 400 },
    );
  }

  requirePermission(demoPrincipal, "agent.invoke", { workspaceId, projectId, roomId });

  const encoder = new TextEncoder();
  const runtime = new DemoAgentRuntime();
  const runId = crypto.randomUUID();
  const triggerMessageId = crypto.randomUUID();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of runtime.run({
          runId,
          workspaceId,
          projectId,
          roomId,
          delegatedByActorId: humanActorId,
          triggerMessageId,
          agent: demoAgent,
          profile: demoProfile,
          version: demoVersion,
          input: parsed.data.message,
          history: [],
          locale: parsed.data.locale,
          signal: request.signal,
        })) {
          controller.enqueue(encoder.encode(`id: ${event.sequence}\n`));
          controller.enqueue(encoder.encode(`event: ${event.type}\n`));
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        }
      } catch {
        // 客户端只接收稳定错误码；真实异常应进入带 requestId 的服务端结构化日志。
        controller.enqueue(
          encoder.encode(
            `event: run.failed\ndata: ${JSON.stringify({
              type: "run.failed",
              runId,
              code: "DEMO_RUNTIME_FAILED",
              retryable: true,
            })}\n\n`,
          ),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Content-Type": "text/event-stream; charset=utf-8",
      "X-Accel-Buffering": "no",
    },
  });
}
