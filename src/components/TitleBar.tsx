import React from 'react'
import { useAppStore } from '../store/useAppStore'
import type { IDEMode } from '../types'

const MODE_CONFIG: Record<IDEMode, { label: string; color: string; dot: string }> = {
  copilot:   { label: 'Copilot',    color: 'text-accent-green',  dot: 'bg-accent-green'  },
  assisted:  { label: 'Assisted',   color: 'text-accent-orange', dot: 'bg-accent-orange' },
  autonomous:{ label: 'Autonomous', color: 'text-accent-red',    dot: 'bg-accent-red'    },
}

interface MenuItem {
  label?: string
  shortcut?: string
  divider?: boolean
  hasSubmenu?: boolean
  action?: () => void
}

const MENU_DATA: Record<string, MenuItem[]> = {
  File: [
    { label: 'New Text File', shortcut: 'Ctrl+N' },
    { label: 'New File...', shortcut: 'Ctrl+Alt+Win+N' },
    { label: 'New Window', shortcut: 'Ctrl+Shift+N' },
    { label: 'New Window with Profile', hasSubmenu: true },
    { divider: true },
    { label: 'Open File...', shortcut: 'Ctrl+O' },
    { label: 'Open Folder...', shortcut: 'Ctrl+K Ctrl+O' },
    { label: 'Open Workspace from File...' },
    { label: 'Open Recent', hasSubmenu: true },
    { divider: true },
    { label: 'Add Folder to Workspace...' },
    { label: 'Save Workspace As...' },
    { label: 'Duplicate Workspace' },
    { divider: true },
    { label: 'Save', shortcut: 'Ctrl+S' },
    { label: 'Save As...', shortcut: 'Ctrl+Shift+S' },
    { label: 'Save All', shortcut: 'Ctrl+K S' },
    { divider: true },
    { label: 'Share', hasSubmenu: true },
    { divider: true },
    { label: 'Auto Save' },
    { label: 'Preferences', hasSubmenu: true },
    { divider: true },
    { label: 'Revert File' },
    { label: 'Close Editor', shortcut: 'Ctrl+F4' },
    { label: 'Close Folder', shortcut: 'Ctrl+K F' },
    { label: 'Close Window', shortcut: 'Alt+F4', action: () => window.electron.send('window:close') },
    { divider: true },
    { label: 'Exit', action: () => window.electron.send('window:close') },
  ],
  Edit: [
    { label: 'Undo', shortcut: 'Ctrl+Z' },
    { label: 'Redo', shortcut: 'Ctrl+Y' },
    { divider: true },
    { label: 'Cut', shortcut: 'Ctrl+X' },
    { label: 'Copy', shortcut: 'Ctrl+C' },
    { label: 'Paste', shortcut: 'Ctrl+V' },
  ],
  Selection: [{ label: 'Select All', shortcut: 'Ctrl+A' }],
  View: [{ label: 'Command Palette...', shortcut: 'Ctrl+Shift+P' }],
  Go: [{ label: 'Go to File...', shortcut: 'Ctrl+P' }],
  Run: [{ label: 'Start Debugging', shortcut: 'F5' }],
  Terminal: [{ label: 'New Terminal', shortcut: 'Ctrl+Shift+`' }],
  Help: [{ label: 'About Excalibur' }],
}

const MENUS = Object.keys(MENU_DATA)

