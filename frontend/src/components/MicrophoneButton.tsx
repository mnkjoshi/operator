interface MicrophoneButtonProps {
  isListening: boolean
  onToggle: () => void
}

/**
 * Large, accessible microphone toggle button
 * Meets 48x48px minimum touch target
 */
const MicrophoneButton = ({ isListening, onToggle }: MicrophoneButtonProps) => {
  return (
    <button
      onClick={onToggle}
      className={`
        w-full h-touch rounded-lg font-bold text-lg
        transition-all duration-200
        ${isListening 
          ? 'bg-clarity-focus text-black ring-4 ring-clarity-focus ring-opacity-50' 
          : 'bg-gray-800 text-white hover:bg-gray-700'
        }
      `}
      aria-label={isListening ? 'Stop listening' : 'Start listening'}
      aria-pressed={isListening}
    >
      <span className="flex items-center justify-center gap-3">
        <svg 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
        </svg>
        {isListening ? 'Stop' : 'Speak'}
      </span>
    </button>
  )
}

export default MicrophoneButton
