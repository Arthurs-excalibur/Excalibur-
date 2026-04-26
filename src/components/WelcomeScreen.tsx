import React, { useEffect } from 'react'
import { useAppStore } from '../store/useAppStore'

const WorkspaceItem: React.FC<{ name: string; path: string; onClick: () => void; isLast?: boolean }> = ({ name, path, onClick, isLast }) => (
  <button
    onClick={onClick}
    className={`w-full flex flex-col items-start px-4 py-3 hover:bg-[#2a2d2e] transition-colors group cursor-pointer ${!isLast ? 'border-b border-[#2b2d31]' : ''}`}
  >
    <span className="text-[13px] text-gray-200 group-hover:text-white transition-colors mb-0.5">{name}</span>
    <span className="text-[11px] text-gray-500 truncate w-full text-left">{path}</span>
  </button>
)

export const WelcomeScreen: React.FC = () => {
  const { openProject, recentWorkspaces, loadRecentWorkspaces, setIsAgentManagerOpen } = useAppStore()
  const [isCloneOpen, setIsCloneOpen] = React.useState(false)

  useEffect(() => {
    loadRecentWorkspaces()
  }, [])

  const handleOpenFolder = async () => {
    const path = await window.electron.invoke('window:open-directory')
    if (path) await openProject(path)
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#1e1e1e] overflow-auto h-full" onClick={() => setIsCloneOpen(false)}>
      <div className="w-full max-w-[420px] flex flex-col items-center">
        
        {/* Excalibur Logo */}
        <div className="flex flex-col items-center mb-8 mt-[-40px]">
          <img 
            src="/Logo/excalibur-nobg.png" 
            alt="Excalibur Logo" 
            className="h-[180px] object-contain select-none drop-shadow-2xl" 
          />
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-3 mb-10 px-4">
          <button
            onClick={handleOpenFolder}
            className="w-full py-2.5 rounded-[4px] bg-[#0078d4] hover:bg-[#026ec1] text-white text-[13px] font-medium flex items-center justify-center gap-2.5 transition-colors shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"></path>
            </svg>
            Open Folder
          </button>

          <div className="flex gap-3">
            <button 
                onClick={() => setIsAgentManagerOpen(true)}
                className="flex-1 py-2 rounded-[4px] bg-[#313131] hover:bg-[#3c3c3c] text-[#cccccc] text-[13px] flex items-center justify-center transition-colors"
            >
              Open Agent Manager
            </button>
            <button 
                onClick={(e) => { e.stopPropagation(); setIsCloneOpen(!isCloneOpen) }}
                className="flex-1 py-2 rounded-[4px] bg-[#313131] hover:bg-[#3c3c3c] text-[#cccccc] text-[13px] flex items-center justify-center gap-2 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
              </svg>
              Clone Repository
            </button>
          </div>
        </div>

        {/* Workspaces List */}
        {recentWorkspaces.length > 0 && (
          <div className="w-full flex flex-col gap-3 px-4">
            <h2 className="text-[13px] text-[#cccccc] px-1 font-medium">Workspaces</h2>
            <div className="flex flex-col w-full border border-[#2b2d31] rounded-[6px] overflow-hidden bg-[#1e1e1e]">
              {recentWorkspaces.map((r, i) => (
                <WorkspaceItem 
                  key={i} 
                  name={r.name} 
                  path={r.path} 
                  onClick={() => openProject(r.path)} 
                  isLast={i === recentWorkspaces.length - 1} 
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
