import type { Locale } from "./i18n";

export interface TenantActivationDictionary {
  title: string;
  loading: string;
  invalid: string;
  description: string;
  email: string;
  name: string;
  password: string;
  passwordHint: string;
  activate: string;
  activating: string;
  signInInstead: string;
  signedInAs: string;
  wrongAccount: string;
  completed: string;
  genericError: string;
}

export const tenantActivationDictionaries: Record<Locale, TenantActivationDictionary> = {
  "zh-CN": {
    title: "激活租户管理员",
    loading: "正在验证一次性邀请…",
    invalid: "这份激活邀请不存在、已过期或已经使用。",
    description: "你将成为 {tenant} 的首位所有者。密码由你本人设置，系统不会生成默认密码。",
    email: "管理员邮箱",
    name: "姓名",
    password: "设置密码",
    passwordHint: "至少 10 个字符",
    activate: "注册并激活租户",
    activating: "正在激活…",
    signInInstead: "已有账号？登录后继续",
    signedInAs: "当前登录：{email}",
    wrongAccount: "当前登录邮箱与邀请不一致，请切换到受邀账号。",
    completed: "租户已创建，正在进入工作空间…",
    genericError: "激活失败，请确认邮箱、密码和邀请状态。",
  },
  "en-US": {
    title: "Activate tenant administrator",
    loading: "Validating the one-time invitation…",
    invalid: "This activation invitation is missing, expired, or already used.",
    description:
      "You will become the first Owner of {tenant}. You set the password yourself; HaloAI never generates a default password.",
    email: "Administrator email",
    name: "Name",
    password: "Set password",
    passwordHint: "At least 10 characters",
    activate: "Register and activate tenant",
    activating: "Activating…",
    signInInstead: "Already registered? Sign in to continue",
    signedInAs: "Signed in as {email}",
    wrongAccount:
      "The signed-in email does not match this invitation. Switch to the invited account.",
    completed: "Tenant created. Opening the workspace…",
    genericError: "Activation failed. Check the email, password, and invitation status.",
  },
};
