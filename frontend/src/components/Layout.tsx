import { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Canvas from './Canvas'
import AgentPanel from './AgentPanel'

/**
 * Main layout component featuring:
 * - 70% Canvas (main viewport)
 * - 30% Agent Panel (voice-first sidebar)
 * - Accessible routing with focus management
 */
const Layout = () => {
  const location = useLocation()
  const mainRef = useRef<HTMLElement>(null)

  // Manage focus on route changes for screen readers
  useEffect(() => {
    // Find the first h1 or focus the main element
    const h1 = mainRef.current?.querySelector('h1')
    if (h1) {
      (h1 as HTMLElement).focus()
    } else if (mainRef.current) {
      mainRef.current.focus()
    }
  }, [location.pathname])

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-app)] text-[var(--text-primary)]">
      {/* Skip to main content link for keyboard users */}
      <a href="#main-content" className="skip-to-main">
        Skip to main content
      </a>

      <div className="flex flex-1 flex-col lg:flex-row lg:gap-0">
        {/* Viewer: dominant panel on desktop */}
        <main
          id="main-content"
          ref={mainRef}
          className="flex-1 p-3 lg:p-4 overflow-hidden"
          tabIndex={-1}
          aria-label="Embedded content viewer"
        >
          <Canvas>
            <Outlet />
          </Canvas>
        </main>

        {/* Chat panel */}
        <aside
          className="w-full lg:w-[320px] xl:w-[360px] flex-shrink-0 border-t border-[var(--border-color)] lg:border-t-0 lg:border-l bg-[var(--bg-panel)] flex flex-col"
          role="complementary"
          aria-label="AI Assistant Panel"
        >
          <AgentPanel />
        </aside>
      </div>
    </div>
  )
}

export default Layout
