import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type {
  FileNode,
  EditorTab,
  TerminalLog,
  IDEMode,
  ActiveRightTab,
  ActiveBottomTab,
  SystemEvent,
  ActivityType,
  DiffEntry,
  SelectionRange,
} from '../types'
import { uid } from '../lib/utils'

// ─── Electron API Type ────────────────────────────────────────────────────────

type ElectronAPI = {
  invoke: (channel: string, data?: any) => Promise<any>
  send: (channel: string, data?: any) => void
  on: (channel: string, func: (...args: any[]) => void) => () => void
}

declare global {
  interface Window {
    electron: ElectronAPI
  }
}

// ─── Slice Interfaces ─────────────────────────────────────────────────────────

interface FileSystemSlice {
  files: FileNode[]
  activeFile: string | null
  expandedFolders: Set<string>
  refreshFiles: () => Promise<void>
  setActiveFile: (path: string) => void
  toggleFolder: (path: string) => Promise<void>
  fetchDirectory: (path: string) => Promise<void>
  createFile: (path: string, type: 'file' | 'folder') => Promise<void>
  deleteFile: (path: string) => Promise<void>
  readFile: (path: string) => Promise<string>
  writeFile: (path: string, content: string) => Promise<void>
  searchResults: { path: string; line: number; content: string }[]
  runGlobalSearch: (query: string) => Promise<void>
}

interface EditorSlice {
  openTabs: EditorTab[]
  activeTab: string | null
  selection: { text: string; range: SelectionRange } | null
  inlineAction: {
    isOpen: boolean
    position: { x: number; y: number } | null
    instruction: string
    selection: { text: string; range: SelectionRange } | null
  }
  openTab: (path: string) => Promise<void>
  closeTab: (path: string) => void
  setActiveTab: (path: string) => void
  updateTabContent: (path: string, content: string) => void
  saveTab: (path: string) => Promise<void>
  setSelection: (sel: { text: string; range: SelectionRange } | null) => void
  openInlineAction: (pos: { x: number; y: number }, sel: { text: string; range: SelectionRange }) => void
  closeInlineAction: () => void
  setInlineInstruction: (val: string) => void
}

interface DiffSlice {
  diffs: DiffEntry[]
  addDiff: (diff: DiffEntry) => void
  removeDiff: (id: string) => void
  applyDiff: (id: string) => Promise<void>
}

interface TerminalSlice {
  terminalId: string | null
  isTerminalInitialized: boolean
  isRunning: boolean
  initTerminal: (cwd: string) => void
  writeToTerminal: (data: string) => void
  resizeTerminal: (cols: number, rows: number) => void
  killTerminal: () => void
}

interface AIOrchestratorSlice {
  plan: { id: string; description: string; status: 'pending' | 'in_progress' | 'done' }[]
  runAITask: (task: string) => Promise<void>
  stopAITask: () => void
}

interface EventLogSlice {
  events: SystemEvent[]
  addEvent: (type: SystemEvent['type'], message: string, detail?: string, level?: SystemEvent['level']) => void
  clearEvents: () => void
}

interface UISlice {
  mode: IDEMode
  activeLeftTab: 'explorer' | 'search' | 'git' | 'extensions'
  activeRightTab: ActiveRightTab
  activeBottomTab: ActiveBottomTab
  streamingBuffer: string
  setActiveLeftTab: (tab: 'explorer' | 'search' | 'git' | 'extensions') => void
  setActiveRightTab: (tab: ActiveRightTab) => void
  setActiveBottomTab: (tab: ActiveBottomTab) => void
  setStreamingBuffer: (buf: string) => void
  followMode: boolean
  setFollowMode: (v: boolean) => void
  sidebarWidth: number
  rightPanelWidth: number
  bottomPanelHeight: number
  sidebarCollapsed: boolean
  bottomPanelCollapsed: boolean
  rightPanelCollapsed: boolean
  isProjectOpen: boolean
  isAgentManagerOpen: boolean
  isCommandPaletteOpen: boolean
  setIsCommandPaletteOpen: (open: boolean) => void
  toggleCommandPalette: () => void
  currentProjectPath: string | null
  currentBranch: string | null
  gitStatus: { modified: string[]; staged: string[]; untracked: string[]; deleted: string[] } | null
  openProject: (path: string) => Promise<void>
  loadRecentWorkspaces: () => Promise<void>
  refreshGitStatus: () => Promise<void>
  setIsAgentManagerOpen: (open: boolean) => void
  setMode: (mode: IDEMode) => void
  setSidebarWidth: (w: number) => void
  setRightPanelWidth: (w: number) => void
  setBottomPanelHeight: (h: number) => void
  toggleSidebar: () => void
  toggleBottomPanel: () => void
  toggleRightPanel: () => void
  closeProject: () => void
  currentActivity: ActivityType
  setActivity: (a: ActivityType) => void
  aiStatus: {
    state: 'offline' | 'starting' | 'online' | 'error'
    message: string
  }
  setAiStatus: (status: Partial<useAppStore['aiStatus']>) => void
}

