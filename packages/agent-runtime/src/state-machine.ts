export type AgentRunStatus =
  | "queued"
  | "preparing"
  | "running"
  | "streaming"
  | "waiting_input"
  | "waiting_approval"
  | "paused"
  | "completed"
  | "failed"
  | "cancelled";

const allowedTransitions: Record<AgentRunStatus, ReadonlySet<AgentRunStatus>> = {
  queued: new Set(["preparing", "cancelled", "failed"]),
  preparing: new Set(["running", "waiting_input", "waiting_approval", "cancelled", "failed"]),
  running: new Set(["streaming", "waiting_input", "waiting_approval", "paused", "completed", "cancelled", "failed"]),
  streaming: new Set(["running", "waiting_input", "waiting_approval", "paused", "completed", "cancelled", "failed"]),
  waiting_input: new Set(["queued", "cancelled", "failed"]),
  waiting_approval: new Set(["queued", "cancelled", "failed"]),
  paused: new Set(["queued", "cancelled", "failed"]),
  completed: new Set(),
  failed: new Set(),
  cancelled: new Set(),
};

export interface RunTransitionDecision {
  allowed: boolean;
  reason: "allowed" | "same_state" | "terminal_state" | "transition_forbidden";
}

/**
 * Run 终态不可原地复活。重试必须创建新 Run 并通过 `retryOfRunId` 关联，避免旧事件序列、
 * 用量和外部副作用与新尝试混在一起，导致恢复时无法判断哪些步骤已经执行。
 */
export function canTransitionRun(
  current: AgentRunStatus,
  next: AgentRunStatus,
): RunTransitionDecision {
  if (current === next) return { allowed: false, reason: "same_state" };
  if (allowedTransitions[current].size === 0) {
    return { allowed: false, reason: "terminal_state" };
  }
  if (!allowedTransitions[current].has(next)) {
    return { allowed: false, reason: "transition_forbidden" };
  }
  return { allowed: true, reason: "allowed" };
}

export function assertRunTransition(current: AgentRunStatus, next: AgentRunStatus): void {
  const decision = canTransitionRun(current, next);
  if (!decision.allowed) {
    throw new Error(`Agent Run transition ${current} -> ${next} denied: ${decision.reason}`);
  }
}
