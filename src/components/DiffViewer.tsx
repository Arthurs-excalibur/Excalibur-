import React from 'react'
import { DiffEditor } from '@monaco-editor/react'
import { useAppStore } from '../store/useAppStore'
import { formatTime } from '../lib/utils'
import type { DiffEntry } from '../types'

const DiffHunk: React.FC<{ diff: DiffEntry }> = ({ diff }) => {
  const { removeDiff, applyDiff } = useAppStore()

  return (
    <div className="rounded-lg border border-border-subtle overflow-hidden mb-4 animate-slide-up flex flex-col" style={{ height: '400px' }}>
      {/* File header */}
      <div className="flex items-center justify-between px-3 py-2 bg-surface-overlay border-b border-border-subtle flex-shrink-0">
        <div className="flex items-center gap-2">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path d="M13 4L9 4M13 8H5M13 12H7" stroke="#38d9f5" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          <span className="text-xs font-mono text-accent-cyan">{diff.file}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">{formatTime(diff.timestamp)}</span>
          <button
            onClick={() => removeDiff(diff.id)}
            className="text-xs text-text-muted hover:text-text-primary transition-colors"
            title="Dismiss diff"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Monaco Diff Editor */}
      <div className="flex-1 min-h-0 bg-[#0f1117]">
        <DiffEditor
          original={diff.before}
          modified={diff.after}
          language="typescript"
          theme="excalibur"
          options={{
            renderSideBySide: true,
            readOnly: true,
            fontSize: 12,
            lineNumbers: 'on',
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            originalEditable: false,
            automaticLayout: true,
            scrollbar: {
              verticalScrollbarSize: 4,
              horizontalScrollbarSize: 4
            }
          }}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 px-3 py-2 bg-surface-overlay border-t border-border-subtle flex-shrink-0">
        <button 
          onClick={() => applyDiff(diff.id)}
          className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium bg-accent-green/15 text-accent-green border border-accent-green/30 hover:bg-accent-green/25 transition-all"
        >
          ✓ Accept Changes
        </button>
        <button
          onClick={() => removeDiff(diff.id)}
          className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium bg-accent-red/10 text-accent-red border border-accent-red/20 hover:bg-accent-red/20 transition-all"
        >
          ✕ Reject
        </button>
      </div>
    </div>
  )
}

export const DiffViewer: React.FC = () => {
  const { diffs } = useAppStore()

  return (
    <div className="flex flex-col h-full bg-surface-raised overflow-hidden">
      {/* Header */}
      <div className="panel-header flex-shrink-0">
        <span className="panel-title">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="text-text-muted">
            <path d="M2 3h5v10H2zM9 3h5v10H9z" stroke="currentColor" strokeWidth="1.2" fill="none"/>
            <path d="M7 8h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          Review Pending Edits
          {diffs.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-accent-purple/10 text-accent-purple text-[10px] font-bold">
              {diffs.length}
            </span>
          )}
        </span>
      </div>

      {/* Diffs list */}
      <div className="flex-1 overflow-y-auto p-4">
        {diffs.length === 0 ? (
          <EmptyDiff />
        ) : (
          diffs.map((diff) => <DiffHunk key={diff.id} diff={diff} />)
        )}
      </div>
    </div>
  )
}

const EmptyDiff: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-full gap-4 text-center opacity-30">
    <div className="w-16 h-16 rounded-3xl border-2 border-dashed border-text-muted flex items-center justify-center text-3xl">
      ±
    </div>
    <div>
      <p className="text-xs font-bold uppercase tracking-widest">No pending changes</p>
      <p className="text-[10px] mt-2 max-w-[200px]">Proposed edits from the agent will appear here for your review and approval.</p>
    </div>
  </div>
)