type AppStore = FileSystemSlice & EditorSlice & DiffSlice & TerminalSlice & AIOrchestratorSlice & EventLogSlice & UISlice

// ─── Implementation ───────────────────────────────────────────────────────────
const normalizePath = (p: string) => p.replace(/\\/g, '/')

export const useAppStore = create<AppStore>()(
  subscribeWithSelector((set, get) => ({
    // ── File System ──────────────────────────────────────────────────────────
    files: [],
    activeFile: null,
    expandedFolders: new Set(),
    
    refreshFiles: async (explicitPath?: string) => {
      let path = explicitPath || get().currentProjectPath
      if (!path) return
      path = normalizePath(path)
      console.log(`[Store] refreshFiles -> Path: ${path}`)
      const rawFiles = await window.electron.invoke('fs:readdir', path)
      const files = rawFiles.map((f: any) => ({ ...f, path: normalizePath(f.path) }))
      set({ files })
    },
    
    setActiveFile: (path) => set({ activeFile: path }),
    
    toggleFolder: async (path) => {
      const s = new Set(get().expandedFolders)
      if (s.has(path)) {
        s.delete(path)
      } else {
        await get().fetchDirectory(path)
        s.add(path)
      }
      set({ expandedFolders: s })
    },

    fetchDirectory: async (path) => {
      const children = await window.electron.invoke('fs:readdir', path)
      
      const updateNodes = (nodes: FileNode[]): FileNode[] => {
        return nodes.map(n => {
          if (n.path === path) return { ...n, children }
          if (n.children) return { ...n, children: updateNodes(n.children) }
          return n
        })
      }
      
      set({ files: updateNodes(get().files) })
    },
    
    createFile: async (path, type) => {
      await window.electron.invoke('fs:create', { path, type })
      get().addEvent(type === 'file' ? 'FILE_CREATED' : 'FILE_OPENED', `Created ${type}: ${path}`, path, 'success')
      await get().refreshFiles()
    },
    
    deleteFile: async (path) => {
      if (get().activeTab === path) get().closeTab(path)
      await window.electron.invoke('fs:delete', path)
      get().addEvent('FILE_DELETED', `Deleted: ${path}`, path, 'warning')
      await get().refreshFiles()
    },
    
    readFile: async (path) => {
      return await window.electron.invoke('fs:readFile', path)
    },
    
    writeFile: async (path, content) => {
      await window.electron.invoke('fs:writeFile', { path, content })
      get().addEvent('FILE_UPDATED', `Saved: ${path}`, undefined, 'info')
    },
    searchResults: [],
    runGlobalSearch: async (query) => {
      if (!query.trim()) {
        set({ searchResults: [] })
        return
      }
      const rootPath = get().currentProjectPath
      if (!rootPath) return
      
      const results = await window.electron.invoke('fs:search', { rootPath, query })
      set({ searchResults: results })
    },

    // ── Editor ───────────────────────────────────────────────────────────────
    openTabs: [],
    activeTab: null,
    selection: null,
    inlineAction: { isOpen: false, position: null, instruction: '', selection: null },
    
    openTab: async (rawPath) => {
      const path = normalizePath(rawPath)
      const existing = get().openTabs.find(t => t.path === path)
      if (!existing) {
        const content = await get().readFile(path)
        const name = path.split('/').pop() || ''
        const newTab: EditorTab = {
          path, name, content,
          language: name.split('.').pop() || 'plaintext',
          isDirty: false
        }
        set({ openTabs: [...get().openTabs, newTab] })
      }
      set({ activeTab: path })
      get().addEvent('FILE_OPENED', `Opened file: ${path}`)
    },
    
    closeTab: (path) => {
      const tabs = get().openTabs.filter(t => t.path !== path)
      const activeTab = get().activeTab === path ? (tabs[0]?.path ?? null) : get().activeTab
      set({ openTabs: tabs, activeTab })
    },
    
    setActiveTab: (path) => set({ activeTab: path }),
    
    updateTabContent: (path, content) => {
      set({ openTabs: get().openTabs.map(t => t.path === path ? { ...t, content, isDirty: true } : t) })
    },
    
    saveTab: async (path) => {
      const tab = get().openTabs.find(t => t.path === path)
      if (tab) {
        get().setActivity('coding')
        await get().writeFile(path, tab.content)
        set({ openTabs: get().openTabs.map(t => t.path === path ? { ...t, isDirty: false } : t) })
        get().setActivity('idle')
      }
    },
    
    setSelection: (selection) => set({ selection }),
    
    openInlineAction: (position, selection) => 
      set({ inlineAction: { isOpen: true, position, selection, instruction: '' } }),
      
    closeInlineAction: () => 
      set({ inlineAction: { isOpen: false, position: null, selection: null, instruction: '' } }),
      
    setInlineInstruction: (val) => 
      set({ inlineAction: { ...get().inlineAction, instruction: val } }),

    // ── Diff List ────────────────────────────────────────────────────────────
    diffs: [],
    addDiff: (diff) => set({ diffs: [...get().diffs, diff] }),
    removeDiff: (id) => set({ diffs: get().diffs.filter(d => d.id !== id) }),
    applyDiff: async (id) => {
      const diff = get().diffs.find(d => d.id === id)
      const sessionId = get().currentProjectPath
      if (diff && sessionId) {
        // Use the backend commit flow which handles VFS -> Disk -> Git commit
        const result = await window.electron.invoke('ai:commit:diff', {
          sessionId,
          filePath: diff.file,
          content:  diff.after
        })

        if (result.success) {
          get().addEvent('DIFF_APPLIED', `Applied & Committed: ${diff.file}`, undefined, 'success')
          get().removeDiff(id)
          // If tab is open, update it
          if (get().openTabs.some(t => t.path === diff.file)) {
            get().updateTabContent(diff.file, diff.after)
          }
        } else {
          get().addEvent('SYSTEM', `Failed to apply diff: ${result.error}`, undefined, 'error')
        }
      }
    },

    // ── Terminal (Active Shell) ──────────────────────────────────────────────
    terminalId: null,
    isTerminalInitialized: false,
    isRunning: false,

    initTerminal: (cwd: string) => {
      const id = uid()
      set({ terminalId: id, isTerminalInitialized: true, isRunning: true })
      window.electron.send('terminal:create', { id, cwd })
      
      // Cleanup previous listener if any would be complex here, so we rely on session resets
      window.electron.on(`terminal:exit:${id}`, () => {
        if (get().terminalId === id) {
          set({ isRunning: false, terminalId: null, isTerminalInitialized: false })
        }
      })
    },

    writeToTerminal: (data: string) => {
      const id = get().terminalId
      if (id) {
        window.electron.send('terminal:write', { id, data })
      }
    },

    resizeTerminal: (cols: number, rows: number) => {
      const id = get().terminalId
      if (id) {
        window.electron.send('terminal:resize', { id, cols, rows })
      }
    },

    killTerminal: () => {
      const id = get().terminalId
      if (id) {
        window.electron.send('terminal:kill', id)
        set({ terminalId: null, isTerminalInitialized: false })
      }
    },

    chatHistory: [],
    addChatMessage: (role, content) => set({ chatHistory: [...get().chatHistory, { role, content }] }),
    clearChatHistory: () => set({ chatHistory: [] }),

    // ── AI Orchestrator ──────────────────────────────────────────────────────
    _aiTaskCleanup: null as (() => void) | null,
    plan: [],
    currentIntent: null as string | null,

    runAITask: async (task: string) => {
      const sessionId = get().currentProjectPath
      if (!sessionId) {
        get().addEvent('SYSTEM', 'Cannot start AI Task: No open project.', undefined, 'error')
        return
      }

      // ── Cleanup any previous listener before registering a new one ──────────
      const prev = (get() as any)._aiTaskCleanup
      if (prev) { prev(); (set as any)({ _aiTaskCleanup: null }) }

      get().addEvent('SYSTEM', `▶ Task started: ${task}`, undefined, 'info')
      get().setActivity('simulating')
      get().setStreamingBuffer('') 
      set({ currentIntent: 'Starting Excalibur engine...' })

      const editorContext = {
        activeFile: get().activeTab,
        selection: get().selection,
      }

      window.electron.send('ai:task:start', { sessionId, task, context: editorContext })

      const cleanup = window.electron.on(`ai:update:${sessionId}`, (updateEvent: any) => {
        switch (updateEvent.type) {
          case 'kernel_intent':
            set({ currentIntent: updateEvent.data })
            break

          case 'kernel_token':
            get().setStreamingBuffer(get().streamingBuffer + updateEvent.data)
            break

          case 'kernel_log':
            get().addEvent('SYSTEM', updateEvent.data.message, undefined, 'info')
            get().setStreamingBuffer('') // Clear thinking buffer once a real action happens
            break

          case 'kernel_plan':
            const planMsg = `I've analyzed the task. Here's my plan to ${updateEvent.data.goal}:\n\n` + 
                           updateEvent.data.steps.map((s: string, i: number) => `${i+1}. ${s}`).join('\n')
            get().addChatMessage('assistant', planMsg)
            set({ plan: updateEvent.data.steps.map((s: string, i: number) => ({ id: `step-${i}`, description: s, status: 'pending' })) })
            get().addEvent('SYSTEM',
              `Plan: ${updateEvent.data.goal} (${updateEvent.data.steps.length} steps)`,
              updateEvent.data.steps.join('\n'),
              'info'
            )
            break

          case 'kernel_step':
            set({ plan: get().plan.map((s, i) => ({
              ...s,
              status: i === updateEvent.data.index ? 'in_progress' : (i < updateEvent.data.index ? 'done' : 'pending')
            })) })
            break

          // kernel_diff: the AI staged a file change — add to diff review queue
          case 'kernel_diff': {
            const diff = updateEvent.data
            // Read the 'before' content from the open tab if available, otherwise use what was provided
            const openTab = get().openTabs.find(t => t.path.endsWith(diff.file) || t.path === diff.file)
            get().addDiff({
              id:        diff.id,
              file:      diff.file,
              before:    openTab ? openTab.content : diff.before,
              after:     diff.after,
              timestamp: diff.timestamp,
            })
            get().addEvent('DIFF_APPLIED', `Staged for review: ${diff.file}`, diff.file, 'warning')
            // switch right panel to diff tab so the user sees it
            get().setActiveRightTab('diff')
            break
          }

          case 'kernel_complete':
            const finalReply = get().streamingBuffer || `✓ Task complete. I've staged ${updateEvent.data?.staged ?? 0} file(s) for your review.`
            get().addChatMessage('assistant', finalReply)
            get().addEvent('SYSTEM',
              `✓ Task complete. ${updateEvent.data?.staged ?? 0} file(s) pending review.`,
              undefined, 'success'
            )
            get().setStreamingBuffer('')
            get().setActivity('idle')
            cleanup()
            ;(set as any)({ _aiTaskCleanup: null })
            break

          case 'kernel_error':
            get().addEvent('SYSTEM', `✗ Task failed: ${updateEvent.data.message}`, undefined, 'error')
            get().setActivity('idle')
            cleanup()
            ;(set as any)({ _aiTaskCleanup: null })
            break

          case 'kernel_aborted':
            get().addEvent('SYSTEM', '⏹ Task aborted by user.', undefined, 'warning')
            get().setActivity('idle')
            cleanup()
            ;(set as any)({ _aiTaskCleanup: null })
            break
        }
      })

      ;(set as any)({ _aiTaskCleanup: cleanup })
    },

    stopAITask: () => {
      const sessionId = get().currentProjectPath
      if (!sessionId) return
      window.electron.send('ai:task:stop', sessionId)
      get().setActivity('idle')
      // Cleanup listener immediately on stop
      const cleanup = (get() as any)._aiTaskCleanup
      if (cleanup) { cleanup(); (set as any)({ _aiTaskCleanup: null }) }
    },

    // ── Event Log ────────────────────────────────────────────────────────────
    events: [],
    addEvent: (type, message, detail, level = 'info') => {
      const event: SystemEvent = { id: uid(), type, message, detail, level, timestamp: Date.now() }
      set({ events: [event, ...get().events].slice(0, 50) })
    },
    clearEvents: () => set({ events: [] }),

    // ── UI ───────────────────────────────────────────────────────────────────
    isProjectOpen: false,
    isAgentManagerOpen: false,
    isCommandPaletteOpen: false,
    currentProjectPath: null,
    currentBranch: null,
    recentWorkspaces: [],

    activeLeftTab: 'explorer',
    activeRightTab: 'agent',
    activeBottomTab: 'terminal',
    streamingBuffer: '',
    
    setActiveLeftTab: (tab) => set({ activeLeftTab: tab }),
    setActiveRightTab: (tab) => set({ activeRightTab: tab }),
    setActiveBottomTab: (tab) => set({ activeBottomTab: tab }),
    setStreamingBuffer: (streamingBuffer) => set({ streamingBuffer }),

    setIsAgentManagerOpen: (isAgentManagerOpen) => set({ isAgentManagerOpen }),
    setIsCommandPaletteOpen: (isCommandPaletteOpen) => set({ isCommandPaletteOpen }),
    toggleCommandPalette: () => set({ isCommandPaletteOpen: !get().isCommandPaletteOpen }),

    openProject: async (rawPath) => {
      const path = normalizePath(rawPath)
      console.log(`[Store] openProject -> ${path}`)
      const name = path === '.' ? 'Excalibur IDE' : path.split(/[/\\]/).pop() || 'Unnamed Project'
      
      // Clear current state to avoid ghostly files from prev project
      set({ 
        files: [], 
        openTabs: [], 
        activeTab: null,
        currentProjectPath: path, 
        isProjectOpen: true,
        expandedFolders: new Set()
      })

      const branch = await window.electron.invoke('git:branch', path)
      set({ currentBranch: branch })
      get().addEvent('SYSTEM', `Project opened: ${path}`)
      
      // Initialize AI Session
      await window.electron.invoke('ai:session:create', { id: path, workspacePath: path })
      
      // Persist to recent
      await window.electron.invoke('workspaces:add', { name, path })
      await get().loadRecentWorkspaces()
      
      await get().refreshFiles(path)
      await get().refreshGitStatus()
    },

    gitStatus: null,
    refreshGitStatus: async () => {
      const path = get().currentProjectPath
      if (!path) return
      const status = await window.electron.invoke('git:status', path)
      set({ gitStatus: status, currentBranch: status?.branch || 'no branch' })
    },

    loadRecentWorkspaces: async () => {
      const recentWorkspaces = await window.electron.invoke('workspaces:get')
      set({ recentWorkspaces })
    },

    mode: 'copilot',
    followMode: false,
    setFollowMode: (followMode) => set({ followMode }),
    sidebarWidth: 260,
    rightPanelWidth: 380,
    bottomPanelHeight: 240,
    sidebarCollapsed: false,
    bottomPanelCollapsed: false,
    rightPanelCollapsed: false,
    currentActivity: 'idle',
    
    setMode: (mode) => set({ mode }),
    setSidebarWidth: (w) => set({ sidebarWidth: w }),
    setRightPanelWidth: (w) => set({ rightPanelWidth: w }),
    setBottomPanelHeight: (h) => set({ bottomPanelHeight: h }),
    toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
    toggleBottomPanel: () => set({ bottomPanelCollapsed: !get().bottomPanelCollapsed }),
    toggleRightPanel: () => set({ rightPanelCollapsed: !get().rightPanelCollapsed }),
    closeProject: () => set({ 
      isProjectOpen: false, 
      currentProjectPath: null, 
      files: [], 
      openTabs: [], 
      activeTab: null, 
      currentBranch: null 
    }),
    setActivity: (currentActivity) => set({ currentActivity }),
    aiStatus: { state: 'offline', message: 'Not connected' },
    setAiStatus: (status) => set({ aiStatus: { ...get().aiStatus, ...status } }),
  }))
)
