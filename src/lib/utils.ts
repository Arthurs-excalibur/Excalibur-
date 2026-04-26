import type { AgentType, LogLevel } from '../types'

// ─── Language detection ───────────────────────────────────────────────────────

export function getLanguage(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  const map: Record<string, string> = {
    ts: 'typescript', tsx: 'typescript',
    js: 'javascript', jsx: 'javascript',
    css: 'css', scss: 'scss',
    html: 'html', json: 'json',
    md: 'markdown', py: 'python',
    rs: 'rust', go: 'go',
    sh: 'shell', bash: 'shell',
    yaml: 'yaml', yml: 'yaml',
    toml: 'toml', env: 'plaintext',
  }
  return map[ext] ?? 'plaintext'
}

// ─── File icon color ──────────────────────────────────────────────────────────

export function getFileIconColor(ext?: string): string {
  const colors: Record<string, string> = {
    tsx: '#38d9f5', ts: '#4f8ef7',
    jsx: '#fb923c', js: '#fbbf24',
    css: '#e879f9', scss: '#e879f9',
    html: '#fb923c', json: '#fbbf24',
    md: '#94a3b8', py: '#34d399',
    rs: '#fb923c', go: '#38d9f5',
    sh: '#94a3b8', yaml: '#fbbf24',
    yml: '#fbbf24', env: '#94a3b8',
  }
  return colors[ext ?? ''] ?? '#8892b0'
}

// ─── Agent colors / labels ────────────────────────────────────────────────────

export const AGENT_CONFIG: Record<AgentType, { label: string; color: string; bg: string }> = {
  planner:   { label: 'Planner',   color: '#7c6af7', bg: 'rgba(124,106,247,0.12)' },
  coder:     { label: 'Coder',     color: '#38d9f5', bg: 'rgba(56,217,245,0.12)'  },
  debugger:  { label: 'Debugger',  color: '#fb923c', bg: 'rgba(251,146,60,0.12)'  },
  git:       { label: 'Git',       color: '#34d399', bg: 'rgba(52,211,153,0.12)'  },
  simulator: { label: 'Simulator', color: '#e879f9', bg: 'rgba(232,121,249,0.12)' },
  system:    { label: 'System',    color: '#8892b0', bg: 'rgba(136,146,176,0.12)' },
}

// ─── Log level styling ────────────────────────────────────────────────────────

export const LOG_COLORS: Record<LogLevel, string> = {
  info:    '#8892b0',
  success: '#34d399',
  warning: '#fbbf24',
  error:   '#f87171',
  command: '#7c6af7',
  output:  '#e8eaf2',
}

// ─── ID generator ─────────────────────────────────────────────────────────────

export function uid(): string {
  return Math.random().toString(36).slice(2, 10)
}

// ─── Time formatter ───────────────────────────────────────────────────────────

export function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  })
}

// ─── Clamp ────────────────────────────────────────────────────────────────────

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val))
}
