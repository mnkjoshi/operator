import type { Meta, StoryObj } from '@storybook/react';
import MicrophoneButton from './MicrophoneButton';

const meta = {
  title: 'Components/MicrophoneButton',
  component: MicrophoneButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    isListening: {
      control: 'boolean',
      description: 'Whether the microphone is actively listening',
    },
    onToggle: {
      action: 'toggled',
      description: 'Callback fired when button is clicked',
    },
  },
} satisfies Meta<typeof MicrophoneButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    isListening: false,
    onToggle: () => undefined,
  },
};

export const Listening: Story = {
  args: {
    isListening: true,
    onToggle: () => undefined,
  },
};

export const Interactive: Story = {
  args: {
    isListening: false,
    onToggle: () => undefined,
  },
  play: async ({ canvasElement }) => {
    // Accessibility testing example
    const button = canvasElement.querySelector('button');
    if (button) {
      // Verify button has proper ARIA attributes
      console.log('ARIA Label:', button.getAttribute('aria-label'));
      console.log('ARIA Pressed:', button.getAttribute('aria-pressed'));
    }
  },
};
