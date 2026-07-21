'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import EyebrowLabel from '@/components/EyebrowLabel'

interface Message { role: 'user' | 'assistant'; content: string; model?: string }

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [model, setModel] = useState('')
  const abortRef = useRef<AbortController | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-grow textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`
  }, [input])

  const send = useCallback(async () => {
    const text = input.trim()
    if (!text || streaming) return

    const history = messages.map(({ role, content }) => ({ role, content }))
    const userMsg: Message = { role: 'user', content: text }
    setMessages(p => [...p, userMsg, { role: 'assistant', content: '' }])
    setInput('')
    setStreaming(true)

    const ctrl = new AbortController()
    abortRef.current = ctrl

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history }),
        signal: ctrl.signal,
      })

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) { setStreaming(false); return }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        for (const line of decoder.decode(value).split('\n')) {
          if (!line.startsWith('data: ')) continue
          try {
            const ev = JSON.parse(line.slice(6))
            if (ev.text) {
              setMessages(p => {
                const copy = [...p]
                copy[copy.length - 1] = { ...copy[copy.length - 1], content: copy[copy.length - 1].content + ev.text }
                return copy
              })
            }
            if (ev.done && ev.model) {
              setModel(ev.model)
              setMessages(p => {
                const copy = [...p]
                copy[copy.length - 1] = { ...copy[copy.length - 1], model: ev.model }
                return copy
              })
            }
          } catch { /* skip */ }
        }
      }
    } catch (e) {
      if (!(e instanceof Error && e.name === 'AbortError')) {
        setMessages(p => {
          const copy = [...p]
          copy[copy.length - 1] = { ...copy[copy.length - 1], content: '❌ Error connecting to Claude.' }
          return copy
        })
      }
    }
    setStreaming(false)
  }, [input, messages, streaming])

  const stop = () => { abortRef.current?.abort(); setStreaming(false) }

  return (
    <div className="h-screen flex flex-col" style={{ background: 'var(--canvas)' }}>
      {/* Header */}
      <div className="px-6 py-4 border-b shrink-0 flex items-center justify-between" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex flex-col gap-0.5">
          <EyebrowLabel>Chat</EyebrowLabel>
          <h1 className="text-sub-small" style={{ color: 'var(--fg)' }}>Ask Claude anything</h1>
        </div>
        {model && (
          <span className="font-mono text-[11px] px-2.5 py-1 rounded-full" style={{ color: 'var(--accent-blue)', background: 'rgba(61,157,255,0.1)' }}>
            {model}
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-4 opacity-50">
            <span className="font-mono text-[40px]">⚡</span>
            <p className="text-[14px] leading-relaxed text-center max-w-sm" style={{ color: 'var(--fg-muted)' }}>
              Start a conversation — use skills for structured tasks, chat for everything else
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className="max-w-[75%] rounded-[16px] px-5 py-3"
              style={{
                background: msg.role === 'user' ? 'rgba(168,85,247,0.15)' : 'var(--surface)',
                border: msg.role === 'user' ? '1px solid rgba(168,85,247,0.3)' : '1px solid var(--border-subtle)',
              }}
            >
              {msg.role === 'assistant' ? (
                <div className="prose prose-sm max-w-none" style={{ color: 'var(--fg-body)' }}>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({ className, children, ...props }) {
                        const isBlock = className?.includes('language-')
                        return isBlock ? (
                          <pre className="terminal rounded-[8px] p-3 overflow-x-auto my-2">
                            <code style={{ color: 'var(--fg-body)', fontSize: 13 }} {...props}>{children}</code>
                          </pre>
                        ) : (
                          <code className="font-mono text-[13px] px-1.5 py-0.5 rounded" style={{ background: 'var(--elevated)', color: 'var(--accent-primary)' }} {...props}>{children}</code>
                        )
                      },
                      p({ children }) { return <p className="mb-3 last:mb-0 text-[15px] leading-relaxed">{children}</p> },
                      ul({ children }) { return <ul className="list-disc pl-5 mb-3 flex flex-col gap-1">{children}</ul> },
                      ol({ children }) { return <ol className="list-decimal pl-5 mb-3 flex flex-col gap-1">{children}</ol> },
                      li({ children }) { return <li className="text-[15px]">{children}</li> },
                      h1({ children }) { return <h1 className="text-[18px] font-semibold mb-2 mt-3" style={{ color: 'var(--fg)' }}>{children}</h1> },
                      h2({ children }) { return <h2 className="text-[16px] font-semibold mb-2 mt-3" style={{ color: 'var(--fg)' }}>{children}</h2> },
                      h3({ children }) { return <h3 className="text-[14px] font-semibold mb-1 mt-2" style={{ color: 'var(--fg)' }}>{children}</h3> },
                      table({ children }) { return <div className="overflow-x-auto my-3"><table className="w-full text-[13px] font-mono" style={{ borderCollapse: 'collapse' }}>{children}</table></div> },
                      th({ children }) { return <th className="text-left px-3 py-1.5 border-b" style={{ borderColor: 'var(--border-subtle)', color: 'var(--fg-muted)' }}>{children}</th> },
                      td({ children }) { return <td className="px-3 py-1.5 border-b" style={{ borderColor: 'var(--border-subtle)' }}>{children}</td> },
                    }}
                  >
                    {msg.content || (streaming && i === messages.length - 1 ? '▋' : '')}
                  </ReactMarkdown>
                  {msg.model && (
                    <span className="font-mono text-[10px] mt-2 block" style={{ color: 'var(--fg-muted)', opacity: 0.5 }}>
                      {msg.model}
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-[15px] leading-relaxed" style={{ color: 'var(--fg-body)' }}>{msg.content}</p>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-6 pb-6 pt-3 shrink-0">
        <div
          className="flex items-end gap-3 rounded-[16px] border px-4 py-3"
          style={{ background: 'var(--surface)', borderColor: 'var(--border-default)' }}
        >
          <textarea
            ref={textareaRef}
            className="flex-1 bg-transparent resize-none outline-none text-[15px] leading-relaxed"
            style={{ color: 'var(--fg)', minHeight: 24, maxHeight: 200, fontFamily: 'var(--font-geist-sans)' }}
            placeholder="Message Claude… (⌘↵ to send)"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); send() }
            }}
            rows={1}
          />
          {streaming ? (
            <button onClick={stop} className="btn btn-sm btn-danger shrink-0">■ Stop</button>
          ) : (
            <button onClick={send} disabled={!input.trim()} className="btn btn-sm btn-primary shrink-0">↑ Send</button>
          )}
        </div>
        <p className="text-[11px] mt-2 text-center font-mono" style={{ color: 'var(--fg-muted)', opacity: 0.5 }}>
          ⌘↵ to send · Context files from onboarding are automatically included
        </p>
      </div>
    </div>
  )
}
