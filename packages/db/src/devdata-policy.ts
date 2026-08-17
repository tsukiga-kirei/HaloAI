/**
 * DEMO_MODE 只决定是否加载 packages/db/devdata 中的本地虚拟数据。
 * 它不能跳过登录、Cookie 会话或服务端授权；生产环境必须保持关闭。
 */
export function shouldApplyDevdata(environment: NodeJS.ProcessEnv = process.env): boolean {
  const demoMode = environment.DEMO_MODE === "true";
  if (environment.NODE_ENV === "production" && demoMode) {
    throw new Error("生产环境禁止 DEMO_MODE");
  }
  return demoMode;
}
