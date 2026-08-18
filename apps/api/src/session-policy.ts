/**
 * 会话策略以数据库为准。启动时用环境变量填缺省，系统管理员保存后立刻替换内存副本，
 * 以便随后签发的会话使用新有效期，而不把页面做成只读的环境变量镜子。
 */
export interface SessionPolicyState {
  sessionExpiresInSeconds: number;
  sessionUpdateAgeSeconds: number;
  slidingRenewal: boolean;
}

export function createSessionPolicy(initial: SessionPolicyState) {
  const state: SessionPolicyState = { ...initial };
  return {
    snapshot(): SessionPolicyState {
      return { ...state };
    },
    replace(next: SessionPolicyState): void {
      state.sessionExpiresInSeconds = next.sessionExpiresInSeconds;
      state.sessionUpdateAgeSeconds = next.sessionUpdateAgeSeconds;
      state.slidingRenewal = next.slidingRenewal;
    },
    get expiresIn(): number {
      return state.sessionExpiresInSeconds;
    },
    get updateAge(): number {
      return state.slidingRenewal ? state.sessionUpdateAgeSeconds : 0;
    },
  };
}

export type SessionPolicy = ReturnType<typeof createSessionPolicy>;
