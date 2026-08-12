import { expect, test } from "@playwright/test";
import { expectNoHorizontalOverflow, openChineseWorkspace } from "./helpers";

test.describe("手机工作台", () => {
  test.beforeEach(async ({ page }) => {
    await openChineseWorkspace(page);
  });

  test("390×844 以单栈底栏切换房间、对话和文档", async ({ page }) => {
    const navigation = page.getByRole("navigation", { name: "移动端主导航" });
    const rooms = page.getByRole("complementary", { name: "房间", includeHidden: true });
    const conversation = page.getByRole("main", { includeHidden: true });
    const document = page.getByRole("complementary", {
      name: "共享文档",
      includeHidden: true,
    });

    await expect(navigation).toBeVisible();
    await expect(conversation).toBeVisible();
    await expect(rooms).toBeHidden();
    await expect(document).toBeHidden();
    await expectNoHorizontalOverflow(page);

    await navigation.getByRole("button", { name: "房间", exact: true }).click();
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
      page.getByRole("heading", { level: 2, name: "HaloAI 内测发布提案" }),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
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
    await expectNoHorizontalOverflow(page);
  });
});
