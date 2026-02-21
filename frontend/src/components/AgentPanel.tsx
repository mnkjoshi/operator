import { useState } from 'react'
import MicrophoneButton from './MicrophoneButton'
import ChatLog from './ChatLog'
import ActionButtons from './ActionButtons'

/**
 * AgentPanel: Voice-first sidebar for AI interaction
 * 
 * Features:
 * - Large microphone toggle
 * - High-contrast chat log
 * - One-tap action buttons
 * - Focus trapped when active
 */
const AgentPanel = () => {
  const [isListening, setIsListening] = useState(false)
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'agent'; text: string }>>([])

  const handleMicrophoneToggle = () => {
    setIsListening(!isListening)
    
    if (!isListening) {
      // Start listening
      console.log('Starting speech recognition...')
      // TODO: Integrate OpenAI Whisper
    } else {
      // Stop listening
      console.log('Stopping speech recognition...')
    }
  }

  const handleAction = (action: string) => {
    console.log('Action triggered:', action)
    setMessages([...messages, { role: 'user', text: `Action: ${action}` }])
    // TODO: Integrate with backend
  }

  return (
    <div className="h-full flex flex-col clarity-canvas p-6">
      <h2 className="text-2xl font-bold mb-6" id="agent-panel-title">
        AI Assistant
      </h2>

      {/* Microphone Toggle */}
      <div className="mb-6">
        <MicrophoneButton
          isListening={isListening}
          onToggle={handleMicrophoneToggle}
        />
      </div>

      {/* Chat Log */}
      <div className="flex-1 mb-6 overflow-auto">
        <ChatLog messages={messages} />
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <ActionButtons onAction={handleAction} />
      </div>

      {/* Status Indicator */}
      <div 
        role="status" 
        aria-live="polite" 
        className="mt-4 text-sm"
        aria-label="Assistant status"
      >
        {isListening ? (
          <span className="text-clarity-focus">🎤 Listening...</span>
        ) : (
          <span>Ready to assist</span>
        )}
      </div>
    </div>
  )
}

export default AgentPanel
