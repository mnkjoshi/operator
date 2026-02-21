export interface OpenRouterRequest {
  message: string
  context?: string | null
  stream?: boolean
}

export interface OpenRouterResponse {
  response: string
  model: string
}

export interface StreamDonePayload {
  response: string
  model: string
  thought_summary?: string
}

export interface StreamErrorPayload {
  error: {
    code?: string | number | null
    type?: string | null
    message: string
    param?: string | null
    status_code?: number
    request_id?: string | null
  }
}

export interface StreamCallbacks {
  onDelta?: (delta: string) => void
  onThoughtDelta?: (delta: string) => void
  onThoughtDone?: (summary: string) => void
  onDone?: (payload: StreamDonePayload) => void
  onError?: (payload: StreamErrorPayload) => void
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

export const sendMessage = async (
  input: OpenRouterRequest,
  callbacks: StreamCallbacks,
  signal?: AbortSignal,
): Promise<void> => {
  const baseUrl = getBaseUrl()
  const response = await fetch(`${baseUrl}/api/openrouter`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: input.message,
      context: input.context ?? null,
      stream: input.stream ?? true,
    }),
    signal,
  })

  if (!response.ok) {
    let message = `Request failed (${response.status})`
    try {
      const body = await response.json()
      message = body?.detail?.message ?? body?.detail?.error?.message ?? message
    } catch {
      // Ignore parse errors and keep default message.
    }
    callbacks.onError?.({
      error: {
        message,
        status_code: response.status,
      },
    })
    return
  }

  if (!input.stream) {
    const body = (await response.json()) as OpenRouterResponse
    callbacks.onDone?.({
      response: body.response,
      model: body.model,
    })
    return
  }

  const reader = response.body?.getReader()
  if (!reader) {
    callbacks.onError?.({
      error: { message: 'Streaming not supported by this browser/response.' },
    })
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
        if (event === 'delta' && typeof data?.delta === 'string') {
          callbacks.onDelta?.(data.delta)
        } else if (event === 'thought_delta' && typeof data?.delta === 'string') {
          callbacks.onThoughtDelta?.(data.delta)
        } else if (event === 'thought_done' && typeof data?.summary === 'string') {
          callbacks.onThoughtDone?.(data.summary)
        } else if (event === 'done' && typeof data?.response === 'string' && typeof data?.model === 'string') {
          callbacks.onDone?.(data as StreamDonePayload)
        } else if (event === 'error' && data?.error?.message) {
          callbacks.onError?.(data as StreamErrorPayload)
        }
      }

      separatorIndex = buffer.indexOf('\n\n')
    }
  }
}
