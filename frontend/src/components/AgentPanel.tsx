import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { sendMessage } from '../lib/openrouterClient'

type MessageStatus = 'streaming' | 'done' | 'error'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  status: MessageStatus
  thoughtSummary?: string
  thoughtOpen?: boolean
  error?: string
}

const AgentPanel = () => {
  const [isListening, setIsListening] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [followUp, setFollowUp] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [panelError, setPanelError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const streamAbortRef = useRef<AbortController | null>(null)
  const logRef = useRef<HTMLDivElement>(null)
  const shouldAutoScrollRef = useRef(true)

  const statusLabel = useMemo(() => {
    if (isStreaming) {
      return 'Generating'
    }
    return isListening ? 'Listening' : ''
  }, [isListening, isStreaming])

  useEffect(() => {
    return () => {
      streamAbortRef.current?.abort()
    }
  }, [])

  useEffect(() => {
    const container = logRef.current
    if (!container || !shouldAutoScrollRef.current) {
      return
    }
    container.scrollTop = container.scrollHeight
  }, [messages])

  const onMicToggle = () => {
    setIsListening((current) => !current)
  }

  const onAttachClick = () => {
    fileInputRef.current?.click()
  }

  const onLogScroll = () => {
    const container = logRef.current
    if (!container) {
      return
    }
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight
    shouldAutoScrollRef.current = distanceFromBottom < 40
  }

  const updateMessage = (id: string, updater: (message: ChatMessage) => ChatMessage) => {
    setMessages((current) =>
      current.map((message) => (message.id === id ? updater(message) : message)),
    )
  }

  const onCancel = () => {
    streamAbortRef.current?.abort()
    streamAbortRef.current = null
    setIsStreaming(false)
  }

  const onSend = async () => {
    const trimmed = followUp.trim()
    if (!trimmed || isStreaming) {
      return
    }

    setPanelError(null)
    const userId = `user-${Date.now()}`
    const assistantId = `assistant-${Date.now()}`

    setMessages((current) => [
      ...current,
      { id: userId, role: 'user', text: trimmed, status: 'done' },
      { id: assistantId, role: 'assistant', text: '', status: 'streaming', thoughtSummary: '' },
    ])
    setFollowUp('')

    setIsStreaming(true)
    const controller = new AbortController()
    streamAbortRef.current = controller

    try {
      await sendMessage(
        { message: trimmed, stream: true },
        {
          onDelta: (delta) => {
            updateMessage(assistantId, (message) => ({
              ...message,
              text: `${message.text}${delta}`,
              status: 'streaming',
            }))
          },
          onThoughtDelta: (delta) => {
            updateMessage(assistantId, (message) => ({
              ...message,
              thoughtSummary: `${message.thoughtSummary ?? ''}${delta}`,
            }))
          },
          onThoughtDone: (summary) => {
            updateMessage(assistantId, (message) => ({
              ...message,
              thoughtSummary: summary || message.thoughtSummary,
            }))
          },
          onDone: (payload) => {
            updateMessage(assistantId, (message) => ({
              ...message,
              text: payload.response || message.text,
              thoughtSummary: payload.thought_summary ?? message.thoughtSummary,
              status: 'done',
            }))
            setIsStreaming(false)
            streamAbortRef.current = null
          },
          onError: (payload) => {
            const errorText = payload.error.message || 'Streaming failed.'
            updateMessage(assistantId, (message) => ({
              ...message,
              status: 'error',
              error: errorText,
            }))
            setPanelError(errorText)
            setIsStreaming(false)
            streamAbortRef.current = null
          },
        },
        controller.signal,
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Request failed.'
      updateMessage(assistantId, (current) => ({
        ...current,
        status: 'error',
        error: message,
      }))
      setPanelError(message)
      setIsStreaming(false)
      streamAbortRef.current = null
    }
  }

  const handleSend = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void onSend()
  }

  const toggleThoughts = (id: string) => {
    updateMessage(id, (message) => ({
      ...message,
      thoughtOpen: !message.thoughtOpen,
    }))
  }

  return (
    <div className="h-full flex flex-col bg-[var(--bg-panel)] text-[var(--text-muted)]">
      <div
        ref={logRef}
        onScroll={onLogScroll}
        className="flex-1 overflow-auto px-4 py-4 space-y-3 text-[1.05rem] leading-relaxed"
      >
        {messages.length > 0 && (
          <div role="log" aria-live="polite" aria-label="Conversation history" className="flex flex-col space-y-2 pt-2">
            {messages.map((message) => (
              <div
                key={message.id}
                className={message.role === 'user' 
                  ? 'ml-auto text-right text-[var(--text-primary)] max-w-[85%] bg-[var(--bg-panel-soft)] px-4 py-2.5 rounded-2xl border border-[var(--border-color)]' 
                  : 'mr-auto text-left text-[var(--text-muted)] max-w-[85%] py-1'}
              >
                <p className="whitespace-pre-wrap">
                  {message.text}
                </p>

                {message.role === 'assistant' && message.thoughtSummary && (
                  <div className="mt-2 rounded-md border border-[var(--border-color)] bg-[var(--bg-panel-soft)]">
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left text-xs tracking-wide uppercase text-[var(--text-subtle)] hover:bg-[var(--bg-panel-elev)]"
                      aria-expanded={Boolean(message.thoughtOpen)}
                      onClick={() => toggleThoughts(message.id)}
                    >
                      Thought process
                    </button>
                    {message.thoughtOpen && (
                      <div className="px-3 pb-3 text-sm whitespace-pre-wrap text-[var(--text-subtle)]">
                        {message.thoughtSummary}
                      </div>
                    )}
                  </div>
                )}

                {message.status === 'error' && message.error && (
                  <p className="mt-2 text-sm text-red-300">{message.error}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {panelError && (
          <p className="text-sm text-red-300" role="alert">
            {panelError}
          </p>
        )}

          {statusLabel && (
            <p
              role="status"
              aria-live="polite"
              aria-label="Assistant status"
              className={isStreaming ? 'generating-glow' : isListening ? 'text-clarity-focus' : 'text-[var(--text-subtle)]'}
            >
              {statusLabel}
            </p>
          )}
      </div>

      <form onSubmit={handleSend} className="p-3 border-t border-[var(--border-color)] bg-[var(--bg-panel-soft)]">
        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-3">
          <label htmlFor="agent-message" className="sr-only">
            Add a follow-up
          </label>
          <input
            id="agent-message"
            type="text"
            value={followUp}
            onChange={(event) => setFollowUp(event.target.value)}
            disabled={isStreaming}
            placeholder="Add a follow-up"
            className="h-10 w-full border-0 bg-transparent text-[1.05rem] text-[var(--text-primary)] placeholder:text-[var(--text-subtle)] focus:outline-none"
          />

          <div className="mt-2 flex items-center gap-2">
            <div className="flex items-center gap-2 text-[var(--text-muted)]">
              <button type="button" className="h-8 min-h-0 min-w-0 rounded-full bg-[var(--bg-panel-elev)] px-3 text-sm" aria-label="Agent mode">
                ∞ Agent
              </button>
              <button type="button" className="h-8 min-h-0 min-w-0 rounded-full px-2 text-sm text-[var(--text-subtle)]" aria-label="Automation mode">
                Auto
              </button>
            </div>

            <div className="ml-auto flex items-center gap-1">
              <button
                type="button"
                onClick={onMicToggle}
                disabled={isStreaming}
                aria-label={isListening ? 'Stop microphone' : 'Start microphone'}
                aria-pressed={isListening}
                className={`h-8 w-8 min-h-0 min-w-0 rounded-md transition-colors ${isListening ? 'text-clarity-focus bg-clarity-focus/15' : 'text-[var(--text-subtle)] hover:bg-[var(--bg-panel-elev)]'}`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Z" />
                  <path d="M18 11a6 6 0 0 1-12 0H4a8 8 0 0 0 7 7.93V22h2v-3.07A8 8 0 0 0 20 11h-2Z" />
                </svg>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={() => undefined}
                aria-label="Attach files"
              />
              <button
                type="button"
                onClick={onAttachClick}
                disabled={isStreaming}
                className="h-8 w-8 min-h-0 min-w-0 rounded-md text-[var(--text-subtle)] hover:bg-[var(--bg-panel-elev)]"
                aria-label="Attach file"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M5 16.5V7.7A3.7 3.7 0 0 1 8.7 4H15A4 4 0 0 1 19 8V16A4 4 0 0 1 15 20H9.5A3.5 3.5 0 0 1 6 16.5V9.5A2.5 2.5 0 0 1 8.5 7H15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
              <button
                type={isStreaming ? 'button' : 'submit'}
                onClick={isStreaming ? onCancel : undefined}
                className="h-8 w-8 min-h-0 min-w-0 rounded-full bg-[#f3f4f6] text-[#111827] hover:bg-white transition-colors disabled:opacity-50"
                aria-label={isStreaming ? 'Cancel response' : 'Send message'}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  {isStreaming ? (
                    <path d="M7 7h10v10H7z" />
                  ) : (
                    <path d="M12 6A6 6 0 1 1 6 12A6 6 0 0 1 12 6Z" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

export default AgentPanel
