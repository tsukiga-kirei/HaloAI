import type { NextConfig } from "next";

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
  allowedDevOrigins: ["127.0.0.1"],
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
