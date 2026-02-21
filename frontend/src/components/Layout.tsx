import { useCallback, useEffect, useRef, useState } from 'react'
import Canvas from './Canvas'
import AgentPanel from './AgentPanel'
import { BrowserState } from '../types/browser'

/**
 * Main layout component featuring:
 * - 70% Canvas (main viewport)
 * - 30% Agent Panel (voice-first sidebar)
 * - Accessible routing with focus management
 */
const Layout = () => {
  const mainRef = useRef<HTMLElement>(null)
  const [browserState, setBrowserState] = useState<BrowserState>({
    sessionId: null,
    url: '',
    screenshotBase64: null,
    updatedAtMs: null,
    lastAction: null,
    lastActionStatus: null,
    isBusy: false,
  })

  const onBrowserStateChange = useCallback((update: Partial<BrowserState>) => {
    setBrowserState((current) => ({ ...current, ...update }))
  }, [])

  // Manage initial focus for screen readers
  useEffect(() => {
    const h1 = mainRef.current?.querySelector('h1')
    if (h1) {
      (h1 as HTMLElement).focus()
    } else if (mainRef.current) {
      mainRef.current.focus()
    }
  }, [])

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-[var(--bg-app)] text-[var(--text-primary)]">
      {/* Skip to main content link for keyboard users */}
      <a href="#main-content" className="skip-to-main">
        Skip to main content
      </a>

      <div className="flex flex-1 min-h-0 flex-col lg:flex-row lg:gap-0">
        {/* Viewer: dominant panel on desktop */}
        <main
          id="main-content"
          ref={mainRef}
          className="flex-1 p-3 lg:p-4 overflow-hidden"
          tabIndex={-1}
          aria-label="Playwright browser viewer"
        >
          <Canvas browserState={browserState} />
        </main>

        {/* Chat panel */}
        <aside
          className="w-full lg:w-[320px] xl:w-[360px] flex-shrink-0 min-h-0 border-t border-[var(--border-color)] lg:border-t-0 lg:border-l bg-[var(--bg-panel)] flex flex-col"
          role="complementary"
          aria-label="AI Assistant Panel"
        >
          <AgentPanel onBrowserStateChange={onBrowserStateChange} />
        </aside>
      </div>
    </div>
  )
}

export default Layout
