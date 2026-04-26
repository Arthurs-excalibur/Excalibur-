import React, { useState, useCallback } from 'react'
import { useAppStore } from '../store/useAppStore'
import { getFileIconColor, getLanguage } from '../lib/utils'
import type { FileNode } from '../types'

// ─── File icon SVG ────────────────────────────────────────────────────────────

const FileIcon: React.FC<{ ext?: string; isFolder?: boolean; isOpen?: boolean }> = ({
  ext, isFolder, isOpen,
}) => {
  if (isFolder) {
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        {isOpen ? (
          <path d="M1 3.5C1 2.67 1.67 2 2.5 2H6l1.5 1.5H13.5C14.33 3.5 15 4.17 15 5v7.5C15 13.33 14.33 14 13.5 14h-11C1.67 14 1 13.33 1 12.5V3.5z" fill="#fbbf24" opacity="0.9"/>
        ) : (
          <path d="M1 3.5C1 2.67 1.67 2 2.5 2H6l1.5 2H13.5C14.33 4 15 4.67 15 5.5V12.5C15 13.33 14.33 14 13.5 14h-11C1.67 14 1 13.33 1 12.5V3.5z" fill="#fbbf24" opacity="0.7"/>
        )}
      </svg>
    )
  }
  const color = getFileIconColor(ext)
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="1" width="10" height="13" rx="1.5" fill={color} opacity="0.15"/>
      <rect x="2" y="1" width="10" height="13" rx="1.5" stroke={color} strokeWidth="1"/>
      <path d="M9 1v4h4" stroke={color} strokeWidth="0.75" fill="none"/>
      <path d="M4.5 8h5M4.5 10.5h3.5" stroke={color} strokeWidth="0.75" strokeLinecap="round"/>
    </svg>
  )
}

// ─── Context menu ─────────────────────────────────────────────────────────────

interface CtxMenu { x: number; y: number; node: FileNode }

const ContextMenu: React.FC<{ menu: CtxMenu; onClose: () => void }> = ({ menu, onClose }) => {
  const { deleteFile, openTab, createFile } = useAppStore()

  const actions = menu.node.type === 'folder'
    ? [
        { label: 'New File', icon: '＋', action: () => {
          const name = prompt('File name:')
          if (name) createFile(`${menu.node.path}/${name}`, 'file')
        } },
        { label: 'New Folder', icon: '📁', action: () => {
          const name = prompt('Folder name:')
          if (name) createFile(`${menu.node.path}/${name}`, 'folder')
        } },
        { label: 'Rename', icon: '✎', action: () => {} },
        null,
        { label: 'Delete', icon: '🗑', action: () => { deleteFile(menu.node.path); onClose() }, danger: true },
      ]
    : [
        { label: 'Open', icon: '↗', action: () => { openTab(menu.node.path); onClose() } },
        { label: 'Rename', icon: '✎', action: () => {} },
        { label: 'Copy Path', icon: '⧉', action: () => { navigator.clipboard.writeText(menu.node.path); onClose() } },
        null,
        { label: 'Delete', icon: '🗑', action: () => { deleteFile(menu.node.path); onClose() }, danger: true },
      ]

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 w-40 py-1 rounded-lg bg-surface-float border border-border-default shadow-float animate-fade-in"
        style={{ left: menu.x, top: menu.y }}
      >
        {actions.map((a, i) =>
          a === null ? (
            <div key={i} className="my-1 border-t border-border-subtle" />
          ) : (
            <button
              key={a.label}
              onClick={() => { a.action(); onClose() }}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left transition-colors duration-100 hover:bg-surface-overlay ${
                'danger' in a && a.danger ? 'text-accent-red' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <span className="opacity-60">{a.icon}</span>
              {a.label}
            </button>
          )
        )}
      </div>
    </>
  )
}

// ─── Tree node ────────────────────────────────────────────────────────────────

