import { expect, type Page } from "@playwright/test";

export async function openChineseWorkspace(page: Page): Promise<void> {
  // 每条用例都从可预测的语言与主题开始，避免本地偏好污染验收结果。
  await page.addInitScript(() => {
    try {
      window.localStorage.removeItem("haloai.locale");
      window.localStorage.removeItem("haloai.theme");
    } catch {
      // about:blank 等无存储上下文无需处理，进入应用源后脚本会再次执行。
    }
  });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "内测发布" })).toBeVisible();
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
