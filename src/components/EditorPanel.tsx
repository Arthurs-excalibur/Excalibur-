import React, { useCallback, useRef, useEffect } from 'react'
import Editor, { OnMount, OnChange } from '@monaco-editor/react'
import { useAppStore } from '../store/useAppStore'
import type { EditorTab } from '../types'

// ─── Monaco theme definition ──────────────────────────────────────────────────

const defineExcaliburTheme = (monaco: Parameters<OnMount>[1]) => {
  monaco.editor.defineTheme('excalibur', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment',        foreground: '4a5568', fontStyle: 'italic' },
      { token: 'keyword',        foreground: '7c6af7', fontStyle: 'bold'   },
      { token: 'string',         foreground: '34d399'                      },
      { token: 'number',         foreground: 'fb923c'                      },
      { token: 'type',           foreground: '38d9f5'                      },
      { token: 'function',       foreground: '4f8ef7'                      },
      { token: 'variable',       foreground: 'e8eaf2'                      },
      { token: 'operator',       foreground: 'e879f9'                      },
      { token: 'delimiter',      foreground: '8892b0'                      },
      { token: 'tag',            foreground: '7c6af7'                      },
      { token: 'attribute.name', foreground: '38d9f5'                      },
      { token: 'attribute.value',foreground: '34d399'                      },
    ],
    colors: {
      'editor.background':              '#030303',
      'editor.foreground':              '#ffffff',
      'editorLineNumber.foreground':    '#262626',
      'editorLineNumber.activeForeground': '#a855f7',
      'editor.lineHighlightBackground': '#080808',
      'editor.selectionBackground':     '#a855f730',
      'editor.inactiveSelectionBackground': '#a855f710',
      'editorCursor.foreground':        '#a855f7',
      'editorWidget.background':        '#0c0c0c',
      'editorSuggestWidget.background': '#0c0c0c',
      'editorSuggestWidget.border':     'rgba(255,255,255,0.06)',
      'editorSuggestWidget.selectedBackground': '#111111',
      'list.hoverBackground':           '#111111',
      'list.activeSelectionBackground': '#a855f720',
      'editorGutter.background':        '#030303',
      'scrollbarSlider.background':     'rgba(255,255,255,0.03)',
      'scrollbarSlider.hoverBackground':'rgba(255,255,255,0.08)',
      'editor.findMatchBackground':     '#a855f740',
      'editor.findMatchHighlightBackground': '#a855f720',
      'editorIndentGuide.background1': '#111111',
      'editorIndentGuide.activeBackground1': '#262626',
    },
  })
}

// ─── Tab bar ──────────────────────────────────────────────────────────────────

