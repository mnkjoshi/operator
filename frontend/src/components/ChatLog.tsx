interface Message {
  role: 'user' | 'agent'
  text: string
}

interface ChatLogProps {
  messages: Message[]
}

const ChatLog = ({ messages }: ChatLogProps) => {
  return (
    <div
      role="log"
      aria-live="polite"
      aria-label="Conversation history"
      className="space-y-2"
    >
      {messages.length === 0 ? (
        <div className="h-full min-h-[120px]" />
      ) : (
        messages.map((message, index) => (
          <div
            key={index}
            className={`
              max-w-[92%] px-3 py-2 rounded-xl text-sm
              ${message.role === 'user' 
                ? 'bg-[var(--bg-panel-elev)] text-[var(--text-primary)] ml-auto' 
                : 'bg-[var(--bg-panel-soft)] text-[var(--text-muted)] mr-auto'
              }
            `}
          >
            <div>{message.text}</div>
          </div>
        ))
      )}
    </div>
  )
}

export default ChatLog
