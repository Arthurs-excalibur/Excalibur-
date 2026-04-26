import React from 'react'
import { TitleBar }      from './components/TitleBar'
import { FileExplorer }  from './components/FileExplorer'
import { EditorPanel }   from './components/EditorPanel'
import { AgentConsole }  from './components/AgentConsole'
import { TraceViewer }   from './components/TraceViewer'
import { SearchPanel }   from './components/SearchPanel'
import { GitPanel }      from './components/GitPanel'
import { DiffViewer }    from './components/DiffViewer'
import { TerminalPanel } from './components/TerminalPanel'
import { WelcomeScreen } from './components/WelcomeScreen'
import { AgentManager } from './components/AgentManager'
import { AICommandPalette } from './components/AICommandPalette'
import { useAppStore }   from './store/useAppStore'
import { useResizeH, useResizeV } from './hooks/useResize'
import { useKeyboardShortcuts } from './hooks/useShortcuts'

// ─── Activity Bar ─────────────────────────────────────────────────────────────

const ActivityBar: React.FC = () => {
  const { activeLeftTab, setActiveLeftTab } = useAppStore()

  const items = [
    {
      id: 'explorer' as const,
      title: 'Explorer',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-8l-2-2H5a2 2 0 00-2 2z"/>
        </svg>
      ),
    },
    {
      id: 'search' as const,
      title: 'Search',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
      ),
    },
    {
      id: 'git' as const,
      title: 'Source Control',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9v2c0 1.1-.9 2-2 2H8"/><path d="M6 15V6c0-1.1.9-2 2-2h2"/>
        </svg>
      ),
    },
    {
        id: 'extensions' as const,
        title: 'Extensions',
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12"/>
          </svg>
        ),
      },
  ]

  return (
    <div className="flex flex-col items-center py-6 gap-4 bg-surface-base border-r border-border-subtle flex-shrink-0 w-[60px]">
      {items.map((item) => {
        const isActive = activeLeftTab === item.id
        return (
          <button
            key={item.id}
            title={item.title}
            onClick={() => setActiveLeftTab(item.id)}
            className={`activity-item ${isActive ? 'active' : ''}`}
          >
            {item.icon}
          </button>
        )
      })}
    </div>
  )
}

const SidebarContent: React.FC = () => {
    const { activeLeftTab } = useAppStore()
    switch (activeLeftTab) {
        case 'explorer': return <FileExplorer />
        case 'search': return <SearchPanel />
        case 'git': return <GitPanel />
        case 'extensions': return <div className="p-4 text-xs text-text-muted uppercase font-bold tracking-widest opacity-30">Extension Marketplace</div>
        default: return null
    }
}

const BottomSplitter: React.FC<{
  onMouseDown: (e: React.MouseEvent) => void
  onToggle: () => void
  collapsed: boolean
}> = ({ onMouseDown, onToggle, collapsed }) => (
  <div
    className="flex-shrink-0 flex items-center justify-center border-t border-border-subtle bg-surface-base hover:bg-surface-overlay transition-colors group"
    style={{ height: 4, cursor: 'row-resize' }}
    onMouseDown={onMouseDown}
  >
    <button
      onClick={(e) => { e.stopPropagation(); onToggle() }}
      className="absolute opacity-0 group-hover:opacity-100 px-2 py-0.5 rounded text-[9px] font-bold uppercase text-text-muted hover:text-text-primary bg-surface-float border border-border-subtle transition-all z-10"
      style={{ transform: 'translateX(-50%)', left: '50%' }}
    >
      {collapsed ? 'expand' : 'collapse'}
    </button>
  </div>
)

