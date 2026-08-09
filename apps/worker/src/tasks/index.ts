import type { TaskList } from "graphile-worker";
import { projectOutboxTask } from "./project-outbox";
import { runAgentTask } from "./run-agent";

export const taskList: TaskList = {
  project_outbox: projectOutboxTask,
  run_agent: runAgentTask,
};
