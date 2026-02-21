interface Message {
  role: 'user' | 'agent'
  text: string
}

interface ChatLogProps {
  messages: Message[]
}

/**
 * High-contrast chat log with ARIA live region
 */
const ChatLog = ({ messages }: ChatLogProps) => {
  return (
    <div
      role="log"
      aria-live="polite"
      aria-label="Conversation history"
      className="space-y-4"
    >
      {messages.length === 0 ? (
        <p className="text-gray-400 text-center py-8">
          No messages yet. Start speaking to begin.
        </p>
      ) : (
        messages.map((message, index) => (
          <div
            key={index}
            className={`
              p-4 rounded-lg
              ${message.role === 'user' 
                ? 'bg-gray-800 text-white ml-4' 
                : 'bg-gray-700 text-white mr-4'
              }
            `}
          >
            <div className="font-bold mb-1">
              {message.role === 'user' ? 'You' : 'Agent'}
            </div>
            <div>{message.text}</div>
          </div>
        ))
      )}
    </div>
  )
}

export default ChatLog
