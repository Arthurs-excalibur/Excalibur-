// ─── File System ────────────────────────────────────────────────────────────

export interface FileNode {
  id: string
  name: string
  path: string
  type: 'file' | 'folder'
  children?: FileNode[]
  extension?: string
  modified?: boolean
  recentlyModified?: boolean
}

// ─── Editor ─────────────────────────────────────────────────────────────────

export interface SelectionRange {
  startLine: number
  startCol: number
  endLine: number
  endCol: number
}

export interface EditorTab {
  path: string
  name: string
  content: string
  language: string
  isDirty: boolean
  isReadOnly?: boolean
  activeLine?: number | null
}

// ─── Agent ──────────────────────────────────────────────────────────────────

export type AgentType = 'planner' | 'coder' | 'debugger' | 'git' | 'simulator' | 'system'

export type AgentActionType =
  | 'file_create'
  | 'file_edit'
  | 'file_delete'
  | 'command_run'
  | 'commit'
  | 'plan'
  | 'build'
  | 'test'
  | 'info'

export interface AgentAction {
  id: string
  type: AgentActionType
  label: string
  detail?: string
  status: 'pending' | 'running' | 'success' | 'error'
  timestamp: number
}

export interface AgentMessage {
  id: string
  role: 'user' | 'agent'
  agent?: AgentType
  content: string
  actions?: AgentAction[]
  timestamp: number
  state?: 'idle' | 'thinking' | 'streaming' | 'done'
  isStreaming?: boolean
}

// ─── Trace ───────────────────────────────────────────────────────────────────

export interface TraceEntry {
  id: string
  agent: AgentType
  step: string
  reasoning: string
  input?: string
  output?: string
  duration?: number
  status: 'success' | 'error' | 'warning'
  timestamp: number
  expanded?: boolean
}

// ─── Diff ────────────────────────────────────────────────────────────────────

export interface DiffEntry {
  id: string
  file: string
  before: string
  after: string
  timestamp: number
}

// ─── Terminal ────────────────────────────────────────────────────────────────

export type LogLevel = 'info' | 'success' | 'warning' | 'error' | 'command' | 'output'

export interface TerminalLog {
  id: string
  level: LogLevel
  content: string
  timestamp: number
}

// ─── Mentions ───────────────────────────────────────────────────────────────

export interface Mention {
  id: string
  type: 'file' | 'folder'
  path: string
  name: string
}

// ─── Context ─────────────────────────────────────────────────────────────────

export interface AIContext {
  mentions: Mention[]
  currentFile: string | null
  selection: {
    text: string
    range: { startLine: number; startCol: number; endLine: number; endCol: number }
  } | null
}

// ─── Inline Actions ──────────────────────────────────────────────────────────

export interface InlineActionState {
  isOpen: boolean
  instruction: string
  selection: AIContext['selection'] | null
  position: { x: number; y: number } | null
}

// ─── Planner ─────────────────────────────────────────────────────────────────

export interface PlannerTask {
  id: string
  label: string
  status: 'pending' | 'active' | 'completed' | 'error'
  subtasks?: PlannerTask[]
}

// ─── Activity ────────────────────────────────────────────────────────────────

export type ActivityType = 'idle' | 'planning' | 'coding' | 'debugging' | 'executing' | 'simulating'

// ─── System Events ────────────────────────────────────────────────────────────

export type SystemEventType = 
  | 'FILE_OPENED' 
  | 'FILE_CREATED' 
  | 'FILE_DELETED' 
  | 'FILE_UPDATED' 
  | 'CMD_RUN' 
  | 'CMD_OUTPUT' 
  | 'CMD_ERROR' 
  | 'DIFF_APPLIED' 
  | 'DIFF_REJECTED'
  | 'SYSTEM'

export interface SystemEvent {
  id: string
  type: SystemEventType
  message: string
  detail?: string
  timestamp: number
  level: 'info' | 'success' | 'warning' | 'error'
}

// ─── UI ──────────────────────────────────────────────────────────────────────

export type IDEMode = 'copilot' | 'assisted' | 'autonomous'
export type ActiveRightTab = 'agent' | 'trace' | 'diff' | 'planner' | 'explorer'
export type ActiveBottomTab = 'terminal' | 'output' | 'problems'
