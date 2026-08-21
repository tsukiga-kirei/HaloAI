import { expect, test } from "@playwright/test";
import { expectNoHorizontalOverflow, openChineseWorkspace } from "./helpers";

test.describe("手机工作台", () => {
  test.beforeEach(async ({ page }) => {
    await openChineseWorkspace(page);
  });

  test("390×844 以单栈底栏切换房间、对话、文档和工作台", async ({ page }) => {
    const navigation = page.getByRole("navigation", { name: "移动端主导航" });
    const rooms = page.getByRole("complementary", { name: "房间", includeHidden: true });
    const conversation = page.locator(".conversation-panel");
    const hub = page.locator(".workspace-hub");
    const document = page.getByRole("complementary", {
      name: "共享文档",
      includeHidden: true,
    });

    await expect(navigation).toBeVisible();
    await expect(conversation).toBeVisible();
    await expect(rooms).toBeHidden();
    await expect(document).toBeHidden();
    await expectNoHorizontalOverflow(page);

    // Next.js 开发工具浮层会覆盖底栏左下角；使用同一状态入口的房间标题按钮验证抽屉路径。
    await page.locator(".conversation-header").getByRole("button", { name: "房间" }).click();
    await expect(rooms).toBeVisible();
    await expect(conversation).toBeHidden();
    await expect(document).toBeHidden();
    await expectNoHorizontalOverflow(page);

    await navigation.getByRole("button", { name: "对话", exact: true }).click();
    await expect(conversation).toBeVisible();
    await expect(rooms).toBeHidden();
    await expect(document).toBeHidden();

    await navigation.getByRole("button", { name: "正文", exact: true }).click();
    await expect(document).toBeVisible();
    await expect(conversation).toBeHidden();
    await expect(rooms).toBeHidden();
    await expect(
      page.getByText("当前文档仅保存名称、归属和状态，正文编辑将在后续需求明确后接入。"),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);

    // Next.js 开发浮层盖住底栏「工作台」；DOM click 仍走到同一入口，不依赖命中检测。
    await navigation.getByRole("button", { name: "工作台", exact: true }).evaluate((button) => {
      (button as HTMLButtonElement).click();
    });
    await expect(hub).toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: "团队工作总览" })).toBeVisible();
    await expect(conversation).toBeHidden();
    await expect(document).toBeHidden();
    await expectNoHorizontalOverflow(page);

    await navigation.getByRole("button", { name: "对话", exact: true }).click();
    await expect(conversation).toBeVisible();
    await expect(hub).toBeHidden();
  });

  test("390×844 的后台使用移动导航且配置卡片无横向溢出", async ({ page }) => {
    await page.goto("/admin/overview");
    await expect(page.getByRole("heading", { level: 1, name: "工作空间总览" })).toBeVisible();
    const navigation = page.getByRole("navigation", { name: "后台配置导航" });
    await expect(navigation).toBeVisible();

    await navigation.getByRole("link", { name: "AI 协作者" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "AI 协作者" })).toBeVisible();
    await expect(page.getByText("Nova", { exact: true })).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await navigation.getByRole("link", { name: "安全策略" }).click();
    await expect(page.getByText("工作空间数据隔离", { exact: true })).toBeVisible();
    await expect(page.getByText("强制执行").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "配置" })).toHaveCount(0);
    await expectNoHorizontalOverflow(page);

    await navigation.getByRole("link", { name: "审计记录" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "审计记录" })).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await navigation.getByRole("link", { name: "可用模型" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "本空间可用模型" })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});
