import { cookies } from "next/headers";
import { SIDEBAR_COLLAPSED_KEY } from "@/lib/shell-collapsed";

/** 折叠宽度同时进 Cookie，管理页 SSR 才能画出已收起的侧栏，避免换分区时先展开再收起。 */
export async function readCollapsedCookie(): Promise<boolean> {
  return (await cookies()).get(SIDEBAR_COLLAPSED_KEY)?.value === "true";
}
