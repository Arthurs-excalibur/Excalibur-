export type ExecutionStatus = 
  | "IDLE" 
  | "PLANNING" 
  | "VALIDATING_PLAN" 
  | "CODING" 
  | "VALIDATING_TOOL" 
  | "SIMULATING" 
  | "DEBUGGING" 
  | "COMMITTING" 
  | "COMPLETED"
  | "FAILED";

export interface PlanStep {
  id: string;
  description: string;
  status: "pending" | "in_progress" | "done" | "failed";
}

export interface ExecutionState {
  sessionId: string;
  status: ExecutionStatus;
  currentAgent: "planner" | "coder" | "debugger" | "none";
  stepIndex: number;
  plan: PlanStep[];
  logs: string[];
  iterations: number;
}

export interface VirtualFileSystemState {
  files: Map<string, string>; // in memory patches
  snapshotId: string;
}

export interface Session {
  id: string;
  workspacePath: string;
  state: ExecutionState;
  vfs: VirtualFileSystemState;
  gitBranch: string;
}
