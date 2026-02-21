export interface ComputerUseRequest {
  message: string
  session_id?: string | null
  max_turns?: number
}

export interface SessionPayload {
  session_id: string
  url: string
  screenshot_base64: string
  updated_at_ms: number
}

export interface ActionPayload {
  session_id: string
  action: string
  args: Record<string, unknown>
  status: 'ok' | 'error' | 'blocked'
  message: string
  url: string
  screenshot_base64: string
  updated_at_ms: number
}

export interface AssistantPayload {
  session_id: string
  text: string
  turn: number
}

export interface DonePayload {
  session_id: string
  response: string
  model: string
  url: string
  screenshot_base64: string
  updated_at_ms: number
}

export interface ErrorPayload {
  session_id?: string | null
  error: {
    message: string
    status_code?: number
    type?: string | null
  }
}

export interface ComputerUseCallbacks {
  onSession?: (payload: SessionPayload) => void
  onAction?: (payload: ActionPayload) => void
  onAssistant?: (payload: AssistantPayload) => void
  onDone?: (payload: DonePayload) => void
  onError?: (payload: ErrorPayload) => void
}

const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL
  return typeof envUrl === 'string' && envUrl.trim().length > 0 ? envUrl.trim() : ''
}

const parseSseBlock = (block: string) => {
  const lines = block.split('\n')
  let event = 'message'
  const dataLines: string[] = []

  for (const line of lines) {
    if (line.startsWith('event:')) {
      event = line.slice(6).trim()
      continue
    }
    if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trim())
    }
  }

  if (dataLines.length === 0) {
    return null
  }

  const dataText = dataLines.join('\n')
  try {
    const data = JSON.parse(dataText)
    return { event, data }
  } catch {
    return null
  }
}

export const streamComputerUse = async (
  input: ComputerUseRequest,
  callbacks: ComputerUseCallbacks,
  signal?: AbortSignal,
): Promise<void> => {
  const baseUrl = getBaseUrl()
  const response = await fetch(`${baseUrl}/api/gemini`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: input.message,
      session_id: input.session_id ?? null,
      max_turns: input.max_turns,
    }),
    signal,
  })

  if (!response.ok) {
    let message = `Request failed (${response.status})`
    try {
      const body = await response.json()
      message = body?.detail?.message ?? message
    } catch {
      // Keep default message.
    }
    callbacks.onError?.({ error: { message, status_code: response.status } })
    return
  }

  const reader = response.body?.getReader()
  if (!reader) {
    callbacks.onError?.({ error: { message: 'Streaming not supported by this browser/response.' } })
    return
  }

  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      break
    }
    buffer += decoder.decode(value, { stream: true })

    let separatorIndex = buffer.indexOf('\n\n')
    while (separatorIndex !== -1) {
      const block = buffer.slice(0, separatorIndex)
      buffer = buffer.slice(separatorIndex + 2)

      const parsed = parseSseBlock(block)
      if (parsed) {
        const { event, data } = parsed
        if (event === 'session' && data?.session_id) {
          callbacks.onSession?.(data as SessionPayload)
        } else if (event === 'action' && data?.action) {
          callbacks.onAction?.(data as ActionPayload)
        } else if (event === 'assistant' && typeof data?.text === 'string') {
          callbacks.onAssistant?.(data as AssistantPayload)
        } else if (event === 'done' && typeof data?.response === 'string') {
          callbacks.onDone?.(data as DonePayload)
        } else if (event === 'error' && data?.error?.message) {
          callbacks.onError?.(data as ErrorPayload)
        }
      }

      separatorIndex = buffer.indexOf('\n\n')
    }
  }
}