const TabBar: React.FC = () => {
  const { openTabs, activeTab, setActiveTab, closeTab } = useAppStore()

  return (
    <div className="minimal-tab-bar">
      {openTabs.map((tab) => {
        const hasDiff = useAppStore.getState().diffs.some(d => d.file === tab.path)
        const isActive = activeTab === tab.path

        return (
          <div
            key={tab.path}
            className={`group minimal-tab ${isActive ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.path)}
          >
            <FileTabIcon name={tab.name} />
            <span className="truncate">{tab.name}</span>
            {hasDiff && (
              <div className="w-1.5 h-1.5 rounded-full bg-accent-purple shadow-glow-purple" />
            )}
            <button
               onClick={(e) => { e.stopPropagation(); closeTab(tab.path) }}
               className="ml-1 opacity-0 group-hover:opacity-60 hover:text-text-primary transition-all"
            >
              <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        )
      })}
    </div>
  )
}

const FileTabIcon: React.FC<{ name: string }> = ({ name }) => {
  const ext = name.split('.').pop()?.toLowerCase()
  const colors: Record<string, string> = {
    tsx: '#38d9f5', ts: '#4f8ef7', jsx: '#fb923c', js: '#fbbf24',
    css: '#e879f9', json: '#fbbf24', md: '#94a3b8',
  }
  const color = colors[ext ?? ''] ?? '#8892b0'
  return (
    <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: color, opacity: 0.8 }} />
  )
}

// ─── Breadcrumb ───────────────────────────────────────────────────────────────

const Breadcrumb: React.FC<{ path: string }> = ({ path }) => {
  const parts = path.split(/[/\\]/).filter(Boolean)
  return (
    <div className="flex items-center gap-1.5 px-6 py-2 bg-surface-base border-b border-border-subtle/30 text-[10px] text-text-muted font-medium">
      {parts.map((part, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="opacity-20">/</span>}
          <span className={i === parts.length - 1 ? 'text-text-secondary' : 'hover:text-text-secondary cursor-pointer transition-colors'}>
            {part}
          </span>
        </React.Fragment>
      ))}
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

const EmptyEditor: React.FC = () => (
  <div className="flex-1 flex flex-col items-center justify-center text-center gap-6 bg-surface-raised select-none">
    <div className="flex flex-col items-center gap-3">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="opacity-20">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8L14 2z" stroke="#7c6af7" strokeWidth="1.5" fill="none"/>
        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="#7c6af7" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
      <div>
        <p className="text-sm font-medium text-text-muted">No file open</p>
        <p className="text-xs text-text-muted mt-1">Select a file from the explorer or ask the agent to create one</p>
      </div>
    </div>
    <div className="flex flex-col gap-2 text-xs text-text-muted">
      <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-surface-overlay border border-border-subtle">
        <kbd className="kbd">Ctrl+P</kbd>
        <span>Quick open file</span>
      </div>
      <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-surface-overlay border border-border-subtle">
        <kbd className="kbd">Ctrl+`</kbd>
        <span>Toggle terminal</span>
      </div>
    </div>
  </div>
)

// ─── Inline Command Palette ──────────────────────────────────────────────────

const InlineCommandPalette: React.FC = () => {
  const { 
    inlineAction, closeInlineAction, setInlineInstruction, 
    addEvent, updateTabContent 
  } = useAppStore()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (inlineAction.isOpen) {
      inputRef.current?.focus()
    }
  }, [inlineAction.isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const { selection } = inlineAction
    if (!selection) return

    // Deterministic edit for now: wrap in comment
    const modifiedContent = `/* Transformation Applied */\n${selection.text}\n/* End Transformation */`
    
    addEvent('DIFF_APPLIED', `Applied transformation to selection`, useAppStore.getState().activeTab || 'buffer', 'success')
    
    updateTabContent(useAppStore.getState().activeTab || '', modifiedContent)
    closeInlineAction()
  }

  if (!inlineAction.isOpen || !inlineAction.position) return null

  return (
    // ANTI-GRAVITY FIX APPLIED
    <div
      className="fixed z-[100] w-[400px] glass-panel rounded-xl shadow-2xl animate-slide-up overflow-hidden"
      style={{
        left: inlineAction.position.x,
        top: inlineAction.position.y + 24,
      }}
    >
      <div className="flex items-center gap-2 px-4 py-2 bg-accent-purple/5 border-b border-border-subtle">
        <div className="w-1.5 h-1.5 rounded-full bg-accent-purple animate-pulse shadow-glow-purple" />
        <span className="text-[10px] font-bold text-accent-purple uppercase tracking-widest">Transform</span>
      </div>
      <form onSubmit={handleSubmit} className="p-2">
        <input
          ref={inputRef}
          type="text"
          value={inlineAction.instruction}
          onChange={(e) => setInlineInstruction(e.target.value)}
          onKeyDown={(e) => e.key === 'Escape' && closeInlineAction()}
          placeholder="What should I do with this code?"
          className="w-full bg-surface-base border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-purple/50 transition-all placeholder:text-text-muted transition-all"
        />
        <div className="flex items-center justify-between mt-2 px-1">
          <span className="text-[10px] text-text-muted">Selection: {inlineAction.selection?.text.length} chars</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={closeInlineAction}
              className="px-2 py-1 rounded text-[10px] font-medium text-text-muted hover:text-text-primary transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1 rounded-md bg-accent-purple text-surface-base text-[10px] font-bold hover:shadow-glow-purple transition-all"
            >
              Apply
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

// ─── Editor status bar ────────────────────────────────────────────────────────

const StatusBar: React.FC<{ tab: EditorTab | null }> = ({ tab }) => (
  <div className="flex-shrink-0 flex items-center justify-between px-3 py-0.5 bg-surface-base border-t border-border-subtle text-xs text-text-muted">
    <div className="flex items-center gap-4">
      {tab && (
        <>
          <span className="text-accent-purple/80">{tab.language}</span>
          <span>UTF-8</span>
          <span>LF</span>
        </>
      )}
    </div>
    <div className="flex items-center gap-4">
      <span>Spaces: 2</span>
      {tab && <span className="capitalize">{tab.language}</span>}
      <div className="flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-accent-green" />
        <span>Ready</span>
      </div>
    </div>
  </div>
)

// ─── Editor Panel ─────────────────────────────────────────────────────────────

export const EditorPanel: React.FC = () => {
  const { openTabs, activeTab, updateTabContent, mode } = useAppStore()
  const monacoRef = useRef<any>(null)
  const editorRef = useRef<any>(null)

  const activeTabData = openTabs.find((t) => t.path === activeTab) ?? null

  const handleMount: OnMount = useCallback((editor, monaco) => {
    monacoRef.current = monaco
    editorRef.current = editor
    defineExcaliburTheme(monaco)
    monaco.editor.setTheme('excalibur')

    // Cmd + S support
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      const activeTab = useAppStore.getState().activeTab
      if (activeTab) {
        useAppStore.getState().saveTab(activeTab)
      }
    })

    // Cmd + K support
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK, () => {
      const selection = editor.getSelection()
      if (!selection || selection.isEmpty()) return

      const text = editor.getModel()?.getValueInRange(selection) || ''
      const coords = editor.getScrolledVisiblePosition(selection.getStartPosition())
      
      const domNode = editor.getDomNode()
      if (!domNode) return
      
      const rect = domNode.getBoundingClientRect()
      const x = rect.left + coords!.left
      const y = rect.top + coords!.top

      useAppStore.getState().openInlineAction(
        { x, y },
        {
          text,
          range: {
            startLine: selection.startLineNumber,
            startCol: selection.startColumn,
            endLine: selection.endLineNumber,
            endCol: selection.endColumn
          }
        }
      )
    })

    // Update selection context in store
    editor.onDidChangeCursorSelection((e) => {
      const selection = e.selection
      if (selection.isEmpty()) {
        useAppStore.getState().setSelection(null)
      } else {
        const text = editor.getModel()?.getValueInRange(selection) || ''
        useAppStore.getState().setSelection({
          text,
          range: {
            startLine: selection.startLineNumber,
            startCol: selection.startColumn,
            endLine: selection.endLineNumber,
            endCol: selection.endColumn
          }
        })
      }
    })

    // Configure TypeScript/JS language defaults 
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
      diagnosticCodesToIgnore: [2307, 2304, 2322, 2339], // ignore module-not-found & common demo errors
    })
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.CommonJS,
      jsx: monaco.languages.typescript.JsxEmit.React,
      allowJs: true,
      checkJs: false,
    })

    // Editor options
    editor.updateOptions({
      fontSize: 13,
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      fontLigatures: true,
      lineHeight: 22,
      letterSpacing: 0.3,
      minimap: { enabled: true, scale: 1, renderCharacters: false, maxColumn: 80 },
      padding: { top: 16, bottom: 16 },
      scrollBeyondLastLine: false,
      renderWhitespace: 'none',
      smoothScrolling: true,
      cursorBlinking: 'smooth',
      cursorSmoothCaretAnimation: 'on',
      bracketPairColorization: { enabled: true },
      guides: { bracketPairs: true, indentation: true },
      formatOnPaste: true,
      tabSize: 2,
      renderLineHighlight: 'all',
      overviewRulerBorder: false,
      hideCursorInOverviewRuler: true,
      scrollbar: {
        verticalScrollbarSize: 6,
        horizontalScrollbarSize: 6,
        useShadows: false,
      },
    })
  }, [])

  const handleChange: OnChange = useCallback(
    (value) => {
      if (activeTab && value !== undefined) {
        updateTabContent(activeTab, value)
      }
    },
    [activeTab, updateTabContent]
  )

  const isReadOnly = mode === 'autonomous'

  // Jump to line logic
  React.useEffect(() => {
    if (editorRef.current && activeTabData?.activeLine) {
      editorRef.current.revealLineInCenter(activeTabData.activeLine)
      editorRef.current.setPosition({ lineNumber: activeTabData.activeLine, column: 1 })
      editorRef.current.focus()
    }
  }, [activeTabData?.activeLine, activeTabData?.path])

  return (
    <div className="flex flex-col h-full bg-surface-raised overflow-hidden">
      <TabBar />
      <InlineCommandPalette />
      {activeTabData ? (
        <>
          <Breadcrumb path={activeTabData.path} />
          {isReadOnly && (
            <div className="flex items-center gap-2 px-4 py-1.5 bg-accent-red/10 border-b border-accent-red/20 flex-shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-accent-red animate-pulse" />
              <span className="text-xs text-accent-red">Read-only during Autonomous mode — AI is in control</span>
            </div>
          )}
          <div className="flex-1 overflow-hidden">
            <Editor
              key={activeTabData.path}
              path={activeTabData.path}
              value={activeTabData.content}
              language={activeTabData.language}
              theme="excalibur"
              onMount={handleMount}
              onChange={handleChange}
              options={{
                readOnly: isReadOnly,
                domReadOnly: isReadOnly,
              }}
              loading={
                <div className="flex items-center justify-center h-full bg-surface-raised">
                  <div className="flex items-center gap-2 text-xs text-text-muted">
                    <div className="w-4 h-4 border-2 border-accent-purple/40 border-t-accent-purple rounded-full animate-spin" />
                    Loading editor…
                  </div>
                </div>
              }
            />
          </div>
          <StatusBar tab={activeTabData} />
        </>
      ) : (
        <EmptyEditor />
      )}
    </div>
  )
}
