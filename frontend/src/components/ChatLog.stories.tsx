import type { Meta, StoryObj } from '@storybook/react';
import ChatLog from './ChatLog';

const meta = {
  title: 'Components/ChatLog',
  component: ChatLog,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ChatLog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: {
    messages: [],
  },
};

export const WithMessages: Story = {
  args: {
    messages: [
      { role: 'user', text: 'Can you read this page to me?' },
      { role: 'agent', text: 'Of course! I\'ll read the content on this page for you.' },
      { role: 'user', text: 'Make it simpler please' },
      { role: 'agent', text: 'I\'ve simplified the content. Here\'s an easier version...' },
    ],
  },
};

export const LongConversation: Story = {
  args: {
    messages: [
      { role: 'user', text: 'Hello, can you help me?' },
      { role: 'agent', text: 'Hello! I\'m here to help. What do you need?' },
      { role: 'user', text: 'I need to understand this article' },
      { role: 'agent', text: 'I can help with that. Would you like me to read it, simplify it, or explain it?' },
      { role: 'user', text: 'Simplify it please' },
      { role: 'agent', text: 'Here\'s a simplified version of the article...' },
    ],
  },
};