export const TitleBar: React.FC = () => {
  const { 
    mode, setMode, isRunning,
    currentActivity, followMode, setFollowMode,
    isProjectOpen, currentProjectPath,
    saveTab, activeTab, openProject,
    sidebarCollapsed, bottomPanelCollapsed, rightPanelCollapsed,
    toggleSidebar, toggleBottomPanel, toggleRightPanel,
    setActiveLeftTab, isAgentManagerOpen, setIsAgentManagerOpen,
    aiStatus
  } = useAppStore()

  const [activeMenu, setActiveMenu] = React.useState<string | null>(null)
  const menuRef = React.useRef<HTMLDivElement>(null)

  // Handle outside click
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenu(null)
      }
    }
    if (activeMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [activeMenu])

  const handleMenuAction = async (item: MenuItem) => {
    setActiveMenu(null)
    if (item.action) {
      item.action()
    } else if (item.label === 'Save' && activeTab) {
      saveTab(activeTab)
    } else if (item.label === 'Open Folder...') {
      const path = await window.electron.invoke('window:open-directory')
      if (path) openProject(path)
    } else if (item.label === 'New Text File' && currentProjectPath) {
      const newPath = `${currentProjectPath}/untitled-${Date.now().toString().slice(-4)}.txt`
      const { createFile } = useAppStore.getState()
      await createFile(newPath, 'file')
    } else if (item.label === 'Close Editor' && activeTab) {
      const { closeTab } = useAppStore.getState()
      closeTab(activeTab)
    } else if (item.label === 'Close Folder') {
      const { closeProject } = useAppStore.getState()
      closeProject()
    }
  }

  return (
    <header
      className="flex-shrink-0 flex items-center justify-between px-4 bg-[#030303] border-b border-white/5 select-none"
      style={{ height: 40, WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* Left — Menus */}
      <div className="flex items-center gap-1 no-drag h-full" ref={menuRef}>
        {/* Logo Mark */}
        <div className="mr-3 flex items-center justify-center opacity-80">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z" className="fill-accent-purple shadow-glow-purple"/>
            </svg>
        </div>

        {MENUS.map(m => (
          <div key={m} className="relative h-full flex items-center">
            <button 
              onMouseDown={() => setActiveMenu(activeMenu === m ? null : m)}
              onMouseEnter={() => activeMenu && setActiveMenu(m)}
              className={`px-3 py-1 rounded-md text-[11px] font-medium transition-all duration-200 ${
                activeMenu === m 
                  ? 'text-text-primary bg-surface-raised' 
                  : 'text-text-muted hover:text-text-primary hover:bg-surface-raised'
              }`}
            >
              {m}
            </button>

            {activeMenu === m && (
              <MenuDropdown 
                items={MENU_DATA[m]} 
                onAction={handleMenuAction}
                onClose={() => setActiveMenu(null)}
              />
            )}
          </div>
        ))}
      </div>

      {/* Center — App Title / AI HUD */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-6 pointer-events-none">
        <div className="flex items-center gap-2 text-[11px] font-bold tracking-tight">
            <span className="text-text-primary neon-text-purple">EXCALIBUR</span>
            <span className="opacity-10 text-white">|</span>
            <span className="font-mono text-[9px] opacity-40 uppercase truncate max-w-[150px]">{isProjectOpen ? currentProjectPath?.split(/[/\\]/).pop() : 'Forge'}</span>
        </div>

        <div className="agent-status-pill no-drag pointer-events-auto">
            <div className={`w-1.5 h-1.5 rounded-full ${aiStatus.state === 'online' ? 'bg-accent-green shadow-glow-green' : aiStatus.state === 'starting' ? 'bg-accent-orange animate-pulse' : 'bg-accent-red shadow-glow-red'}`} />
            <span className="text-[9px] font-bold uppercase tracking-widest text-text-secondary">{aiStatus.message}</span>
        </div>
      </div>

      {/* Right — Actions */}
      <div className="flex items-center gap-4 no-drag h-full">
        {/* Activity indicators (only if open) */}
        {isProjectOpen && (
          <div className="flex items-center gap-3">
             {currentActivity !== 'idle' && (
              <div className="flex items-center gap-2 px-2 py-0.5 rounded-full bg-surface-float border border-accent-purple/30 animate-fade-in shadow-glow-purple/5">
                <div className="w-1 h-1 rounded-full bg-accent-purple animate-pulse" />
                <span className="text-[9px] font-bold text-accent-purple uppercase tracking-tight">
                  {currentActivity}
                </span>
              </div>
            )}
            {isRunning && (
              <div className="flex items-center gap-2 px-2 py-0.5 rounded-full bg-surface-float border border-accent-orange/30 animate-fade-in shadow-glow-orange/5">
                <div className="w-1 h-1 rounded-full bg-accent-orange animate-pulse" />
                <span className="text-[9px] font-bold text-accent-orange uppercase tracking-tight">
                  Executing
                </span>
              </div>
            )}
          </div>
        )}

        {/* Layout & Search Controls */}
        <div className="flex items-center gap-1">
            <button 
              onClick={() => setIsAgentManagerOpen(!isAgentManagerOpen)}
              className={`text-[11px] font-medium mr-2 transition-colors ${isAgentManagerOpen ? 'text-accent-blue' : 'text-text-secondary hover:text-text-primary'}`}
            >
              Open Agent Manager
            </button>

            <div className="flex items-center p-0.5 rounded gap-0.5 mr-1">
              <button className="p-1 rounded text-text-muted hover:text-text-primary transition-colors hover:bg-surface-float">
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
                   <rect x="1.5" y="2.5" width="4.5" height="11" rx="1" />
                   <rect x="8.5" y="2.5" width="6" height="4.5" rx="1" />
                   <rect x="8.5" y="9" width="6" height="4.5" rx="1" />
                </svg>
              </button>

              <button 
                onClick={() => toggleSidebar()}
                className={`p-1 rounded transition-colors ${!sidebarCollapsed ? 'bg-surface-float text-text-primary' : 'text-text-muted hover:text-text-primary'}`}
              >
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" opacity={!sidebarCollapsed ? 1 : 0.8}>
                   <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" />
                   <path d="M5.5 2.5v11" />
                   {!sidebarCollapsed && <rect x="2" y="3" width="3.5" height="10" fill="currentColor" stroke="none" opacity="0.3" />}
                </svg>
              </button>

              <button 
                onClick={() => toggleBottomPanel()}
                className={`p-1 rounded transition-colors ${!bottomPanelCollapsed ? 'bg-surface-float text-text-primary' : 'text-text-muted hover:text-text-primary'}`}
              >
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" opacity={!bottomPanelCollapsed ? 1 : 0.8}>
                   <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" />
                   <path d="M1.5 9.5h13" />
                   {!bottomPanelCollapsed && <rect x="2" y="9.5" width="12" height="3.5" fill="currentColor" stroke="none" opacity="0.3" />}
                </svg>
              </button>

              <button 
                onClick={() => toggleRightPanel()}
                className={`p-1 rounded transition-colors ${!rightPanelCollapsed ? 'bg-surface-float text-text-primary' : 'text-text-muted hover:text-text-primary'}`}
              >
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" opacity={!rightPanelCollapsed ? 1 : 0.8}>
                   <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" />
                   <path d="M10.5 2.5v11" />
                   {!rightPanelCollapsed && <rect x="10.5" y="3" width="3.5" height="10" fill="currentColor" stroke="none" opacity="0.3" />}
                </svg>
              </button>
            </div>
            
            <button 
              onClick={() => setActiveLeftTab('search')}
              className="p-1 rounded text-text-muted hover:text-text-primary transition-colors hover:bg-surface-float mr-3"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </button>
        </div>

        {/* Window Controls */}
        <div className="flex items-center ml-2 border-l border-border-subtle pl-2">
            <WindowControl icon="min" onClick={() => window.electron.send('window:minimize')} />
            <WindowControl icon="max" onClick={() => window.electron.send('window:maximize')} />
            <WindowControl icon="close" onClick={() => window.electron.send('window:close')} danger />
        </div>
      </div>
    </header>
  )
}

const MenuDropdown: React.FC<{ 
  items: MenuItem[]; 
  onAction: (item: MenuItem) => void;
  onClose: () => void 
}> = ({ items, onAction, onClose }) => {
  return (
    <div 
      className="absolute top-[40px] left-0 min-w-[220px] glass-panel rounded-xl shadow-2xl py-2 z-[100] animate-slide-up no-drag overflow-hidden"
    >
      {items.map((item, i) => {
        if (item.divider) {
          return <div key={i} className="h-px bg-border-subtle my-1 mx-1" />
        }
        return (
          <button
            key={i}
            onClick={() => onAction(item)}
            className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] text-text-secondary hover:text-text-primary hover:bg-surface-float group transition-all"
          >
            <span className="flex items-center gap-2">
              <span className="truncate">{item.label}</span>
            </span>
            {item.shortcut && (
              <span className="text-[9px] font-mono opacity-40 group-hover:opacity-60 transition-opacity ml-4">
                {item.shortcut}
              </span>
            )}
            {item.hasSubmenu && (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="opacity-40 group-hover:opacity-100">
                <path d="M9 18l6-6-6-6" />
              </svg>
            )}
          </button>
        )
      })}
    </div>
  )
}

const WindowControl: React.FC<{ icon: 'min'|'max'|'close'; onClick: () => void; danger?: boolean }> = ({ icon, onClick, danger }) => {
  const icons = {
    min: <rect width="10" height="1" x="3" y="11" fill="currentColor"/>,
    max: <rect width="9" height="9" x="3.5" y="3.5" stroke="currentColor" strokeWidth="1.2" fill="none"/>,
    close: <path d="M4 4l8 8M12 4L4 12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  }
  return (
    <button
      onMouseDown={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={`w-10 h-9 flex items-center justify-center transition-colors no-drag ${
        danger ? 'hover:bg-[#e81123] hover:text-white' : 'hover:bg-surface-float text-text-muted hover:text-text-primary'
      }`}
      style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        {icons[icon]}
      </svg>
    </button>
  )
}
