import { expect, test } from "@playwright/test";
import { expectNoHorizontalOverflow, openChineseWorkspace } from "./helpers";

test.describe("平板工作台", () => {
  test.beforeEach(async ({ page }) => {
    await openChineseWorkspace(page);
  });

  test("768×1024 使用单主视图、房间抽屉与悬浮切换器", async ({ page }) => {
    const navigation = page.getByRole("navigation", { name: "移动端主导航" });
    const rooms = page.getByRole("complementary", { name: "房间" });
    const conversation = page.getByRole("main");
    const document = page.getByRole("complementary", { name: "共享文档" });

    await expect(navigation).toBeVisible();
    await expect(conversation).toBeVisible();
    await expect(document).toBeHidden();

    const closedDrawer = await rooms.boundingBox();
    expect(closedDrawer).not.toBeNull();
    expect(closedDrawer!.x + closedDrawer!.width).toBeLessThanOrEqual(0);

    await navigation.getByRole("button", { name: "房间", exact: true }).click();
    await expect.poll(async () => (await rooms.boundingBox())?.x ?? -1).toBeGreaterThanOrEqual(0);

    await navigation.getByRole("button", { name: "正文", exact: true }).click();
    await expect(document).toBeVisible();
    await expect(conversation).toBeHidden();
    await expect(
      page.getByText("当前文档仅保存名称、归属和状态，正文编辑将在后续需求明确后接入。"),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});
