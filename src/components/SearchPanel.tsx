import React, { useState } from 'react'
import { useAppStore } from '../store/useAppStore'

export const SearchPanel: React.FC = () => {
  const { searchResults, runGlobalSearch, openTab, setActiveFile, currentProjectPath } = useAppStore()
  const [query, setQuery] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    runGlobalSearch(query)
  }

  const handleResultClick = (filePath: string) => {
    setActiveFile(filePath)
    openTab(filePath)
  }

  return (
    <div className="flex flex-col h-full bg-surface-raised overflow-hidden">
      <div className="panel-header flex-shrink-0">
        <span className="panel-title">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="text-text-muted">
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          Global Search
        </span>
      </div>

      <div className="p-4 border-b border-border-subtle bg-surface-base">
        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            className="w-full pl-3 pr-8 py-2 text-xs rounded-lg bg-surface-overlay border border-border-subtle focus:border-accent-purple/50 outline-none transition-all placeholder:text-text-muted"
            placeholder="Search code patterns..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <button 
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-accent-purple transition-colors"
          >
            ⏎
          </button>
        </form>
        {searchResults.length > 0 && (
          <p className="text-[10px] text-text-muted mt-2 uppercase tracking-widest font-bold">
            {searchResults.length} matches found
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {searchResults.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full opacity-30 text-center p-8">
            <div className="w-16 h-16 rounded-3xl border-2 border-dashed border-text-muted flex items-center justify-center text-3xl mb-4">
              🔍
            </div>
            <p className="text-xs font-medium">Search for text, functions, or variables across your entire codebase.</p>
          </div>
        ) : (
          <div className="divide-y divide-border-subtle/30">
            {searchResults.map((res, i) => (
              <div 
                key={i} 
                onClick={() => handleResultClick(res.path)}
                className="group p-3 cursor-pointer hover:bg-accent-purple/5 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono text-accent-cyan truncate">
                    {currentProjectPath ? res.path.replace(currentProjectPath, '').replace(/^\//, '') : res.path}
                  </span>
                  <span className="text-[10px] text-text-muted">L{res.line}</span>
                </div>
                <p className="text-xs font-mono text-text-secondary line-clamp-2 truncate group-hover:text-text-primary transition-colors">
                  {res.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
