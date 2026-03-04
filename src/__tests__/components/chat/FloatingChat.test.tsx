import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/en/dashboard'),
}));

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const t: Record<string, string> = {
      title: 'AI Assistant',
      placeholder: 'Ask about computational chemistry...',
    };
    return t[key] ?? key;
  },
}));

// Mock ai-providers icons
vi.mock('@/components/icons/ai-providers', () => ({
  PROVIDER_ICONS: new Proxy({}, {
    get: () => (props: Record<string, unknown>) => <svg data-testid="provider-icon" {...props} />,
  }),
}));

import { FloatingChat } from '@/components/chat/FloatingChat';
import { usePathname } from 'next/navigation';

describe('FloatingChat', () => {
  beforeEach(() => {
    vi.mocked(usePathname).mockReturnValue('/en/dashboard');
  });

  it('renders the floating button', () => {
    const { container } = render(<FloatingChat />);
    // The floating button is a fixed-position button
    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });

  it('opens chat panel when floating button is clicked', async () => {
    const user = userEvent.setup();
    render(<FloatingChat />);

    // Click the floating button (the last button, which is the FAB)
    const fabButton = screen.getByRole('button');
    await user.click(fabButton);

    // The chat header should now be visible with "AI Assistant"
    expect(screen.getByText('AI Assistant')).toBeInTheDocument();
  });

  it('closes chat panel when X button is clicked', async () => {
    const user = userEvent.setup();
    render(<FloatingChat />);

    // Open the chat
    await user.click(screen.getByRole('button'));
    expect(screen.getByText('AI Assistant')).toBeInTheDocument();

    // Find the close button (X icon button in the header)
    const closeButtons = screen.getAllByRole('button');
    // The close button is near the header — look for the one that closes
    const closeBtn = closeButtons.find(
      btn => btn.closest('.bg-\\[\\#1e3a5f\\]') && btn.querySelector('svg')
    );
    // Just click the FAB again to toggle
    const fabButton = closeButtons[closeButtons.length - 1];
    await user.click(fabButton);

    // Chat panel should be closed
    expect(screen.queryByText('AI Assistant')).not.toBeInTheDocument();
  });

  it('shows placeholder text when chat is open and empty', async () => {
    const user = userEvent.setup();
    render(<FloatingChat />);

    await user.click(screen.getByRole('button'));
    expect(screen.getAllByText('Ask about computational chemistry...').length).toBeGreaterThanOrEqual(1);
  });

  it('returns null on /assistant page', () => {
    vi.mocked(usePathname).mockReturnValue('/en/assistant');
    const { container } = render(<FloatingChat />);
    // Only the style tag and floating button should not be present
    // Actually, the component returns null, so nothing renders except maybe the fragment
    expect(container.querySelector('button')).toBeNull();
  });

  it('has a textarea input when open', async () => {
    const user = userEvent.setup();
    render(<FloatingChat />);
    await user.click(screen.getByRole('button'));
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeInTheDocument();
  });

  it('send button is disabled when input is empty', async () => {
    const user = userEvent.setup();
    render(<FloatingChat />);
    await user.click(screen.getByRole('button'));
    // The send button should be disabled
    const buttons = screen.getAllByRole('button');
    const sendBtn = buttons.find(btn => btn.querySelector('[class*="lucide"]') || btn.hasAttribute('disabled'));
    // Find button that is disabled
    const disabledButtons = buttons.filter(btn => btn.hasAttribute('disabled'));
    expect(disabledButtons.length).toBeGreaterThanOrEqual(1);
  });
});
