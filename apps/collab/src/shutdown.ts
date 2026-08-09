async function settlesWithin(operation: Promise<void>, timeoutMs: number): Promise<boolean> {
  let timeout: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      operation.then(
        () => true,
        () => true,
      ),
      new Promise<boolean>((resolve) => {
        timeout = setTimeout(() => resolve(false), timeoutMs);
      }),
    ]);
  } finally {
    if (timeout !== undefined) clearTimeout(timeout);
  }
}

/**
 * 正常关闭先等待 Hocuspocus 刷新防抖保存。若存储持续失败，其内部 destroy 可能一直等待文档
 * 卸载，因此达到期限后执行一次显式卸载；显式卸载同样受期限约束，调用方随后必须以失败状态
 * 退出，不能把可能丢失最后更新的强制关闭记录为成功。
 */
export async function shutdownWithinDeadline(input: {
  graceful: Promise<void>;
  forceUnload(): Promise<void>;
  timeoutMs: number;
}): Promise<void> {
  if (await settlesWithin(input.graceful, input.timeoutMs)) {
    return input.graceful;
  }

  const forced = input.forceUnload();
  if (!(await settlesWithin(forced, input.timeoutMs))) {
    throw new Error("collaboration-force-shutdown-timeout");
  }
  await forced;
  throw new Error("collaboration-shutdown-forced");
}
