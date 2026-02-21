# Contributing to Operator

Thank you for your interest in contributing to Operator! This guide will help you get started.

## 🌟 Mission

Operator exists to eliminate technological barriers for users with high-accessibility needs. Every contribution should keep this mission at the forefront.

## 🎯 Core Principles

1. **Accessibility First**: WCAG 2.2 AAA compliance is non-negotiable
2. **Semantic HTML**: Use proper HTML5 elements before adding ARIA
3. **Keyboard Navigation**: Everything must be accessible via keyboard
4. **Screen Reader Friendly**: Test with NVDA, JAWS, or VoiceOver
5. **Large Touch Targets**: Minimum 48x48px for all interactive elements
6. **High Contrast**: Maintain color contrast ratios for visibility

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Python 3.9+
- Git

### Setup

```bash
git clone https://github.com/yourusername/operator.git
cd operator
powershell -ExecutionPolicy Bypass -File ./setup.ps1
```

Or manually:

```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
pip install -r requirements.txt
cp .env.example .env
# Add your API keys to .env
```

### Development Workflow

1. Create a new branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Test accessibility (see below)
4. Run linter: `cd frontend && npm run lint`
5. Commit with descriptive message
6. Push and create a Pull Request

## 🧪 Testing Requirements

### Before Submitting a PR

- [ ] All ESLint rules pass (`npm run lint`)
- [ ] No TypeScript errors
- [ ] Manual keyboard navigation works
- [ ] Screen reader announces content correctly
- [ ] All interactive elements have 48px minimum size
- [ ] Color contrast meets WCAG AAA (7:1 for normal text)
- [ ] Focus indicators are visible
- [ ] Component has Storybook story (for UI components)

### Accessibility Testing Checklist

#### Automated

```bash
cd frontend
npm run lint  # jsx-a11y rules
npm run storybook  # Check a11y addon
```

#### Manual Testing

1. **Keyboard Navigation**
   - Tab through all interactive elements
   - Ensure focus order is logical
   - Verify focus indicators are visible
   - Test Escape, Enter, Space keys

2. **Screen Reader** (NVDA on Windows, VoiceOver on macOS)
   - Navigate page by headings (H key)
   - Navigate by landmarks (D key)
   - Verify announcements are clear
   - Check ARIA live regions

3. **Visual**
   - Test at 300% zoom
   - Use high contrast mode
   - Simulate color blindness
   - Check with Windows Narrator

4. **Mobile**
   - Test touch targets (minimum 48px)
   - Verify gestures work
   - Check viewport scaling

## 📝 Code Style

### Frontend (TypeScript/React)

```typescript
// ✅ Good: Semantic HTML with proper ARIA
<button
  onClick={handleClick}
  aria-label="Start listening"
  aria-pressed={isListening}
>
  Speak
</button>

// ❌ Bad: Div with onClick (not keyboard accessible)
<div onClick={handleClick}>Speak</div>

// ✅ Good: Descriptive alt text
<img src="logo.svg" alt="Operator logo" />

// ❌ Bad: Missing alt text
<img src="logo.svg" />
```

### Component Structure

```typescript
import { useRef, useEffect } from 'react'

interface MyComponentProps {
  title: string
  onAction: (action: string) => void
}

/**
 * Brief description of what the component does
 *
 * Accessibility features:
 * - Keyboard navigable
 * - Screen reader compatible
 * - High contrast support
 */
const MyComponent = ({ title, onAction }: MyComponentProps) => {
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    // Focus management if needed
  }, [])

  return (
    <section aria-labelledby="my-heading">
      <h2 id="my-heading" ref={headingRef}>
        {title}
      </h2>
      {/* Component content */}
    </section>
  )
}

export default MyComponent
```

### Backend (Python/FastAPI)

```python
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

class RequestModel(BaseModel):
    """Request model with validation"""
    text: str
    option: str | None = None

@router.post("/endpoint")
async def endpoint(request: RequestModel):
    """
    Brief description of endpoint

    Args:
        request: Request model

    Returns:
        Response data

    Raises:
        HTTPException: If operation fails
    """
    try:
        # Implementation
        return {"result": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

## 🎨 Adding New Components

### 1. Create the Component

```bash
cd frontend/src/components
```

```typescript
// MyComponent.tsx
import { ComponentProps } from './types'

const MyComponent = ({ ...props }: ComponentProps) => {
  return (
    <div role="region" aria-label="My component">
      {/* Implementation */}
    </div>
  )
}

export default MyComponent
```

### 2. Create Storybook Story

```typescript
// MyComponent.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import MyComponent from "./MyComponent";

const meta = {
  title: "Components/MyComponent",
  component: MyComponent,
  tags: ["autodocs"],
} satisfies Meta<typeof MyComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    // Props
  },
};
```

### 3. Test Accessibility

```bash
npm run storybook
# Check a11y addon tab for violations
```

## 🐛 Reporting Issues

When reporting issues, please include:

1. **Description**: Clear description of the issue
2. **Steps to Reproduce**: Detailed steps
3. **Expected Behavior**: What should happen
4. **Actual Behavior**: What actually happens
5. **Accessibility Impact**: How it affects users
6. **Environment**:
   - OS and version
   - Browser and version
   - Screen reader (if applicable)
   - Assistive technology used

## 🎯 Good First Issues

Look for issues labeled `good-first-issue` in the GitHub repository. These are specifically chosen to be approachable for new contributors.

## 📚 Resources

### Accessibility

- [WCAG 2.2 Guidelines](https://www.w3.org/WAI/WCAG22/quickref/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [WebAIM](https://webaim.org/)
- [A11y Project](https://www.a11yproject.com/)

### React & TypeScript

- [React Docs](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Radix UI](https://www.radix-ui.com/)

### Testing

- [eslint-plugin-jsx-a11y](https://github.com/jsx-eslint/eslint-plugin-jsx-a11y)
- [Storybook a11y addon](https://storybook.js.org/addons/@storybook/addon-a11y)

## 💬 Questions?

Feel free to:

- Open a GitHub Discussion
- Ask in issues
- Review existing documentation

## 📜 Code of Conduct

Be respectful, inclusive, and constructive. We're building technology to help people - let's create a welcoming community that reflects that mission.

---

**Thank you for contributing to Operator!** 🎉
