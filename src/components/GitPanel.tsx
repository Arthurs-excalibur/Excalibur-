import React, { useEffect } from 'react'
import { useAppStore } from '../store/useAppStore'

export const GitPanel: React.FC = () => {
  const { gitStatus, refreshGitStatus, currentBranch, openTab, setActiveFile } = useAppStore()

  useEffect(() => {
    refreshGitStatus()
    const interval = setInterval(refreshGitStatus, 15000) // Polling for live updates
    return () => clearInterval(interval)
  }, [])

  const handleFileClick = (path: string) => {
    setActiveFile(path)
    openTab(path)
  }

  if (!gitStatus) {
    return (
      <div className="flex flex-col items-center justify-center h-full opacity-30 text-center p-8">
        <p className="text-xs">Initialzing source control...</p>
      </div>
    )
  }

  const hasChanges = (gitStatus.modified.length + gitStatus.untracked.length + gitStatus.deleted.length) > 0

  return (
    <div className="flex flex-col h-full bg-surface-raised overflow-hidden">
      <div className="panel-header flex-shrink-0">
        <span className="panel-title flex items-center gap-2">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="text-text-muted">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          Source Control
        </span>
        <button onClick={() => refreshGitStatus()} className="p-1 hover:text-text-primary transition-colors" title="Refresh">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
             <path d="M13.5 8a5.5 5.5 0 11-1.5-3.8M13.5 2.5v3h-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      <div className="px-4 py-3 border-b border-border-subtle bg-surface-base">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-text-muted"></span>
            <span className="text-xs font-bold text-text-primary">{currentBranch}</span>
          </div>
          <button className="px-2 py-1 rounded bg-accent-purple text-white text-[10px] font-bold hover:bg-accent-purple-dim transition-colors">
            COMMIT
          </button>
        </div>
        
        <div className="relative">
             <input 
                type="text" 
                placeholder="Message (Cmd+Enter to commit)"
                className="w-full px-3 py-2 text-xs rounded-lg bg-surface-overlay border border-border-subtle outline-none focus:border-accent-purple/30 transition-all"
             />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
        {!hasChanges && (
          <div className="flex flex-col items-center justify-center h-full opacity-20 text-center p-8">
            <p className="text-xs">No pending changes</p>
          </div>
        )}

        {gitStatus.staged.length > 0 && (
          <Section title="STAGED CHANGES" count={gitStatus.staged.length}>
            {gitStatus.staged.map(f => <FileRow key={f} path={f} status="staged" onClick={handleFileClick} />)}
          </Section>
        )}

        {gitStatus.modified.length > 0 && (
          <Section title="CHANGES" count={gitStatus.modified.length}>
            {gitStatus.modified.map(f => <FileRow key={f} path={f} status="modified" onClick={handleFileClick} />)}
          </Section>
        )}

        {gitStatus.untracked.length > 0 && (
          <Section title="UNTRACKED" count={gitStatus.untracked.length}>
            {gitStatus.untracked.map(f => <FileRow key={f} path={f} status="untracked" onClick={handleFileClick} />)}
          </Section>
        )}

        {gitStatus.deleted.length > 0 && (
          <Section title="DELETED" count={gitStatus.deleted.length}>
            {gitStatus.deleted.map(f => <FileRow key={f} path={f} status="deleted" onClick={handleFileClick} />)}
          </Section>
        )}
      </div>
    </div>
  )
}

const Section: React.FC<{ title: string; count: number; children: React.ReactNode }> = ({ title, count, children }) => (
  <div className="mb-4">
    <div className="flex items-center justify-between px-2 mb-1">
      <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">{title}</span>
      <span className="text-[10px] px-1.5 rounded-full bg-surface-float text-text-muted font-bold border border-border-subtle">{count}</span>
    </div>
    <div className="space-y-0.5">
      {children}
    </div>
  </div>
)

const FileRow: React.FC<{ path: string; status: string; onClick: (p: string) => void }> = ({ path, status, onClick }) => {
  const colorMap: Record<string, string> = {
    modified: 'text-accent-orange',
    staged: 'text-accent-green',
    untracked: 'text-accent-purple',
    deleted: 'text-accent-red'
  }
  
  return (
    <div 
      onClick={() => onClick(path)}
      className="group flex items-center gap-2 px-2 py-1.5 rounded hover:bg-surface-float cursor-pointer transition-colors"
    >
      <span className="text-xs truncate text-text-secondary group-hover:text-text-primary transition-colors flex-1">{path.split('/').pop()}</span>
      <span className="text-[10px] opacity-40 truncate flex-1 text-right">{path.split('/').slice(0, -1).join('/')}</span>
      <span className={`text-[10px] font-bold w-4 text-center ${colorMap[status]}`}>
        {status === 'modified' ? 'M' : status === 'staged' ? 'S' : status === 'untracked' ? 'U' : 'D'}
      </span>
    </div>
  )
}
