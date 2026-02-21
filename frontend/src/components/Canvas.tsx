import { BrowserState } from '../types/browser'

interface CanvasProps {
  browserState: BrowserState
}

const Canvas = ({ browserState }: CanvasProps) => {
  const hasLiveView = Boolean(browserState.screenshotBase64)
  const screenshotSrc = hasLiveView
    ? `data:image/png;base64,${browserState.screenshotBase64}`
    : null

  const urlLabel = browserState.url
    ? (() => {
      try {
        return new URL(browserState.url).hostname
      } catch {
        return browserState.url
      }
    })()
    : 'No active browser session'

  return (
    <div
      className="h-full flex flex-col rounded-xl border border-[var(--border-color)] bg-[var(--bg-viewer)] overflow-hidden"
      role="region"
      aria-label="Playwright browser canvas"
    >
      <header className="h-14 px-3 lg:px-4 border-b border-[var(--border-color)] bg-[var(--bg-viewer-header)] flex items-center gap-3">
        <span className="text-sm text-[var(--text-muted)] truncate">{urlLabel}</span>
        <span
          className={`ml-auto rounded-full px-2 py-1 text-xs ${
            browserState.isBusy
              ? 'bg-clarity-focus/20 text-clarity-focus'
              : 'bg-[var(--bg-panel-soft)] text-[var(--text-subtle)]'
          }`}
        >
          {browserState.isBusy ? 'Agent active' : 'Idle'}
        </span>
      </header>

      <div className="flex-1 bg-[var(--bg-app)] relative">
        {hasLiveView && screenshotSrc ? (
          <img
            src={screenshotSrc}
            alt="Live Playwright browser view"
            className="h-full w-full object-contain"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center px-6 text-center text-[var(--text-subtle)]">
            Send an instruction in the sidebar to start a Playwright browser session.
          </div>
        )}
      </div>

      <footer className="border-t border-[var(--border-color)] px-3 py-2 text-xs text-[var(--text-subtle)]">
        {browserState.lastAction
          ? `Last action: ${browserState.lastAction} (${browserState.lastActionStatus ?? 'unknown'})`
          : 'No actions yet'}
      </footer>
    </div>
  )
}

export default Canvas
