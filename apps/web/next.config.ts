import type { NextConfig } from "next";

const apiOrigin = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:3100";

const nextConfig: NextConfig = {
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
