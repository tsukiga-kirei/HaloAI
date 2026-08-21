"use client";

import { useLayoutEffect } from "react";
import { useRouter } from "next/navigation";
import { portalPath, readStoredPortal } from "@/lib/portals";

/**
 * 根路径按上次选择的门户进入对应表面，不承载第二份首页。
 * 偏好只是选路；系统管理仍由服务端平台身份把关，不能靠本地存储提权。
 */
export default function HomePage() {
  const router = useRouter();
  useLayoutEffect(() => {
    router.replace(portalPath(readStoredPortal()));
  }, [router]);
  return null;
}
