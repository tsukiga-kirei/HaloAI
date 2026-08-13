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

  test("总览、收件箱和文档目录可用且不会触发 AI 请求", async ({ page }) => {
    const aiRequests: string[] = [];
    page.on("request", (request) => {
      if (request.url().endsWith("/api/demo-agent")) aiRequests.push(request.url());
    });

    await page.getByRole("button", { name: "总览" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "团队工作总览" })).toBeVisible();
    await expect(page.getByRole("button", { name: "总览" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(page.locator(".workspace-hub-tabs")).toHaveCount(0);

    await page.getByRole("button", { name: "收件箱" }).first().click();
    await page.getByRole("button", { name: "待审批" }).click();
    await expect(page.getByText("「品牌与官网」的首页文案等待人工审批。")).toBeVisible();
    await page.getByRole("button", { name: "标记已读" }).click();
    await expect(page.getByRole("status")).toContainText("已在本地标记为已读");

    await page.getByRole("button", { name: "文档" }).first().click();
    await page.locator('input[placeholder="搜索文档"]').fill("访谈");
    await expect(page.getByText("用户访谈洞察汇总")).toBeVisible();
    await expect(page.getByText("HaloAI 内测发布提案")).toHaveCount(0);
    expect(aiRequests).toEqual([]);
    await expectNoHorizontalOverflow(page);
  });

  test("可在中文与英文之间切换", async ({ page }) => {
    await page.getByRole("button", { name: "个人设置" }).click();
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

    await page.getByRole("button", { name: "个人设置" }).click();
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

  test("可搜索、创建并切换拥有独立消息上下文的房间", async ({ page }) => {
    const roomSidebar = page.getByRole("complementary", { name: "房间" });
    const search = roomSidebar.getByRole("searchbox");
    await search.fill("用户研究");
    await expect(roomSidebar.getByRole("button", { name: /用户研究/ })).toBeVisible();
    await expect(roomSidebar.getByRole("button", { name: /内测发布/ })).toBeHidden();

    await search.fill("");
    await roomSidebar.getByRole("button", { name: /用户研究/ }).click();
    await expect(page.getByRole("heading", { level: 1, name: "用户研究" })).toBeVisible();
    await expect(
      page.getByText("这个房间还没有消息。写下目标，或用 @ 邀请一位 AI 开始协作。"),
    ).toBeVisible();

    await page.getByRole("button", { name: "新建房间" }).click();
    const dialog = page.getByRole("dialog", { name: "新建项目房间" });
    await dialog.getByLabel("房间名称").fill("季度复盘");
    await dialog.getByLabel("本房间目标").fill("交付一份带负责人和截止日期的复盘文档");
    await dialog.getByRole("button", { name: "新建项目房间" }).click();

    await expect(page.getByRole("heading", { level: 1, name: "季度复盘" })).toBeVisible();
    await expect(page.getByText("交付一份带负责人和截止日期的复盘文档")).toBeVisible();
    await expect(page.getByRole("status")).toContainText("新房间已创建");
  });

  test("采纳 AI 建议后可保存并查看新文档版本", async ({ page }) => {
    await page.getByRole("button", { name: "采纳建议" }).click();
    const save = page.getByRole("button", { name: "保存版本" });
    await expect(save).toBeEnabled();
    await save.click();
    await expect(page.getByRole("status")).toContainText("文档新版本已保存");

    await page.getByRole("tab", { name: "版本" }).click();
    await expect(page.getByText("版本 v4", { exact: true })).toBeVisible();
  });

  test("设置入口进入独立工作空间后台", async ({ page }) => {
    await page.getByRole("link", { name: "设置" }).click();
    await expect(page).toHaveURL(/\/admin\/overview$/);
    await expect(page.getByRole("heading", { level: 1, name: "工作空间总览" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "后台配置导航" })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("后台分区可导航并继承语言和主题偏好", async ({ page }) => {
    await page.goto("/admin/overview");
    await expect(page.getByRole("heading", { level: 1, name: "工作空间总览" })).toBeVisible();

    await page.getByRole("link", { name: "成员与角色" }).click();
    await expect(page).toHaveURL(/\/admin\/members$/);
    await expect(page.getByRole("heading", { level: 1, name: "成员与访问角色" })).toBeVisible();

    await page.getByRole("button", { name: "切换语言" }).click();
    await expect(
      page.getByRole("heading", { level: 1, name: "Members and access roles" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Change theme" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

    await page.getByRole("link", { name: "Back to collaboration" }).click();
    await expect(page).toHaveURL(/\/app$/);
    await expect(page.getByRole("heading", { level: 1, name: "Pilot launch" })).toBeVisible();
  });

  test("系统后台保持独立锁定且不展示租户内容", async ({ page }) => {
    await page.goto("/system");
    await expect(page.getByRole("heading", { level: 1, name: "系统后台保持锁定" })).toBeVisible();
    await expect(page.getByText("内测发布", { exact: true })).toHaveCount(0);
    await expect(page.getByText("用户研究", { exact: true })).toHaveCount(0);
  });
});
