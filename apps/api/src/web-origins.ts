/**
 * localhost 与 127.0.0.1 在浏览器里是不同 Origin。本地联调若混用，
 * SameSite Cookie 与 CORS 会静默失败。生产环境主机名不会进入这条别名。
 */
export function webOriginAllowlist(origin: string): string[] {
  const allowed = new Set([origin]);
  const url = new URL(origin);
  if (url.hostname === "localhost") {
    url.hostname = "127.0.0.1";
    allowed.add(url.origin);
  } else if (url.hostname === "127.0.0.1") {
    url.hostname = "localhost";
    allowed.add(url.origin);
  }
  return [...allowed];
}
