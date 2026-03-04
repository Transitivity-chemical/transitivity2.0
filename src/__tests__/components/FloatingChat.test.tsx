import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock next/navigation
const mockPathname = vi.fn<() => string>();
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
}));

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  X: ({ size }: { size?: number }) => <span data-testid="x-icon" data-size={size}>X</span>,
  Send: ({ size }: { size?: number }) => <span data-testid="send-icon" data-size={size}>Send</span>,
  ChevronDown: ({ size }: { size?: number }) => <span data-testid="chevron-icon" data-size={size}>ChevronDown</span>,
  Crown: ({ size }: { size?: number }) => <span data-testid="crown-icon" data-size={size}>Crown</span>,
}));

// Mock ai-providers icons
vi.mock('@/components/icons/ai-providers', () => ({
  PROVIDER_ICONS: {},
}));

import { FloatingChat } from '@/components/chat/FloatingChat';

describe('FloatingChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders floating button when not on /assistant page', () => {
    mockPathname.mockReturnValue('/dashboard');
    render(<FloatingChat />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('returns null when pathname includes /assistant', () => {
    mockPathname.mockReturnValue('/en/dashboard/assistant');
    const { container } = render(<FloatingChat />);
    expect(container.innerHTML).toBe('');
  });

  it('returns null for /assistant path', () => {
    mockPathname.mockReturnValue('/assistant');
    const { container } = render(<FloatingChat />);
    expect(container.innerHTML).toBe('');
  });

  it('renders the floating button with correct classes', () => {
    mockPathname.mockReturnValue('/dashboard');
    render(<FloatingChat />);
    const buttons = screen.getAllByRole('button');
    // The last button is the floating action button
    const fab = buttons[buttons.length - 1];
    expect(fab).toHaveClass('fixed');
    expect(fab).toHaveClass('rounded-full');
  });

  it('renders GammaIcon SVG inside the floating button', () => {
    mockPathname.mockReturnValue('/dashboard');
    const { container } = render(<FloatingChat />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});
