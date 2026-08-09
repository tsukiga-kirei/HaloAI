import { expect, test } from "@playwright/test";
import { expectNoHorizontalOverflow, openChineseWorkspace } from "./helpers";

test.describe("桌面工作台", () => {
  test.beforeEach(async ({ page }) => {
    await openChineseWorkspace(page);
  });

  test("1440×900 显示房间、对话和文档三栏且无横向溢出", async ({ page }) => {
    const rooms = page.getByRole("complementary", { name: "房间" });
    const conversation = page.getByRole("main");
    const document = page.getByRole("complementary", { name: "共享文档" });

    await expect(rooms).toBeVisible();
    await expect(conversation).toBeVisible();
    await expect(document).toBeVisible();

    const [roomsBox, conversationBox, documentBox] = await Promise.all([
      rooms.boundingBox(),
      conversation.boundingBox(),
      document.boundingBox(),
    ]);
    expect(roomsBox).not.toBeNull();
    expect(conversationBox).not.toBeNull();
    expect(documentBox).not.toBeNull();
    expect(roomsBox!.x + roomsBox!.width).toBeLessThanOrEqual(conversationBox!.x + 1);
    expect(conversationBox!.x + conversationBox!.width).toBeLessThanOrEqual(documentBox!.x + 1);

    await expectNoHorizontalOverflow(page);
  });

  test("可在中文与英文之间切换", async ({ page }) => {
    await page.getByRole("button", { name: "切换语言" }).click();

    await expect(page.locator("html")).toHaveAttribute("lang", "en-US");
    await expect(page.getByRole("heading", { level: 1, name: "Pilot launch" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Send" })).toBeVisible();

    await page.getByRole("button", { name: "Change language" }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
    await expect(page.getByRole("button", { name: "发送" })).toBeVisible();
  });

  test("可在明暗主题之间切换", async ({ page }) => {
    const root = page.locator("html");
    await expect(root).toHaveAttribute("data-theme", "light");

    await page.getByRole("button", { name: "切换主题" }).click();
    await expect(root).toHaveAttribute("data-theme", "dark");
    await expect
      .poll(() => page.evaluate(() => getComputedStyle(document.documentElement).colorScheme))
      .toBe("dark");

    await page.getByRole("button", { name: "切换主题" }).click();
    await expect(root).toHaveAttribute("data-theme", "light");
  });

  test("发送消息后通过 SSE 流式呈现 Demo 回复", async ({ page }) => {
    const requestText = "请把今天的讨论整理成可执行结论";
    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/demo-agent") && response.request().method() === "POST",
    );

    await page
      .getByRole("textbox", { name: "发送消息，或用 @ 邀请一位 AI 参与…" })
      .fill(requestText);
    await page.getByRole("button", { name: "发送", exact: true }).click();

    await expect(page.getByText(requestText, { exact: true })).toBeVisible();
    const response = await responsePromise;
    expect(response.ok()).toBe(true);
    expect(response.headers()["content-type"]).toContain("text/event-stream");
    expect(response.request().postDataJSON()).toMatchObject({
      message: requestText,
      locale: "zh-CN",
    });

    await expect(
      page.getByText(
        "我已把讨论整理为三个可执行部分：明确目标、补齐证据、由负责人确认最终版本。右侧文档中还有一条修改提案，只有在你审阅并采纳后才会进入正文。",
        { exact: true },
      ),
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByRole("textbox", { name: "发送消息，或用 @ 邀请一位 AI 参与…" }),
    ).toHaveValue("");
    await expect(page.getByRole("button", { name: "发送", exact: true })).toBeDisabled();
  });

  test("打开添加 AI 协作者对话框时显示服务端权限边界", async ({ page }) => {
    await page.getByRole("button", { name: "添加协作者" }).click();

    const dialog = page.getByRole("dialog", { name: "添加协作者" });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "AI 角色" }).click();
    await expect(dialog.getByLabel("模型适配器")).toBeVisible();
    await expect(
      dialog.getByText("权限由服务端策略执行，不会仅依赖 AI 提示词。", { exact: true }),
    ).toBeVisible();
  });
});
