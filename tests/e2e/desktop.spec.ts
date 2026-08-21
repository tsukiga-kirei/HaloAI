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
    await page.getByRole("tab", { name: "待审批" }).click();
    await expect(
      page.getByText("暂时没有待处理事项。提及、审批和邀请接入后会显示在这里。"),
    ).toBeVisible();

    await page.getByRole("button", { name: "文档" }).first().click();
    await page.locator('input[placeholder="搜索文档"]').fill("访谈");
    await expect(page.getByText("用户访谈洞察汇总")).toBeVisible();
    await expect(page.getByText("HaloAI 内测发布提案")).toHaveCount(0);

    await page.getByRole("button", { name: "动态" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "工作空间动态" })).toBeVisible();
    expect(aiRequests).toEqual([]);
    await expectNoHorizontalOverflow(page);
  });

  test("可在中文与英文之间切换", async ({ page }) => {
    await page.getByRole("button", { name: "个人设置" }).click();
    await expect(page.getByRole("menuitem", { name: "退出登录" })).toBeVisible();
    await page.getByRole("menuitem", { name: "切换语言" }).click();

    await expect(page.locator("html")).toHaveAttribute("lang", "en-US");
    await expect(page.getByRole("heading", { level: 1, name: "内测发布" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Send" })).toBeVisible();

    await page.getByRole("menuitem", { name: "Change language" }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
    await expect(page.getByRole("button", { name: "发送" })).toBeVisible();
  });

  test("可在明暗主题之间切换", async ({ page }) => {
    const root = page.locator("html");
    await expect(root).toHaveAttribute("data-theme", "light");

    await page.getByRole("button", { name: "个人设置" }).click();
    await page.getByRole("menuitem", { name: "切换主题" }).click();
    await expect(root).toHaveAttribute("data-theme", "dark");
    await expect
      .poll(() => page.evaluate(() => getComputedStyle(document.documentElement).colorScheme))
      .toBe("dark");

    await page.getByRole("menuitem", { name: "切换主题" }).click();
    await expect(root).toHaveAttribute("data-theme", "light");
  });

  test("发送消息后只持久化人类发言，不请求演示模型", async ({ page }) => {
    // 本地数据库会跨 Playwright 进程保留消息，使用唯一正文避免重跑时命中旧记录。
    const requestText = `请把今天的讨论整理成可执行结论-${Date.now()}`;
    const demoAgentRequests: string[] = [];
    page.on("request", (request) => {
      if (request.url().endsWith("/api/demo-agent")) demoAgentRequests.push(request.url());
    });
    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/rooms/") &&
        response.url().endsWith("/messages") &&
        response.request().method() === "POST",
    );

    await page
      .getByRole("textbox", { name: "发送消息，或用 @ 邀请一位 AI 参与…" })
      .fill(requestText);
    await page.getByRole("button", { name: "发送", exact: true }).click();

    await expect(page.locator(".message-bubble p").filter({ hasText: requestText })).toHaveText(
      requestText,
    );
    const response = await responsePromise;
    expect(response.ok()).toBe(true);
    expect(demoAgentRequests).toEqual([]);
    await expect(
      page.getByRole("textbox", { name: "发送消息，或用 @ 邀请一位 AI 参与…" }),
    ).toHaveValue("");
    await expect(page.getByRole("button", { name: "发送", exact: true })).toBeDisabled();
  });

  test("打开添加 AI 协作者对话框时显示服务端权限边界", async ({ page }) => {
    await page.getByRole("button", { name: "添加协作者" }).click();

    const dialog = page.getByRole("dialog", { name: "添加协作者" });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("tab", { name: "AI 角色" }).click();
    await expect(dialog.getByLabel("模型")).toBeVisible();
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
    await expect(page.locator("[data-sonner-toast]")).toContainText("新房间已创建");
  });

  test("文档面板只展示元数据空态，不提供假正文", async ({ page }) => {
    await expect(page.getByRole("complementary", { name: "共享文档" })).toContainText(
      "当前文档仅保存名称、归属和状态，正文编辑将在后续需求明确后接入。",
    );
    await expect(page.getByRole("button", { name: "采纳建议" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "保存版本" })).toHaveCount(0);
  });

  test("单工作区时个人设置不显示切换工作区，但可打开账户与安全", async ({ page }) => {
    await page.getByRole("button", { name: "个人设置" }).click();
    await expect(page.getByRole("menuitem", { name: "退出登录" })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "切换工作区" })).toHaveCount(0);
    await page.getByRole("menuitem", { name: "账户与安全" }).click();
    await expect(page.getByRole("dialog", { name: "账户与安全" })).toBeVisible();
    await expect(page.getByLabel("登录邮箱")).toHaveValue("owner@haloai.dev");
  });

  test("设置入口进入独立工作空间后台", async ({ page }) => {
    await page.getByRole("button", { name: "个人设置" }).click();
    await page.getByRole("menuitem", { name: "切换角色" }).click();
    await page.getByRole("menuitemradio", { name: "空间管理" }).click();
    await expect(page).toHaveURL(/\/admin\/overview$/);
    await expect(page.getByRole("heading", { level: 1, name: "工作空间总览" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "后台配置导航" })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("后台分区可导航并继承语言和主题偏好", async ({ page }) => {
    await page.goto("/admin/overview");
    await expect(page.getByRole("heading", { level: 1, name: "工作空间总览" })).toBeVisible();

    await page.getByRole("link", { name: "组织与成员" }).click();
    await expect(page).toHaveURL(/\/admin\/members$/);
    await expect(page.getByRole("heading", { level: 1, name: "组织与成员" })).toBeVisible();

    await page.getByRole("button", { name: "个人设置" }).click();
    await page.getByRole("menuitem", { name: "切换语言" }).click();
    await expect(
      page.getByRole("heading", { level: 1, name: "Organization & members" }),
    ).toBeVisible();
    await page.getByRole("menuitem", { name: "Change theme" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

    await page.getByRole("menuitem", { name: "Switch role" }).click();
    await page.getByRole("menuitemradio", { name: "Collaborator" }).click();
    await expect(page).toHaveURL(/\/app$/);
    await expect(page.getByRole("heading", { level: 1, name: "内测发布" })).toBeVisible();
  });

  test("后台审计、可用模型和安全策略可读且不提供假配置入口", async ({ page }) => {
    await page.goto("/admin/audit");
    await expect(page.getByRole("heading", { level: 1, name: "审计记录" })).toBeVisible();
    await expect(page.getByPlaceholder("搜索动作、对象或执行人")).toBeVisible();
    await expect(page.getByRole("button", { name: "导出审计记录" })).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page.getByRole("link", { name: "可用模型" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "本空间可用模型" })).toBeVisible();
    await expect(page.getByText("对象存储", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "配置" })).toHaveCount(0);
    await expectNoHorizontalOverflow(page);

    await page.getByRole("link", { name: "安全策略" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "安全策略" })).toBeVisible();
    await expect(page.getByText("工作空间数据隔离", { exact: true })).toBeVisible();
    await expect(page.getByText("强制执行").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "配置" })).toHaveCount(0);
    await expectNoHorizontalOverflow(page);
  });

  test("系统后台保持独立锁定且不展示租户内容", async ({ page }) => {
    await page.goto("/system");
    await expect(page.getByRole("heading", { level: 1, name: "平台总览" })).toBeVisible();
    await expect(page.getByText("内测发布", { exact: true })).toHaveCount(0);
    await expect(page.getByText("用户研究", { exact: true })).toHaveCount(0);

    await page.getByRole("link", { name: "租户" }).click();
    await expect(page).toHaveURL(/\/system\/tenants$/);
    await expect(page.getByRole("heading", { level: 1, name: "租户管理" })).toBeVisible();
    await page.getByRole("button", { name: "查看成员" }).first().click();
    const tenantMembers = page.getByRole("dialog", { name: "租户成员组织" });
    await expect(tenantMembers.getByText("owner@haloai.dev", { exact: true })).toBeVisible();
    await tenantMembers.getByRole("button", { name: "关闭" }).click();

    await page.getByRole("link", { name: "模型" }).click();
    await expect(page).toHaveURL(/\/system\/models$/);
    await expect(page.getByRole("heading", { level: 1, name: "模型管理" })).toBeVisible();

    await page.getByRole("link", { name: "健康" }).click();
    await expect(page).toHaveURL(/\/system\/health$/);
    await expect(page.getByRole("heading", { level: 1, name: "平台健康" })).toBeVisible();

    await page.getByRole("link", { name: "系统设置" }).click();
    await expect(page).toHaveURL(/\/system\/settings$/);
    await expect(page.getByRole("heading", { level: 1, name: "系统设置" })).toBeVisible();
  });

  test("未注册默认管理员自行设置密码后激活租户", async ({ page, context }) => {
    await context.clearCookies();
    const token = "tenant-activation-token-for-browser-verification";
    await page.route(`**/v1/system/tenant-invitations/${token}`, async (route) => {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          tenantName: "新产品空间",
          administratorEmail: "new-owner@example.com",
          expiresAt: "2026-08-22T00:00:00.000Z",
        }),
      });
    });
    await page.route("**/v1/session", async (route) => {
      await route.fulfill({ status: 401, contentType: "application/json", body: "{}" });
    });
    await page.route("**/api/auth/sign-up/email", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    });
    await page.route("**/v1/system/tenant-invitations/accept", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ workspaceId: "00000000-0000-4000-8000-000000000901" }),
      });
    });

    await page.goto(`/tenant-activate/${token}`);
    await expect(page.getByText(/系统不会生成默认密码/)).toBeVisible();
    await expect(page.getByLabel("管理员邮箱")).toHaveValue("new-owner@example.com");
    await page.getByLabel("姓名").fill("新管理员");
    await page.getByLabel("设置密码").fill("owner-password-2026");
    const signUpRequest = page.waitForRequest("**/api/auth/sign-up/email");
    await page.getByRole("button", { name: "注册并激活租户" }).click();
    expect((await signUpRequest).postDataJSON()).toMatchObject({
      email: "new-owner@example.com",
      name: "新管理员",
      password: "owner-password-2026",
    });
    await expect(page.getByText("租户已创建，正在进入工作空间…")).toBeVisible();
  });
});
