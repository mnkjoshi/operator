import { useEffect, useRef } from 'react'
import { Helmet } from 'react-helmet-async'

/**
 * Home page - demonstrates the Canvas and Agent Panel layout
 */
const Home = () => {
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    // Focus the h1 on mount for screen reader announcement
    if (headingRef.current) {
      headingRef.current.focus()
    }
  }, [])

  return (
    <>
      <Helmet>
        <title>Home - Operator</title>
      </Helmet>

      <div className="space-y-6">
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-4xl font-bold mb-8 outline-none"
        >
          Welcome to Operator
        </h1>

        <section aria-labelledby="mission-heading">
          <h2 id="mission-heading" className="text-2xl font-bold mb-4">
            Our Mission
          </h2>
          <p className="text-lg leading-relaxed mb-4">
            Eliminate technological barriers for users with high-accessibility 
            requirements using a multimodal AI agent that translates complex 
            digital environments into simple, accessible interfaces.
          </p>
        </section>

        <section aria-labelledby="features-heading">
          <h2 id="features-heading" className="text-2xl font-bold mb-4">
            Key Features
          </h2>
          <ul className="space-y-3 list-disc list-inside text-lg">
            <li>Voice-first interaction with speech-to-text</li>
            <li>Text-to-speech for easy content consumption</li>
            <li>Simplified, noise-free content display</li>
            <li>WCAG 2.2 AAA compliant design</li>
            <li>High contrast themes for visual clarity</li>
            <li>Keyboard navigation throughout</li>
          </ul>
        </section>

        <section aria-labelledby="getting-started-heading">
          <h2 id="getting-started-heading" className="text-2xl font-bold mb-4">
            Getting Started
          </h2>
          <p className="text-lg leading-relaxed mb-4">
            Use the AI Assistant panel on the right to interact with Operator. 
            Click the microphone button to start speaking, or use the quick 
            action buttons for common tasks.
          </p>
          <p className="text-lg leading-relaxed">
            All interactions are designed to be accessible via keyboard, 
            screen reader, or voice commands.
          </p>
        </section>
      </div>
    </>
  )
}

export default Home
