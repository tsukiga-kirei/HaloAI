import {
  Server,
  type afterHandleMessagePayload,
  type beforeUnloadDocumentPayload,
  type beforeHandleAwarenessPayload,
  type beforeHandleMessagePayload,
  type beforeSyncPayload,
  type onAuthenticatePayload,
  type onDisconnectPayload,
  type onLoadDocumentPayload,
  type onChangePayload,
  type onStoreDocumentPayload,
  type onTokenSyncPayload,
  type onUpgradePayload,
} from "@hocuspocus/server";
import { createServiceLogger, safeErrorFields, type ServiceLogger } from "@haloai/logger";
import { encodeStateAsUpdate } from "yjs";
import {
  assertContextOwnsDocument,
  authorizeDocumentConnection,
  renewDocumentConnection,
  revalidateDocumentConnection,
  type AuthorizedDocumentConnection,
  type CollaborationConnectionContext,
} from "./authorization";
import { hasCollaborationDemoIdentity, type CollaborationConfig } from "./config";
import { formatDocumentName, parseDocumentName } from "./document-name";
import { DocumentDurabilityGuard } from "./durability-guard";
import { storeDocumentWithRetry } from "./persistence-retry";
import { DocumentRevocationSchema, type DocumentAuthorizationPort } from "./ports/authorization";
import type { DocumentPersistencePort } from "./ports/persistence";
import { RealtimeSecurityGuards } from "./realtime-security";
import { shutdownWithinDeadline } from "./shutdown";

export interface CollaborationServicePorts {
  authorization: DocumentAuthorizationPort;
  persistence?: DocumentPersistencePort;
}

export interface CollaborationService {
  listen(): Promise<void>;
  close(): Promise<void>;
  readonly server: Server;
}

async function withTimeout<T>(operation: Promise<T>, timeoutMs: number): Promise<T> {
  let timeout: NodeJS.Timeout | undefined;
  const deadline = new Promise<never>((_resolve, reject) => {
    timeout = setTimeout(() => reject(new Error("authorization-timeout")), timeoutMs);
  });

  try {
    return await Promise.race([operation, deadline]);
  } finally {
    if (timeout !== undefined) {
      clearTimeout(timeout);
    }
  }
}

function requirePersistence(
  config: CollaborationConfig,
  candidate: DocumentPersistencePort | undefined,
): DocumentPersistencePort {
  if (candidate === undefined) {
    throw new Error("document-persistence-unconfigured");
  }
  if (
    candidate.persistenceKind === "demo-memory" &&
    (config.NODE_ENV === "production" || !hasCollaborationDemoIdentity(config))
  ) {
    throw new Error("demo-persistence-forbidden");
  }
  if (config.NODE_ENV === "production" && candidate.persistenceKind !== "persistent") {
    throw new Error("production-document-persistence-required");
  }
  return candidate;
}

/**
 * 本服务只拥有 Yjs 传输与二进制状态装载/保存，不拥有文档授权真相。工作空间、文档与 Actor
 * 能力全部从短期服务端 ticket 经授权端口解析；URL query 仅是传输附带数据，任何 tenantId、
 * workspaceId 或 capability 参数都不会进入授权判断。
 */
