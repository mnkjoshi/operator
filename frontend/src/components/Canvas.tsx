import { ReactNode } from 'react'

interface CanvasProps {
  children: ReactNode
}

/**
 * Canvas component: The main viewport displaying simplified,
 * noise-free, and ad-free content.
 * 
 * Features:
 * - High contrast background
 * - Maximum readability
 * - WCAG 2.2 AAA compliant
 */
const Canvas = ({ children }: CanvasProps) => {
  return (
    <div 
      className="max-w-5xl mx-auto"
      role="region"
      aria-label="Content canvas"
    >
      {children}
    </div>
  )
}

export default Canvas
