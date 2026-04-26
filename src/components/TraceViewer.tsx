import React from 'react'
import { useAppStore } from '../store/useAppStore'
import { formatTime } from '../lib/utils'
import type { SystemEvent } from '../types'

const HistoryItem: React.FC<{ event: SystemEvent }> = ({ event }) => {
  const [expanded, setExpanded] = React.useState(false)
  
  return (
    <div className="border-b border-border-subtle bg-surface-base hover:bg-surface-overlay transition-colors">
      <div 
        className="flex items-center gap-3 px-4 py-2.5 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="text-[10px] text-text-muted font-mono">{formatTime(event.timestamp)}</span>
        <span className="flex-1 text-xs font-medium truncate">{event.message}</span>
        <div className={`w-1.5 h-1.5 rounded-full ${
          event.level === 'error' ? 'bg-accent-red' : 
          event.level === 'success' ? 'bg-accent-green' : 
          'bg-accent-purple'
        }`} />
      </div>
      {expanded && event.detail && (
        <div className="px-4 pb-3 animate-fade-in">
          <pre className="p-3 rounded bg-surface-raised text-[10px] font-mono text-text-secondary whitespace-pre-wrap border border-border-subtle">
            {event.detail}
          </pre>
        </div>
      )}
    </div>
  )
}

export const TraceViewer: React.FC = () => {
  const { events, clearEvents } = useAppStore()

  return (
    <div className="flex flex-col h-full bg-surface-raised overflow-hidden">
      {/* Header */}
      <div className="panel-header flex-shrink-0">
        <span className="panel-title">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="text-text-muted">
            <path d="M2 4h12M2 8h8M2 12h10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          Event History
        </span>
        <button
          onClick={clearEvents}
          className="text-[10px] font-bold text-text-muted hover:text-text-primary uppercase"
        >
          Clear
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full opacity-20 italic text-xs">
            No history recorded.
          </div>
        ) : (
          events.map(event => <HistoryItem key={event.id} event={event} />)
        )}
      </div>
    </div>
  )
}
