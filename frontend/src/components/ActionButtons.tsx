interface ActionButtonsProps {
  onAction: (action: string) => void
}

/**
 * One-tap action buttons for common tasks
 * All buttons meet 48x48px minimum touch target
 */
const ActionButtons = ({ onAction }: ActionButtonsProps) => {
  const actions = [
    { id: 'read', label: 'Read this to me', icon: '🔊' },
    { id: 'simplify', label: 'Make it simpler', icon: '✨' },
    { id: 'explain', label: 'Explain this', icon: '💡' },
  ]

  return (
    <>
      {actions.map((action) => (
        <button
          key={action.id}
          onClick={() => onAction(action.id)}
          className="
            w-full h-touch rounded-lg
            bg-gray-800 hover:bg-gray-700
            text-white font-medium
            transition-colors duration-200
            flex items-center justify-start gap-3 px-4
          "
          aria-label={action.label}
        >
          <span aria-hidden="true" className="text-2xl">
            {action.icon}
          </span>
          <span>{action.label}</span>
        </button>
      ))}
    </>
  )
}

export default ActionButtons
