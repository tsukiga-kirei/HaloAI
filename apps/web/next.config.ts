import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type { NextConfig } from "next";
import { resolveApiOrigin } from "./src/lib/api-origin";

const apiOriginEnvKeys = new Set([
  "INTERNAL_API_ORIGIN",
  "API_HOST",
  "API_PORT",
  "AUTH_BASE_URL",
  "NEXT_PUBLIC_API_BASE_URL",
]);

/**
 * Next 默认只读 apps/web/.env*。仓库约定配置在根目录 .env.local。
 * 这里只吸入 API 源站相关键，避免把数据库口令装进 Web 进程。
 */
function loadApiOriginEnv(): void {
  const rootEnv = path.resolve(process.cwd(), "../../.env.local");
  const packageEnv = path.resolve(process.cwd(), ".env.local");
  const file = existsSync(rootEnv) ? rootEnv : packageEnv;
  if (!existsSync(file)) {
    return;
  }

  for (const line of readFileSync(file, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (trimmed.length === 0 || trimmed.startsWith("#")) {
      continue;
    }
    const separator = trimmed.indexOf("=");
    if (separator <= 0) {
      continue;
    }
    const key = trimmed.slice(0, separator).trim();
    if (!apiOriginEnvKeys.has(key) || process.env[key]) {
      continue;
    }
    let value = trimmed.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

loadApiOriginEnv();
const apiOrigin = resolveApiOrigin();

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.resolve(process.cwd(), "../.."),
  reactStrictMode: true,
  transpilePackages: ["@haloai/core", "@haloai/contracts", "@haloai/agent-runtime"],
  poweredByHeader: false,
  typedRoutes: true,
  // 开发指示器默认贴底边，会挡住手机底栏的房间/工作台。
  devIndicators: {
    position: "top-right",
  },
  // 本地端到端验收固定使用回环 IP；显式允许该来源，避免开发服务器只返回未水合的 HTML。
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  async rewrites() {
    // 浏览器只打当前页面 Origin，会话 Cookie 保持第一方；Web 再把认证与 API 转到独立端口。
    return [
      { source: "/api/auth/:path*", destination: `${apiOrigin}/api/auth/:path*` },
      { source: "/v1/:path*", destination: `${apiOrigin}/v1/:path*` },
      { source: "/health/:path*", destination: `${apiOrigin}/health/:path*` },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
