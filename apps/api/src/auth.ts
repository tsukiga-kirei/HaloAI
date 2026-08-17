import {
  authAccounts,
  authSessions,
  authVerifications,
  users,
  type HaloDatabase,
} from "@haloai/db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import type { ApiConfig } from "./config";
import { webOriginAllowlist } from "./web-origins";

/**
 * 认证组件只接收专用数据库连接。这里不启用 cookie 缓存，确保登出、封禁和会话撤销能立即生效；
 * CSRF 与 Origin 校验保持组件默认开启，禁止通过配置关闭。
 */
export function createAuth(database: HaloDatabase, config: ApiConfig) {
  return betterAuth({
    appName: "HaloAI",
    baseURL: config.AUTH_BASE_URL,
    basePath: "/api/auth",
    secret: config.AUTH_SECRET,
    trustedOrigins: webOriginAllowlist(config.WEB_ORIGIN),
    database: drizzleAdapter(database, {
      provider: "pg",
      schema: {
        user: users,
        session: authSessions,
        account: authAccounts,
        verification: authVerifications,
      },
    }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 10,
      maxPasswordLength: 128,
      autoSignIn: true,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
    },
    advanced: {
      database: { generateId: "uuid" },
      cookiePrefix: "haloai",
      defaultCookieAttributes: {
        httpOnly: true,
        secure: config.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      },
    },
  });
}

export type HaloAuth = ReturnType<typeof createAuth>;
