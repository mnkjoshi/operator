import { FormEvent, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { streamComputerUse } from '../lib/computerUseClient'
import { BrowserActionStatus, BrowserState } from '../types/browser'

type MessageStatus = 'streaming' | 'done' | 'error'

interface AgentAction {
  id: string
  name: string
  status: BrowserActionStatus
  message: string
  url: string
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  status: MessageStatus
  model?: string
  actions?: AgentAction[]
  error?: string
}

interface AgentPanelProps {
  onBrowserStateChange: (update: Partial<BrowserState>) => void
}

const AgentPanel = ({ onBrowserStateChange }: AgentPanelProps) => {
  const [isListening, setIsListening] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [followUp, setFollowUp] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [panelError, setPanelError] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const streamAbortRef = useRef<AbortController | null>(null)
  const logRef = useRef<HTMLDivElement>(null)
  const shouldAutoScrollRef = useRef(true)

  const statusLabel = useMemo(() => {
    if (isStreaming) {
      return 'Running browser actions'
    }
    return isListening ? 'Listening' : ''
  }, [isListening, isStreaming])

  useEffect(() => {
    return () => {
      streamAbortRef.current?.abort()
    }
  }, [])

  useLayoutEffect(() => {
    const container = logRef.current
    if (!container || !shouldAutoScrollRef.current) {
      return
    }
    const rafId = requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight
    })
    return () => cancelAnimationFrame(rafId)
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
    onBrowserStateChange({ isBusy: false })
  }

  const onSend = async () => {
    const trimmed = followUp.trim()
    if (!trimmed || isStreaming) {
      return
    }

    setPanelError(null)
    shouldAutoScrollRef.current = true
    const now = Date.now()
    const userId = `user-${now}`
    const assistantId = `assistant-${now}`

    setMessages((current) => [
      ...current,
      { id: userId, role: 'user', text: trimmed, status: 'done' },
      { id: assistantId, role: 'assistant', text: '', status: 'streaming', actions: [] },
    ])
    setFollowUp('')

    setIsStreaming(true)
    onBrowserStateChange({ isBusy: true })
    const controller = new AbortController()
    streamAbortRef.current = controller

    try {
      await streamComputerUse(
        { message: trimmed, session_id: sessionId },
        {
          onSession: (payload) => {
            setSessionId(payload.session_id)
            onBrowserStateChange({
              sessionId: payload.session_id,
              url: payload.url,
              screenshotBase64: payload.screenshot_base64,
              updatedAtMs: payload.updated_at_ms,
            })
          },
          onAssistant: (payload) => {
            updateMessage(assistantId, (message) => ({
              ...message,
              text: message.text ? `${message.text}\n\n${payload.text}` : payload.text,
              status: 'streaming',
            }))
          },
          onAction: (payload) => {
            updateMessage(assistantId, (message) => ({
              ...message,
              actions: [
                ...(message.actions ?? []),
                {
                  id: `${payload.action}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                  name: payload.action,
                  status: payload.status,
                  message: payload.message,
                  url: payload.url,
                },
              ],
            }))

            onBrowserStateChange({
              sessionId: payload.session_id,
              url: payload.url,
              screenshotBase64: payload.screenshot_base64,
              updatedAtMs: payload.updated_at_ms,
              lastAction: payload.action,
              lastActionStatus: payload.status,
            })
          },
          onDone: (payload) => {
            setSessionId(payload.session_id)
            updateMessage(assistantId, (message) => ({
              ...message,
              text: payload.response || message.text,
              model: payload.model,
              status: 'done',
            }))
            onBrowserStateChange({
              sessionId: payload.session_id,
              url: payload.url,
              screenshotBase64: payload.screenshot_base64,
              updatedAtMs: payload.updated_at_ms,
              isBusy: false,
            })
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
            onBrowserStateChange({ isBusy: false })
            setIsStreaming(false)
            streamAbortRef.current = null
          },
        },
        controller.signal,
      )
    } catch (error) {
      if (controller.signal.aborted) {
        return
      }
      const message = error instanceof Error ? error.message : 'Request failed.'
      updateMessage(assistantId, (current) => ({
        ...current,
        status: 'error',
        error: message,
      }))
      setPanelError(message)
      onBrowserStateChange({ isBusy: false })
      setIsStreaming(false)
      streamAbortRef.current = null
    }
  }

  const handleSend = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void onSend()
  }

  return (
    <div className="h-full min-h-0 flex flex-col bg-[var(--bg-panel)] text-[var(--text-muted)]">
      <div
        ref={logRef}
        onScroll={onLogScroll}
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 py-4 space-y-3 text-[1.05rem] leading-relaxed"
      >
        {messages.length > 0 && (
          <div role="log" aria-live="polite" aria-label="Conversation history" className="flex flex-col space-y-2 pt-2">
            {messages.map((message) => (
              <div
                key={message.id}
                className={message.role === 'user'
                  ? 'ml-auto text-right text-[var(--text-primary)] max-w-[85%] bg-[var(--bg-panel-soft)] px-4 py-2.5 rounded-2xl border border-[var(--border-color)]'
                  : 'mr-auto text-left text-[var(--text-muted)] max-w-[92%] py-1'}
              >
                <p className="whitespace-pre-wrap">{message.text}</p>

                {message.actions && message.actions.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {message.actions.map((action) => (
                      <div
                        key={action.id}
                        className="rounded-md border border-[var(--border-color)] bg-[var(--bg-panel-soft)] px-2 py-1 text-xs"
                      >
                        <span className="text-[var(--text-primary)]">{action.name}</span>
                        <span className="mx-1 text-[var(--text-subtle)]">·</span>
                        <span
                          className={
                            action.status === 'ok'
                              ? 'text-green-300'
                              : action.status === 'blocked'
                                ? 'text-amber-300'
                                : 'text-red-300'
                          }
                        >
                          {action.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {message.model && (
                  <p className="mt-1 text-xs text-[var(--text-subtle)]">Model: {message.model}</p>
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
            Add an instruction
          </label>
          <input
            id="agent-message"
            type="text"
            value={followUp}
            onChange={(event) => setFollowUp(event.target.value)}
            disabled={isStreaming}
            placeholder="Tell the agent what to do in the browser"
            className="h-10 w-full border-0 bg-transparent text-[1.05rem] text-[var(--text-primary)] placeholder:text-[var(--text-subtle)] focus:outline-none"
          />

          <div className="mt-2 flex items-center gap-2">
            <div className="flex items-center gap-2 text-[var(--text-muted)]">
              <button type="button" className="h-8 min-h-0 min-w-0 rounded-full bg-[var(--bg-panel-elev)] px-3 text-sm" aria-label="Agent mode">
                Browser Agent
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
