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
    <div className="min-h-screen flex flex-col">
      {/* Skip to main content link for keyboard users */}
      <a href="#main-content" className="skip-to-main">
        Skip to main content
      </a>

      <div className="flex flex-1 flex-col lg:flex-row">
        {/* Canvas: 70% width on large screens */}
        <main
          id="main-content"
          ref={mainRef}
          className="flex-1 lg:w-[70%] clarity-canvas p-6 overflow-auto"
          tabIndex={-1}
          aria-label="Main content area"
        >
          <Canvas>
            <Outlet />
          </Canvas>
        </main>

        {/* Agent Panel: 30% width on large screens */}
        <aside
          className="lg:w-[30%] border-l border-gray-700"
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
