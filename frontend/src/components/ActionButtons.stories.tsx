import type { Meta, StoryObj } from '@storybook/react';
import ActionButtons from './ActionButtons';

const meta = {
  title: 'Components/ActionButtons',
  component: ActionButtons,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    onAction: {
      action: 'action-clicked',
      description: 'Callback fired when an action button is clicked',
    },
  },
} satisfies Meta<typeof ActionButtons>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const WithCustomActions: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Action buttons provide one-tap access to common tasks like reading content aloud, simplifying text, and explaining concepts.',
      },
    },
  },
};
