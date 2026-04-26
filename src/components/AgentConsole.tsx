import React, { useState, useEffect, useRef } from 'react'
import { useAppStore } from '../store/useAppStore'
import { formatTime } from '../lib/utils'
import { useAutoScroll } from '../hooks/useResize'
import type { SystemEvent } from '../types'

// ─── Sub-Components ─────────────────────────────────────────────────────────────

const LogItem: React.FC<{ event: SystemEvent }> = ({ event }) => {
  const levelColors = {
    info:    'text-text-muted',
    success: 'text-accent-green',
    warning: 'text-accent-orange',
    error:   'text-accent-red',
  }

  return (
    <div className="flex gap-2 text-[10px] font-mono leading-tight py-0.5 border-l border-white/5 pl-2 ml-1">
      <span className="opacity-30 flex-shrink-0">{formatTime(event.timestamp).split(' ')[0]}</span>
      <span className={`uppercase font-bold tracking-tighter w-12 flex-shrink-0 ${levelColors[event.level]}`}>
        {event.type.slice(0, 8)}
      </span>
      <span className="text-text-secondary truncate">{event.message}</span>
    </div>
  )
}

const ThinkingAccordion: React.FC<{ events: SystemEvent[]; isFinished: boolean }> = ({ events, isFinished }) => {
  const [isOpen, setIsOpen] = useState(false)
  if (events.length === 0) return null

  // Calculate "Worked for Xm"
  const start = events[events.length - 1].timestamp
  const end = isFinished ? events[0].timestamp : Date.now()
  const diff = Math.max(0, end - start)
  const seconds = Math.floor(diff / 1000)
  const timeStr = seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${seconds % 60}s`

  return (
    <div className="my-3 overflow-hidden rounded-lg border border-white/5 bg-black/20">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-text-muted hover:bg-white/5 transition-all"
      >
        <div className="flex items-center gap-2">
          <div className={`h-1.5 w-1.5 rounded-full ${isFinished ? 'bg-accent-green' : 'bg-accent-purple animate-pulse shadow-glow-purple'}`} />
          <span>{isFinished ? 'Task Record' : 'Thinking Process'}</span>
          <span className="opacity-40 italic ml-2 transform-none font-medium lowercase tracking-normal">({timeStr})</span>
        </div>
        <svg 
          width="10" height="10" viewBox="0 0 16 16" fill="none" 
          className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {isOpen && (
        <div className="max-h-[200px] overflow-y-auto px-2 py-2 bg-black/40 border-t border-white/5 custom-scrollbar">
          {events.slice().reverse().map(e => <LogItem key={e.id} event={e} />)}
        </div>
      )}
    </div>
  )
}

const AssistantMessage: React.FC<{ text: string; events: SystemEvent[]; isStreaming: boolean }> = ({ text, events, isStreaming }) => {
  // Extract file mentions for the "Files Modified" section
  const modifiedFiles = Array.from(new Set(events.filter(e => e.type.includes('FILE_')).map(e => e.detail).filter(Boolean))) as string[]

  return (
    <div className="flex flex-col gap-1 w-full animate-in fade-in slide-in-from-left-2 duration-500">
      <div className="flex items-center gap-2 mb-1 px-1">
        <div className="w-5 h-5 rounded-lg bg-accent-purple flex items-center justify-center text-[10px] shadow-glow-purple">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-white">
             <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-primary">Excalibur</span>
      </div>

      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-accent-purple/10 to-transparent rounded-2xl blur opacity-30" />
        <div className="relative p-4 rounded-2xl bg-surface-raised border border-white/10 shadow-2xl overflow-hidden min-h-[40px]">
          <ThinkingAccordion events={events} isFinished={!isStreaming} />
          
          <div className="text-xs leading-relaxed text-text-secondary whitespace-pre-wrap font-medium">
            {text || (isStreaming ? "Thinking..." : "Task details processed.")}
            {isStreaming && <span className="inline-block w-1 h-3 bg-accent-purple ml-1 animate-pulse" />}
          </div>

          {modifiedFiles.length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/5">
              <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest mb-2 block px-1">Files Modified</span>
              <div className="flex flex-wrap gap-1.5">
                {modifiedFiles.map(path => (
                  <div key={path} className="flex items-center gap-1.5 py-1 px-2.5 rounded-md bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer group/file">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent-purple" />
                    <span className="text-[10px] text-text-secondary group-hover/file:text-text-primary transition-colors">{path.split('/').pop()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const UserMessage: React.FC<{ text: string }> = ({ text }) => (
  <div className="flex flex-col items-end gap-1 w-full animate-in fade-in slide-in-from-right-2 duration-300">
    <div className="max-w-[85%] p-3 rounded-2xl bg-accent-purple/10 border border-accent-purple/20 shadow-lg">
      <p className="text-xs text-text-primary font-medium leading-relaxed">{text}</p>
    </div>
    <span className="text-[9px] font-bold text-text-muted uppercase tracking-tighter mr-2">You</span>
  </div>
)

// ─── Main Panel ────────────────────────────────────────────────────────────────

export const AgentConsole: React.FC = () => {
  const { 
    events, clearEvents, runAITask, streamingBuffer, 
    currentIntent, chatHistory, addChatMessage 
  } = useAppStore()
  
  const scrollRef = useAutoScroll([events, streamingBuffer, chatHistory], true)
  const [input, setInput] = useState('')
  const [isFastMode, setIsFastMode] = useState(true)

  const handleSendMessage = () => {
    if (!input.trim()) return
    const task = input.trim()
    addChatMessage('user', task)
    runAITask(task)
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#030303] overflow-hidden selection:bg-accent-purple/30">
      {/* Header - Pixel Detail */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#050505]/80 backdrop-blur-xl z-20">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-xs font-black uppercase tracking-[0.3em] text-text-primary flex items-center gap-2">
            Agent Console
            <div className="h-1 w-1 rounded-full bg-accent-purple shadow-glow-purple group-hover:animate-ping" />
          </h1>
          <span className="text-[9px] font-bold text-text-muted opacity-60 uppercase tracking-widest">Autonomous Pipeline v0.1</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={clearEvents}
            className="p-1.5 rounded-lg hover:bg-white/5 text-text-muted hover:text-text-primary transition-all border border-transparent hover:border-white/10"
            title="Reset Session"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-6 py-8 custom-scrollbar space-y-8 flex flex-col"
      >
        {chatHistory.length === 0 && !streamingBuffer && !currentIntent && (
          <div className="flex flex-col items-center justify-center flex-1 opacity-20 text-center gap-6 group">
            <div className="relative">
               <div className="w-20 h-20 rounded-3xl bg-accent-purple/10 border-2 border-dashed border-accent-purple/30 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-700">
                🤖
               </div>
               <div className="absolute -inset-4 bg-accent-purple/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            </div>
            <div>
               <p className="text-sm font-bold text-text-primary mb-1 uppercase tracking-widest">Excalibur Engine Ready</p>
               <p className="text-[10px] text-text-muted font-medium">I can help you build, refactor, and audit your code.</p>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-8">
          {chatHistory.map((msg, i) => (
            msg.role === 'user' ? (
              <UserMessage key={i} text={msg.content} />
            ) : (
              <AssistantMessage key={i} text={msg.content} events={[]} isStreaming={false} />
            )
          ))}

          {/* Active AI Process */}
          {(currentIntent || streamingBuffer) && (
            <AssistantMessage 
              text={streamingBuffer} 
              events={events} 
              isStreaming={true} 
            />
          )}
        </div>
      </div>

      {/* Persistent Bottom Bar - Pixel-Perfect Antigravity Copy */}
      <div className="p-6 bg-gradient-to-t from-[#020202] via-[#020202] to-transparent z-10">
        <div className="relative group/input">
          {/* Input Glow */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-accent-purple/30 to-accent-cyan/30 rounded-2xl blur-md opacity-0 group-focus-within/input:opacity-100 transition duration-1000" />
          
          <div className="relative flex flex-col gap-2 p-3 bg-surface-overlay border border-white/10 rounded-2xl shadow-2xl focus-within:border-accent-purple/50 transition-all duration-300">
            {/* Action Bar */}
            <div className="flex items-center justify-between px-1">
               <div className="flex items-center gap-1.5 p-1 rounded-lg bg-black/40 border border-white/5">
                  <button 
                    onClick={() => setIsFastMode(true)}
                    className={`px-2 py-1 rounded text-[9px] font-black uppercase transition-all ${isFastMode ? 'bg-accent-purple text-white shadow-glow-purple' : 'text-text-muted hover:text-text-secondary'}`}
                  >
                    ⚡ Fast
                  </button>
                  <button 
                    onClick={() => setIsFastMode(false)}
                    className={`px-2 py-1 rounded text-[9px] font-black uppercase transition-all ${!isFastMode ? 'bg-accent-purple text-white shadow-glow-purple' : 'text-text-muted hover:text-text-secondary'}`}
                  >
                    💎 Gemini 3 Flash
                  </button>
               </div>
               
               <div className="flex items-center gap-3">
                  <button className="text-text-muted hover:text-accent-purple transition-colors p-1" title="Voice Input">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
                    </svg>
                  </button>
               </div>
            </div>

            {/* Input Row */}
            <div className="flex items-center gap-3 px-1 pb-1">
              <button className="flex-shrink-0 w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-text-muted hover:bg-white/5 transition-all" title="Attach context">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </button>
              
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything, @ to mention, / for workflows"
                rows={1}
                className="flex-1 bg-transparent text-xs text-text-primary outline-none placeholder:text-text-muted/50 resize-none py-1.5 font-medium"
                style={{ height: 'auto', minHeight: '24px', maxHeight: '120px' }}
              />

              <button 
                onClick={handleSendMessage}
                disabled={!input.trim()}
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${input.trim() ? 'bg-accent-purple text-white shadow-glow-purple scale-110' : 'bg-white/5 text-text-muted opacity-20'}`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        {/* Footer info - pixel detail */}
        <div className="flex items-center justify-center gap-4 mt-4 opacity-30">
          <div className="flex items-center gap-1">
            <div className="w-1 h-1 rounded-full bg-accent-green" />
            <span className="text-[8px] font-black uppercase tracking-tighter">Engine Online</span>
          </div>
          <div className="w-px h-2 bg-white/20" />
          <span className="text-[8px] font-black uppercase tracking-tighter underline">Model Selection</span>
          <div className="w-px h-2 bg-white/20" />
          <span className="text-[8px] font-black uppercase tracking-tighter">Copilot Mode</span>
        </div>
      </div>
    </div>
  )
}