export function createCollaborationService(
  config: CollaborationConfig,
  ports: CollaborationServicePorts,
  suppliedLogger?: ServiceLogger,
): CollaborationService {
  const persistence = requirePersistence(config, ports.persistence);
  const logger =
    suppliedLogger ??
    createServiceLogger({
      service: "collab",
      environment: config.NODE_ENV,
      level: config.LOG_LEVEL,
      logDirectory: config.LOG_DIR,
    });
  const durability = new DocumentDurabilityGuard();
  let forceUnloading = false;
  const security = new RealtimeSecurityGuards({
    maxUpdateBytes: config.MAX_UPDATE_BYTES,
    maxDocumentBytes: config.MAX_DOCUMENT_BYTES,
    maxAwarenessBytes: config.MAX_AWARENESS_BYTES,
    maxAwarenessUpdatesPerSecond: config.MAX_AWARENESS_UPDATES_PER_SECOND,
  });

  const server = new Server({
    name: "HaloAI Collaboration",
    address: config.HOST,
    port: config.PORT,
    quiet: true,
    stopOnSignals: false,
    timeout: config.CONNECTION_TIMEOUT_MS,
    debounce: config.STORE_DEBOUNCE_MS,
    maxDebounce: config.STORE_MAX_DEBOUNCE_MS,
    unloadImmediately: true,
    maxUnauthenticatedQueueSize: Math.min(config.MAX_UPDATE_BYTES, 65_536),
    maxUnauthenticatedQueueMessages: 32,
    maxPendingDocuments: 4,
    websocketOptions: { maxPayload: config.MAX_UPDATE_BYTES },

    async onUpgrade(data: onUpgradePayload): Promise<void> {
      /**
       * 协作 ticket 不放在 URL 中，但仍校验浏览器 Origin，防止攻击页面借用户浏览器建立跨站
       * WebSocket。缺少或不匹配 Origin 时先销毁 socket，再用空拒绝终止 Hocuspocus hook 链。
       */
      if (data.request.headers.origin !== config.WEB_ORIGIN) {
        data.socket.destroy();
        logger.warn(
          {
            origin:
              typeof data.request.headers.origin === "string"
                ? data.request.headers.origin.slice(0, 180)
                : "missing",
          },
          "协作连接 Origin 被拒绝",
        );
        return Promise.reject();
      }
    },

    async onAuthenticate(
      data: onAuthenticatePayload<CollaborationConnectionContext>,
    ): Promise<CollaborationConnectionContext> {
      const authorized = await withTimeout(
        authorizeDocumentConnection({
          token: data.token,
          documentName: data.documentName,
          authorization: ports.authorization,
        }),
        config.AUTH_TIMEOUT_MS,
      );
      data.connectionConfig.readOnly = authorized.readOnly;

      logger.info(
        {
          actorId: authorized.context.grant.actorId,
          workspaceId: authorized.context.grant.workspaceId,
          documentId: authorized.context.grant.documentId,
          access: authorized.context.grant.access,
          socketId: data.socketId,
        },
        "协作文档连接已授权",
      );
      return authorized.context;
    },

    async onTokenSync(
      data: onTokenSyncPayload<CollaborationConnectionContext>,
    ): Promise<CollaborationConnectionContext> {
      const authorized = await withTimeout(
        renewDocumentConnection({
          token: data.token,
          context: data.context,
          documentName: data.documentName,
          authorization: ports.authorization,
        }),
        config.AUTH_TIMEOUT_MS,
      );
      data.connectionConfig.readOnly = authorized.readOnly;
      data.connection.readOnly = authorized.readOnly;
      data.connection.context = authorized.context;
      logger.debug(
        {
          actorId: authorized.context.grant.actorId,
          workspaceId: authorized.context.grant.workspaceId,
          documentId: authorized.context.grant.documentId,
          access: authorized.context.grant.access,
        },
        "协作文档票据已续期",
      );
      return authorized.context;
    },

    async beforeHandleMessage(
      data: beforeHandleMessagePayload<CollaborationConnectionContext>,
    ): Promise<void> {
      const refreshed: AuthorizedDocumentConnection = await withTimeout(
        revalidateDocumentConnection({
          context: data.context,
          documentName: data.documentName,
          authorization: ports.authorization,
        }),
        config.AUTH_TIMEOUT_MS,
      );

      data.context.grant = refreshed.context.grant;
      data.connection.readOnly = refreshed.readOnly;
      await security.beforeHandleMessage(data);
    },

    async afterHandleMessage(
      data: afterHandleMessagePayload<CollaborationConnectionContext>,
    ): Promise<void> {
      security.afterHandleMessage(data);
    },

    async beforeSync(data: beforeSyncPayload<CollaborationConnectionContext>): Promise<void> {
      security.beforeSync(data);
    },

    async beforeHandleAwareness(
      data: beforeHandleAwarenessPayload<CollaborationConnectionContext>,
    ): Promise<void> {
      security.beforeHandleAwareness(data);
    },

    async onLoadDocument(
      data: onLoadDocumentPayload<CollaborationConnectionContext>,
    ): Promise<Uint8Array | undefined> {
      const document = assertContextOwnsDocument(data.context, data.documentName);

      let state: Uint8Array | null;
      try {
        state = await persistence.loadDocument({ document });
      } catch (error) {
        logger.error(
          {
            ...safeErrorFields(error),
            workspaceId: document.workspaceId,
            documentId: document.documentId,
          },
          "协作文档装载失败",
        );
        throw new Error("document-load-failed");
      }

      if (state === null) {
        return undefined;
      }
      if (!(state instanceof Uint8Array) || state.byteLength > config.MAX_DOCUMENT_BYTES) {
        throw new Error("invalid-persisted-document-state");
      }
      return new Uint8Array(state);
    },

    async onChange(data: onChangePayload<CollaborationConnectionContext>): Promise<void> {
      /** 更新已进入权威内存文档后立即标脏；不能等待防抖保存开始才记录，否则断连窗口会丢状态。 */
      durability.markDirty(data.documentName);
    },

    async beforeUnloadDocument(data: beforeUnloadDocumentPayload): Promise<void> {
      if (!forceUnloading) {
        durability.assertCanUnload(data.documentName);
      }
    },

    async onStoreDocument(
      data: onStoreDocumentPayload<CollaborationConnectionContext>,
    ): Promise<void> {
      /**
       * v4 的保存钩子也会由服务端本地事务触发，此时 lastContext 不一定来自某条客户端连接。
       * 持久化身份只从规范 documentName 推导，绝不能用“最后一次连接上下文”决定租户归属或授权。
       */
      const document = parseDocumentName(data.documentName);
      const storedGeneration = durability.beginStore(data.documentName);
      const state = encodeStateAsUpdate(data.document);
      if (state.byteLength > config.MAX_DOCUMENT_BYTES) {
        throw new Error("document-size-limit-exceeded");
      }

      try {
        await storeDocumentWithRetry({
          persistence,
          store: {
            document,
            state,
            storedAt: new Date().toISOString(),
          },
          policy: {
            attempts: config.STORE_RETRY_ATTEMPTS,
            attemptTimeoutMs: config.STORE_ATTEMPT_TIMEOUT_MS,
            baseDelayMs: config.STORE_RETRY_BASE_DELAY_MS,
          },
        });
        durability.markStored(data.documentName, storedGeneration);
      } catch (error) {
        /**
         * v4 不会在保存 hook 抛错后自动重新调度，因此重试必须在上面的有界协调器内完成。
         * 最终仍失败时只抛稳定错误，不把可能携带数据库参数或 Yjs 字节的异常交给默认日志。
         */
        logger.error(
          {
            ...safeErrorFields(error),
            workspaceId: document.workspaceId,
            documentId: document.documentId,
          },
          "协作文档保存失败",
        );
        throw new Error("document-store-failed");
      }
    },

    async onDisconnect(data: onDisconnectPayload<CollaborationConnectionContext>): Promise<void> {
      const document = parseDocumentName(data.documentName);
      logger.debug(
        {
          workspaceId: document.workspaceId,
          documentId: document.documentId,
          actorId: data.context.grant.actorId,
          remainingClients: data.clientsCount,
        },
        "协作文档连接已断开",
      );
    },
  });

  /**
   * 单次撤权可能只针对一个 Actor，但当前 Hocuspocus 公共 API 只能按文档批量关闭连接。
   * Foundation 选择保守地断开该文档全部连接，让每个客户端重新获取 ticket；这会造成短暂重连，
   * 但不会让被撤权连接继续被动接收后续内容。未来维护可信 connection registry 后可精确断开 Actor。
   */
  const unsubscribeRevocations = ports.authorization.subscribeToRevocations((candidate) => {
    const parsed = DocumentRevocationSchema.safeParse(candidate);
    if (!parsed.success) {
      /**
       * 无法解析撤权目标时不能安全判断哪些连接仍有效。为避免格式升级或适配器错误变成
       * fail-open，关闭全部活动文档，让客户端通过当前协议重新认证。
       */
      logger.error("撤权事件格式无效，正在关闭全部协作文档连接");
      server.hocuspocus.closeConnections();
      return;
    }
    const documentName = formatDocumentName(parsed.data);
    logger.info(
      {
        workspaceId: parsed.data.workspaceId,
        documentId: parsed.data.documentId,
        authorizationVersion: parsed.data.authorizationVersion,
      },
      "协作文档权限已撤销，正在关闭活动连接",
    );
    server.hocuspocus.closeConnections(documentName);
  });

  let closePromise: Promise<void> | undefined;
  return {
    server,
    async listen(): Promise<void> {
      await server.listen();
      logger.info({ host: config.HOST, port: config.PORT }, "协作服务已启动");
    },
    close(): Promise<void> {
      closePromise ??= (async () => {
        /**
         * destroy 先停止新连接、关闭现有连接并刷新 v4 的防抖保存，再取消撤权订阅。
         * 不能先退出进程或直接丢弃连接，否则最后一批已确认给客户端的 Yjs 更新可能尚未持久化。
         */
        try {
          await shutdownWithinDeadline({
            graceful: server.destroy(),
            timeoutMs: config.SHUTDOWN_TIMEOUT_MS,
            async forceUnload(): Promise<void> {
              /**
               * 保存重试和正常卸载已耗尽期限时，显式卸载只用于让进程确定结束；调用方仍会
               * 收到失败并以非零状态退出，绝不能把此路径当成“最后更新已经耐久化”。
               */
              forceUnloading = true;
              const documents = [...server.hocuspocus.documents.values()];
              for (const document of documents) {
                await server.hocuspocus.unloadDocument(document);
              }
              if (server.hocuspocus.getDocumentsCount() !== 0) {
                throw new Error("collaboration-documents-still-active");
              }
            },
          });
          if (durability.hasDirtyDocuments()) {
            throw new Error("collaboration-dirty-documents-remain");
          }
          logger.info("协作服务已关闭");
        } finally {
          unsubscribeRevocations();
        }
      })();
      return closePromise;
    },
  };
}
