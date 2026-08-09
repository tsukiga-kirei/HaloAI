import type { DocumentPersistencePort, StoreDocumentInput } from "./ports/persistence";

export interface DocumentStoreRetryPolicy {
  attempts: number;
  attemptTimeoutMs: number;
  baseDelayMs: number;
}

export interface DocumentStoreRetryRuntime {
  wait(delayMs: number): Promise<void>;
}

const defaultRuntime: DocumentStoreRetryRuntime = {
  wait(delayMs) {
    return new Promise((resolve) => setTimeout(resolve, delayMs));
  },
};

async function runStoreAttempt(
  persistence: DocumentPersistencePort,
  input: Omit<StoreDocumentInput, "signal">,
  timeoutMs: number,
): Promise<void> {
  const controller = new AbortController();
  let timeout: NodeJS.Timeout | undefined;
  const deadline = new Promise<never>((_resolve, reject) => {
    timeout = setTimeout(() => {
      controller.abort();
      reject(new Error("document-store-attempt-timeout"));
    }, timeoutMs);
  });

  try {
    /**
     * 通过微任务调用端口，同时覆盖异步 reject 与不符合接口约定的同步 throw。state 在每次
     * 尝试中保持同一份不可变快照；适配器不得修改它，也不能在失败后改写为部分状态。
     */
    await Promise.race([
      Promise.resolve().then(() =>
        persistence.storeDocument({
          ...input,
          signal: controller.signal,
        }),
      ),
      deadline,
    ]);
  } finally {
    if (timeout !== undefined) {
      clearTimeout(timeout);
    }
  }
}

/**
 * 保存重试在单次 Hocuspocus store hook 内完成，不能假设第三方服务会在 hook 抛错后再次调度。
 * 尝试次数、单次期限和指数退避全部有上限；最终只抛稳定错误，避免把数据库参数或文档字节
 * 带入第三方默认日志。后续新的文档更新仍可触发新一轮有界保存。
 */
export async function storeDocumentWithRetry(input: {
  persistence: DocumentPersistencePort;
  store: Omit<StoreDocumentInput, "signal">;
  policy: DocumentStoreRetryPolicy;
  runtime?: DocumentStoreRetryRuntime;
}): Promise<void> {
  const runtime = input.runtime ?? defaultRuntime;

  for (let attempt = 1; attempt <= input.policy.attempts; attempt += 1) {
    try {
      await runStoreAttempt(input.persistence, input.store, input.policy.attemptTimeoutMs);
      return;
    } catch {
      if (attempt === input.policy.attempts) {
        throw new Error("document-store-failed");
      }
      await runtime.wait(input.policy.baseDelayMs * 2 ** (attempt - 1));
    }
  }
}
