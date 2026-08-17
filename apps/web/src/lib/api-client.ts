/**
 * 浏览器请求走当前页面 Origin，由 Next rewrite 转到 API。
 * 这样会话 Cookie 是第一方，不会因为 3000/3100 分端口，或 localhost 与 127.0.0.1 混用被拒。
 * 服务端渲染仍直连 API 源站。
 */
export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") return "";
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:3100";
}

export class ApiClientError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    readonly messageKey?: string,
  ) {
    super(code);
    this.name = "ApiClientError";
  }
}

/** 浏览器请求始终携带 HttpOnly 会话 Cookie；响应错误只读取稳定错误码，不显示服务端异常文本。 */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      ...(init?.body === undefined ? {} : { "content-type": "application/json" }),
      ...init?.headers,
    },
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      error?: { code?: string; messageKey?: string };
      code?: string;
      message?: string;
    } | null;
    throw new ApiClientError(
      response.status,
      payload?.error?.code ?? payload?.code ?? "request_failed",
      payload?.error?.messageKey,
    );
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
