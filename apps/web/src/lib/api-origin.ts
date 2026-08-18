/**
 * 浏览器不读这个地址，请求始终打当前页面 Origin。
 * Rewrite 与服务端渲染用它找到 API 进程，避免在 env 里再抄一份 URL。
 */
export function resolveApiOrigin(
  environment: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): string {
  const explicit = environment.AUTH_BASE_URL ?? environment.NEXT_PUBLIC_API_BASE_URL;
  if (explicit) {
    return explicit.replace(/\/$/u, "");
  }

  const bindHost = environment.API_HOST ?? "127.0.0.1";
  const publicHost = bindHost === "0.0.0.0" || bindHost === "::" ? "127.0.0.1" : bindHost;
  const port = environment.API_PORT ?? "3100";
  return `http://${publicHost}:${port}`;
}