const TreeNode: React.FC<{
  node: FileNode
  depth: number
  onCtxMenu: (e: React.MouseEvent, node: FileNode) => void
}> = ({ node, depth, onCtxMenu }) => {
  const { expandedFolders, activeFile, toggleFolder, setActiveFile, openTab } = useAppStore()
  const isExpanded = expandedFolders.has(node.path)
  const isActive = activeFile === node.path

  const handleClick = () => {
    if (node.type === 'folder') {
      toggleFolder(node.path)
    } else {
      setActiveFile(node.path)
      openTab(node.path)
    }
  }

  return (
    <div>
      <div
        onClick={handleClick}
        onContextMenu={(e) => { e.preventDefault(); onCtxMenu(e, node) }}
        className={`group flex items-center gap-1.5 py-0.5 px-2 cursor-pointer select-none transition-colors duration-100 ${
          isActive
            ? 'bg-accent-purple/10 text-text-primary'
            : 'text-text-secondary hover:bg-surface-float hover:text-text-primary'
        }`}
        style={{ paddingLeft: 8 + depth * 12 }}
      >
        {/* Expand chevron for folders */}
        {node.type === 'folder' ? (
          <svg
            width="10" height="10" viewBox="0 0 10 10" fill="none"
            className={`flex-shrink-0 transition-transform duration-150 text-text-muted ${isExpanded ? 'rotate-90' : ''}`}
          >
            <path d="M3 2l4 3-4 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : (
          <span className="w-2.5 flex-shrink-0" />
        )}

        <FileIcon ext={node.extension} isFolder={node.type === 'folder'} isOpen={isExpanded} />

        <span className="text-xs truncate flex-1">{node.name}</span>

        {/* Modified indicator */}
        {node.recentlyModified && node.type === 'file' && (
          <div className="w-1.5 h-1.5 rounded-full bg-accent-purple flex-shrink-0" title="Recently modified by AI" />
        )}

        {/* Modified dot (unsaved) */}
        {node.modified && (
          <div className="w-1.5 h-1.5 rounded-full bg-accent-orange flex-shrink-0" />
        )}
      </div>

      {/* Children */}
      {node.type === 'folder' && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <TreeNode key={child.id} node={child} depth={depth + 1} onCtxMenu={onCtxMenu} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── File Explorer ────────────────────────────────────────────────────────────

export const FileExplorer: React.FC = () => {
  const { files, refreshFiles, createFile } = useAppStore()
  const [ctxMenu, setCtxMenu] = useState<CtxMenu | null>(null)
  const [search, setSearch] = useState('')

  React.useEffect(() => {
    refreshFiles()
  }, [])

  const handleCtxMenu = useCallback((e: React.MouseEvent, node: FileNode) => {
    setCtxMenu({ x: e.clientX, y: e.clientY, node })
  }, [])

  const filteredFiles = search.trim()
    ? flattenFiles(files).filter((f) => f.name.toLowerCase().includes(search.toLowerCase()))
    : null

  return (
    <div className="flex flex-col h-full bg-[#030303] select-none border-r border-white/5 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-white/5">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">Workspace</span>
        <div className="flex items-center gap-1">
          <button className="p-1 rounded-md hover:bg-surface-raised text-text-muted transition-colors" title="Settings">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
               <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <div className="relative group">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface-raised border border-white/5 rounded-lg pl-8 pr-3 py-1.5 text-[11px] text-text-primary placeholder:text-text-muted focus:border-accent-purple/30 transition-all outline-none shadow-inner"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-accent-purple transition-colors" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
        </div>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto pt-2">
        {filteredFiles ? (
          filteredFiles.map((f) => (
            <FlatFileRow key={f.id} node={f} onCtxMenu={handleCtxMenu} />
          ))
        ) : (
          files.map((node) => (
            <TreeNode key={node.id} node={node} depth={0} onCtxMenu={handleCtxMenu} />
          ))
        )}
      </div>

      {/* Context menu */}
      {ctxMenu && (
        <ContextMenu menu={ctxMenu} onClose={() => setCtxMenu(null)} />
      )}
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function flattenFiles(nodes: FileNode[]): FileNode[] {
  return nodes.flatMap((n) =>
    n.type === 'file' ? [n] : flattenFiles(n.children ?? [])
  )
}

const FlatFileRow: React.FC<{
  node: FileNode
  onCtxMenu: (e: React.MouseEvent, node: FileNode) => void
}> = ({ node, onCtxMenu }) => {
  const { activeFile, setActiveFile, openTab } = useAppStore()
  const isActive = activeFile === node.path
  return (
    <div
      onClick={() => {
        setActiveFile(node.path)
        openTab(node.path)
      }}
      onContextMenu={(e) => { e.preventDefault(); onCtxMenu(e, node) }}
      className={`flex items-center gap-2 px-3 py-1 cursor-pointer select-none transition-colors duration-100 ${
        isActive ? 'bg-accent-purple/10 text-text-primary' : 'text-text-secondary hover:bg-surface-float hover:text-text-primary'
      }`}
    >
      <FileIcon ext={node.extension} />
      <span className="text-xs truncate">{node.name}</span>
      <span className="text-xs text-text-muted ml-auto truncate opacity-60">{node.path}</span>
    </div>
  )
}

const HeaderBtn: React.FC<{ title: string; icon: string; onClick?: () => void }> = ({ title, icon, onClick }) => (
  <button
    title={title}
    onClick={onClick}
    className="w-6 h-6 flex items-center justify-center rounded text-text-muted hover:text-text-primary hover:bg-surface-float transition-all text-xs"
  >
    {icon}
  </button>
)
