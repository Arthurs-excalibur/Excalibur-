import React, { useEffect } from 'react'
import { useAppStore } from '../store/useAppStore'

export const AgentManager: React.FC = () => {
  const { 
    isProjectOpen, 
    setIsAgentManagerOpen, 
    openProject, 
    addEvent, 
    runAITask,
    recentWorkspaces,
    chatHistory,
    addChatMessage,
    streamingBuffer
  } = useAppStore()
  const [prompt, setPrompt] = React.useState('')

  React.useEffect(() => {
    const checkHealth = async () => {
      const health = await window.electron.invoke('llama:health')
      if (health.status === 'ok') {
        // Only inject if no previous conversation
      } else {
        addChatMessage('assistant', '⚠️ Warning: Local AI server is starting or unreachable.')
      }
    }
    if (chatHistory.length === 0) checkHealth()
  }, [])

  const handleSubmit = () => {
    if (!prompt.trim()) return
    const msg = prompt.trim()
    addChatMessage('user', msg)
    runAITask(msg)
    setPrompt('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const renderInputBox = (isEmpty: boolean) => (
    <div className={`w-full max-w-[700px] flex flex-col ${isEmpty ? '' : 'mx-auto'}`}>
        {isEmpty && (
            <div className="flex items-center justify-between mb-2 px-2">
                <div className="flex items-center text-[12px] text-gray-300 font-medium cursor-pointer hover:text-white transition-colors">
                    New conversation in <span className="flex items-center text-gray-400 ml-1.5 focus:outline-none"> <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-0.5"><path d="M6 9l6 6 6-6"/></svg> {isProjectOpen ? 'Excalibur IDE' : 'No Project Open'}</span>
                </div>
                <div className="flex items-center text-[12px] text-gray-400 cursor-pointer hover:text-white transition-colors" onClick={() => setIsAgentManagerOpen(false)}>
                    <span className="tracking-tighter mr-1" style={{fontFamily: 'monospace'}}>&lt;&gt;</span>
                    Open editor
                </div>
            </div>
        )}

        <div className={`w-full bg-[#1e1e1e] border border-[#2b2d31] rounded-[8px] flex flex-col pt-3 pb-2 px-3 shadow-lg focus-within:border-[#4B4B4B] transition-colors ${!isEmpty && 'shadow-2xl'}`}>
            <textarea 
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything, @ to mention, / for workflows"
                className="w-full bg-transparent resize-none border-none outline-none text-[13px] text-gray-200 placeholder:text-[#555555] min-h-[44px] max-h-[300px]"
            />
            
            <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1.5">
                    <button className="w-6 h-6 flex items-center justify-center rounded-[4px] hover:bg-[#2b2d31] text-gray-400 text-lg">
                        ＋
                    </button>
                    <button className="flex items-center gap-1 px-2 py-1 rounded-[4px] hover:bg-[#2b2d31] text-[11px] text-gray-400 font-medium tracking-wide">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
                        Local AI
                    </button>
                    <button className="flex items-center gap-1 px-2 py-1 rounded-[4px] hover:bg-[#2b2d31] text-[11px] text-gray-400 font-medium tracking-wide">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
                        Qwen 2.5 Coder
                    </button>
                </div>
                
                <div className="flex items-center gap-1">
                    <button className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#2b2d31] text-gray-400 transition-colors">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
                    </button>
                    <button 
                        onClick={handleSubmit}
                        className={`w-7 h-7 flex items-center justify-center rounded-full transition-colors ${prompt.trim() ? 'bg-gray-200 text-[#1e1e1e]' : 'bg-[#2b2b2b] text-[#555555]'}`}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                    </button>
                </div>
            </div>
        </div>
    </div>
  )

  return (
    <div className="flex-1 flex bg-[#1e1e1e] overflow-hidden text-[#cccccc] font-sans">
      {/* Sidebar */}
      <div className="w-[260px] border-r border-[#2b2b2b] flex flex-col bg-[#18181A] text-[13px] flex-shrink-0">
        
        {/* + New Conversation */}
        <div className="px-3 py-3">
            <button 
                onClick={() => { setPrompt(''); addEvent('SYSTEM', 'New conversation started') }}
                className="w-full flex items-center justify-start gap-2 px-3 py-1.5 rounded-[4px] bg-[#2a2d2e] hover:bg-[#343738] text-white text-[12.5px] transition-colors border border-transparent shadow-sm"
            >
              <span className="text-gray-400 font-normal">＋</span> <span className="font-medium tracking-wide">New Conversation</span>
            </button>
        </div>

        <div className="flex-1 overflow-y-auto w-full custom-scrollbar">
            <div className="px-4 py-2 flex items-center gap-2 text-[#cccccc] text-[11.5px] opacity-80 mt-1 cursor-pointer hover:text-white transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                <span>Conversation History</span>
            </div>

            <div className="px-4 py-2 flex items-center justify-between text-[#cccccc] text-[11.5px] opacity-80 mt-3 cursor-pointer hover:text-white transition-colors">
                <span>Workspaces</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>
            </div>

            <div className="space-y-0.5 mt-1">
                {recentWorkspaces.length === 0 ? (
                  <p className="px-4 py-2 text-[11px] text-gray-500 italic">No recent workspaces</p>
                ) : (
                  recentWorkspaces.map((ws, i) => (
                    <div className="flex flex-col mt-0.5" key={i}>
                        <button 
                            onClick={() => openProject(ws.path)}
                            className={`flex items-center gap-2 px-4 py-1.5 text-[12.5px] w-full text-left transition-colors ${
                                ws.path.includes('Excalibur IDE') ? 'text-[#cccccc] hover:bg-[#2a2d2e]' : 'text-gray-400 hover:bg-[#2a2d2e] hover:text-[#cccccc]'
                            }`}
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500">
                                {ws.path.includes('Excalibur IDE') ? <path d="M6 9l6 6 6-6"/> : <path d="M9 18l6-6-6-6"/>}
                            </svg>
                            <span className="truncate">{ws.name}</span>
                        </button>
                    </div>
                  ))
                )}
            </div>
        </div>

        <div className="mt-auto py-2 flex flex-col mb-1 border-t border-[#2b2b2b]/30 pt-2">
            <button className="flex items-center gap-2.5 px-4 py-2 text-[12px] text-gray-400 hover:bg-[#2a2d2e] hover:text-gray-200 w-full text-left transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                Settings
            </button>
            <button className="flex items-center gap-2.5 px-4 py-2 text-[12px] text-gray-400 hover:bg-[#2a2d2e] hover:text-gray-200 w-full text-left transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                Provide Feedback
            </button>
            <button className="flex items-center gap-2.5 px-4 py-2 text-[12px] text-gray-400 hover:bg-[#2a2d2e] hover:text-gray-200 w-full text-left transition-colors">
                <span className="tracking-widest relative top-[-3px] text-gray-500 font-bold ml-0.5">...</span>
                <span className="ml-[1px]">More</span>
            </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative bg-[#1e1e1e]">
        
        {/* Chat / Message Thread Area */}
        <div className="flex-1 overflow-y-auto px-10 py-6 flex flex-col">
            {chatHistory.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center -mt-16 animate-fade-in">
                  {renderInputBox(true)}
              </div>
            ) : (
              <div className="max-w-[700px] mx-auto w-full space-y-6 flex-1 pt-4 pb-32 animate-fade-in">
                {chatHistory.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] px-4 py-3 text-[14px] leading-relaxed break-words rounded-xl ${
                      m.role === 'user' 
                        ? 'bg-[#2b2d31] text-gray-200' 
                        : 'bg-transparent text-[#e0e0e0]'
                    }`}>
                      {m.content}
                    </div>
                  </div>
                ))}
                
                {/* Thinking Buffer Stream */}
                {streamingBuffer && (
                    <div className="flex justify-start">
                        <div className="max-w-[85%] px-4 py-3 text-[13px] font-mono text-gray-400 italic">
                            {streamingBuffer}
                        </div>
                    </div>
                )}
              </div>
            )}
        </div>

        {/* Fixed Prompt Input Area active */}
        {chatHistory.length > 0 && (
            <div className="absolute bottom-6 w-full flex justify-center px-10">
                {renderInputBox(false)}
            </div>
        )}
      </div>
    </div>
  )
}
