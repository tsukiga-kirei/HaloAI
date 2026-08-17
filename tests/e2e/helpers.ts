import { expect, type Page } from "@playwright/test";

/** 与 packages/db/devdata 本地账号一致；禁止把明文密码打进浏览器包。 */
const demoOwnerEmail = "owner@haloai.dev";
const demoOwnerPassword = "haloai1234";

export async function openChineseWorkspace(page: Page): Promise<void> {
  // 每条用例都从可预测的语言、主题、门户与侧栏状态开始，避免本地偏好污染验收结果。
  await page.addInitScript(() => {
    try {
      window.localStorage.removeItem("haloai.locale");
      window.localStorage.removeItem("haloai.theme");
      window.localStorage.removeItem("haloai.portal");
      window.localStorage.removeItem("haloai.sidebarCollapsed");
      window.localStorage.removeItem("haloai.workspaceId");
    } catch {
      // about:blank 等无存储上下文无需处理，进入应用源后脚本会再次执行。
    }
  });
  await page.goto("/login");
  await page.locator('input[name="email"]').fill(demoOwnerEmail);
  await page.locator('input[name="password"]').fill(demoOwnerPassword);
  await page.getByRole("button", { name: "以协作成员身份登录" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "内测发布" })).toBeVisible({
    timeout: 30_000,
  });
}

export async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        window.requestAnimationFrame(() => resolve());
      }),
  );
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    root: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));

  expect(
    dimensions.root,
    `根文档宽度 ${dimensions.root}px 不应超过视口 ${dimensions.viewport}px`,
  ).toBeLessThanOrEqual(dimensions.viewport);
  expect(
    dimensions.body,
    `页面宽度 ${dimensions.body}px 不应超过视口 ${dimensions.viewport}px`,
  ).toBeLessThanOrEqual(dimensions.viewport);
}