const RightPanelHeader: React.FC = () => {
  const { activeRightTab, setActiveRightTab } = useAppStore()
  const tabs = [
    { id: 'agent' as const, label: 'Events' },
    { id: 'trace' as const, label: 'History' },
    { id: 'diff' as const,  label: 'Review'  },
  ]
  return (
    <div className="minimal-tab-bar">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => setActiveRightTab(t.id)}
          className={`minimal-tab ${activeRightTab === t.id ? 'active' : ''}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

const App: React.FC = () => {
  const {
    sidebarWidth, setSidebarWidth,
    rightPanelWidth, setRightPanelWidth,
    bottomPanelHeight, setBottomPanelHeight,
    sidebarCollapsed, bottomPanelCollapsed, rightPanelCollapsed,
    toggleBottomPanel,
    activeRightTab, isProjectOpen, isAgentManagerOpen
  } = useAppStore()

  const sidebarResize  = useResizeH(sidebarWidth,     setSidebarWidth,     'right')
  const rightResize    = useResizeH(rightPanelWidth,   setRightPanelWidth,  'left')
  const bottomResize   = useResizeV(bottomPanelHeight, setBottomPanelHeight,'up')
  
  useKeyboardShortcuts()

  React.useEffect(() => {
    const unsub = window.electron.on('workspace:auto-open', (ws: any) => {
      console.log(`[App] Received auto-open request: ${ws.path}`)
      useAppStore.getState().openProject(ws.path)
    })

    // AI Health Poller
    const { setAiStatus } = useAppStore.getState()
    const checkStatus = async () => {
      const health = await window.electron.invoke('llama:health')
      if (health.status === 'ok') {
        setAiStatus({ state: 'online', message: 'Ready' })
      } else if (health.status === 'loading' || health.status === 'starting') {
        setAiStatus({ state: 'starting', message: 'Loading Model...' })
      } else {
        setAiStatus({ state: 'offline', message: 'AI Offline' })
      }
    }
    
    checkStatus()
    const interval = setInterval(checkStatus, 5000)

    return () => { unsub(); clearInterval(interval) }
  }, [])

  const renderContent = () => {
    if (isAgentManagerOpen) return <AgentManager />
    if (isProjectOpen) {
        return (
            <>
              {/* Sidebar */}
              {!sidebarCollapsed && (
                <>
                  <div className="flex-shrink-0 bg-surface-raised overflow-hidden" style={{ width: sidebarWidth }}>
                    <SidebarContent />
                  </div>
                  <div className="resize-handle-h" onMouseDown={sidebarResize.onMouseDown} />
                </>
              )}
  
              {/* Content */}
              <div className="flex flex-col flex-1 overflow-hidden border-l border-border-subtle">
                <div className="flex-1 overflow-hidden"><EditorPanel /></div>
                <BottomSplitter
                  onMouseDown={bottomResize.onMouseDown}
                  onToggle={toggleBottomPanel}
                  collapsed={bottomPanelCollapsed}
                />
                {!bottomPanelCollapsed && (
                  <div className="flex-shrink-0 overflow-hidden" style={{ height: bottomPanelHeight }}>
                    <TerminalPanel />
                  </div>
                )}
              </div>
  
              {/* Right Panel */}
              {!rightPanelCollapsed && (
                <>
                  <div className="resize-handle-h" onMouseDown={rightResize.onMouseDown} />
                  <div className="flex-shrink-0 border-l border-border-subtle flex flex-col bg-surface-raised overflow-hidden" style={{ width: rightPanelWidth }}>
                    <RightPanelHeader />
                    <div className="flex-1 overflow-hidden">
                      {activeRightTab === 'agent' && <AgentConsole />}
                      {activeRightTab === 'trace' && <TraceViewer />}
                      {activeRightTab === 'diff'  && <DiffViewer  />}
                    </div>
                  </div>
                </>
              )}
            </>
          )
    }
    return <WelcomeScreen />
  }

  return (
    <div className="flex flex-col h-full bg-surface-base overflow-hidden select-none">
      <TitleBar />

      <div className="flex flex-1 overflow-hidden">
        {isProjectOpen && !isAgentManagerOpen && <ActivityBar />}
        {renderContent()}
      </div>

      <AICommandPalette />
      <StatusBar />
    </div>
  )
}

const StatusBar: React.FC = () => {
  const { mode, isRunning, openTabs, activeTab, isProjectOpen, currentBranch } = useAppStore()
  const activeTabData = openTabs.find(t => t.path === activeTab)

  if (!isProjectOpen) {
    return (
      <div className="flex-shrink-0 flex items-center justify-between px-3 h-6 bg-surface-raised text-text-muted text-[10px] font-bold uppercase tracking-wider select-none border-t border-border-subtle">
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-[#34d399]">
                 <div className="w-1.5 h-1.5 rounded-full bg-[#34d399]" />
                 <span>system online</span>
            </div>
            <span>v0.4.2-alpha</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Not Signed In</span>
          <span>Terms & Conditions</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-shrink-0 flex items-center justify-between px-4 h-7 bg-surface-base text-text-muted text-[10px] font-bold uppercase tracking-wider select-none border-t border-border-subtle">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 hover:text-text-secondary transition-colors cursor-pointer">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="text-accent-purple">
            <circle cx="5" cy="4" r="2" stroke="currentColor" strokeWidth="1.2"/>
            <circle cx="11" cy="4" r="2" stroke="currentColor" strokeWidth="1.2"/>
            <circle cx="5" cy="12" r="2" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M5 6v4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          <span>{currentBranch || 'detached'}</span>
        </div>
        
        <div className="flex items-center gap-2">
          {isRunning ? (
             <div className="flex items-center gap-2 text-accent-cyan neon-text-cyan">
               <div className="w-1.5 h-1.5 rounded-full bg-accent-cyan animate-pulse" />
               <span>Agent Active</span>
             </div>
          ) : (
            <div className="flex items-center gap-2 opacity-60">
               <div className="w-1.5 h-1.5 rounded-full bg-text-muted" />
               <span>System Idle</span>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-[9px] lowercase opacity-40">{mode} mode</span>
        {activeTabData && <span className="font-mono text-[9px] lowercase text-text-muted opacity-40">{activeTabData.name}</span>}
      </div>
    </div>
  )
}

export default App
