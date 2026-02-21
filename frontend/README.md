# Operator Frontend

Accessible, voice-first React application built with the Clarity Design System.

## Features

- ✅ **WCAG 2.2 AAA Compliant**: Strictly adheres to the highest accessibility standards
- 🎨 **Clarity Design System**: High-contrast themes, large touch targets, and hyperlegible typography
- 🗣️ **Voice-First Interface**: Microphone-enabled AI assistant panel
- ⌨️ **Keyboard Navigation**: Full keyboard accessibility throughout
- 📱 **Responsive Layout**: 70/30 Canvas/Agent Panel split
- 🔍 **Focus Management**: Automatic focus handling on route changes
- 📖 **Screen Reader Optimized**: Semantic HTML and ARIA attributes

## Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite (fast HMR for rapid iteration)
- **Routing**: React Router v6 with react-helmet-async
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI (headless, accessible components)
- **Linting**: ESLint with jsx-a11y (strict mode)
- **Documentation**: Storybook with a11y addon

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
cd frontend
npm install
```

### Development

```bash
npm run dev
```

Opens at [http://localhost:3000](http://localhost:3000)

### Build

```bash
npm run build
```

### Linting

```bash
npm run lint
```

Build will fail if accessibility rules are violated.

### Storybook

```bash
npm run storybook
```

View component documentation at [http://localhost:6006](http://localhost:6006)

## Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Layout.tsx       # Main layout wrapper
│   │   ├── Canvas.tsx       # 70% main viewport
│   │   ├── AgentPanel.tsx   # 30% AI assistant sidebar
│   │   ├── MicrophoneButton.tsx
│   │   ├── ChatLog.tsx
│   │   └── ActionButtons.tsx
│   ├── pages/               # Route pages
│   │   └── Home.tsx
│   ├── App.tsx              # Root application
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles
├── .storybook/              # Storybook configuration
├── index.html
├── vite.config.ts
├── tailwind.config.js       # Clarity Design System
└── .eslintrc.cjs            # Strict accessibility rules
```

## Clarity Design System

### Colors

- **Dark Canvas**: `#121212` with `#FFFFFF` text
- **Light Canvas**: `#FAFAFA` with `#000000` text
- **Focus/Listening**: `#FFB000` (Amber)

### Typography

- **Font**: Atkinson Hyperlegible
- **Base Size**: 18px (scalable to 300%)
- **Line Height**: 1.5x for readability

### Touch Targets

All interactive elements are minimum **48x48px**.

### Focus Indicators

- 3px solid amber outline
- 2px offset
- Visible for keyboard navigation only

## Accessibility Testing

1. **Automated**: Run `npm run lint` for jsx-a11y violations
2. **Storybook**: Use a11y addon to test components
3. **Manual**: Test with:
   - Screen readers (NVDA, JAWS, VoiceOver)
   - Keyboard-only navigation
   - Browser zoom (up to 300%)
   - High contrast mode

## Key Components

### Layout
Main application structure with focus management on route changes.

### Canvas
Displays simplified, noise-free content with maximum readability.

### AgentPanel
Voice-first sidebar featuring:
- Large microphone toggle
- High-contrast chat log
- One-tap action buttons

## Contributing

When adding new components:
1. Ensure semantic HTML
2. Add proper ARIA attributes
3. Test with screen readers
4. Create Storybook story
5. Verify 48px minimum touch targets
6. Check color contrast ratios

## License

MIT
