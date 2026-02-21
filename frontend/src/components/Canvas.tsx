import { FormEvent, ReactNode, useMemo, useState } from 'react'

interface CanvasProps {
  children: ReactNode
}

type ViewerSource = {
  kind: 'url' | 'pdf'
  value: string
}

const Canvas = ({ children }: CanvasProps) => {
  const [draftUrl, setDraftUrl] = useState('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf')
  const [source, setSource] = useState<ViewerSource>({
    kind: 'pdf',
    value: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  })

  const sourceLabel = useMemo(() => {
    try {
      return new URL(source.value).hostname
    } catch {
      return source.value
    }
  }, [source.value])

  const handleOpen = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = draftUrl.trim()
    if (!trimmed) {
      return
    }

    const kind: ViewerSource['kind'] = trimmed.toLowerCase().includes('.pdf') ? 'pdf' : 'url'
    setSource({ kind, value: trimmed })
  }

  return (
    <div
      className="h-full flex flex-col rounded-xl border border-[var(--border-color)] bg-[var(--bg-viewer)] overflow-hidden"
      role="region"
      aria-label="Content canvas"
    >
      <header className="h-14 px-3 lg:px-4 border-b border-[var(--border-color)] bg-[var(--bg-viewer-header)] flex items-center gap-3">
        <span className="text-sm text-[var(--text-muted)] truncate">{sourceLabel}</span>
        <form onSubmit={handleOpen} className="ml-auto flex items-center gap-2">
          <label htmlFor="viewer-url" className="sr-only">
            Content URL
          </label>
          <input
            id="viewer-url"
            type="url"
            value={draftUrl}
            onChange={(event) => setDraftUrl(event.target.value)}
            className="h-9 w-[240px] lg:w-[320px] max-w-[45vw] rounded-md border border-[var(--border-color)] bg-[var(--bg-panel-soft)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-subtle)]"
            placeholder="Paste URL"
          />
          <button
            type="submit"
            className="h-9 px-3 rounded-md border border-[var(--border-color)] bg-[var(--bg-panel-soft)] text-sm text-[var(--text-primary)] hover:bg-[var(--bg-panel-elev)] transition-colors"
          >
            Open
          </button>
        </form>
      </header>

      <div className="flex-1 bg-[var(--bg-app)]">
        {source.kind === 'pdf' ? (
          <object
            data={source.value}
            type="application/pdf"
            className="w-full h-full"
            aria-label="PDF content"
          />
        ) : (
          <iframe
            src={source.value}
            title="Embedded content"
            className="w-full h-full border-0"
            loading="lazy"
          />
        )}
      </div>
      {children}
    </div>
  )
}

export default Canvas
