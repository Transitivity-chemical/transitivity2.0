import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/en/dashboard',
}));

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: (ns: string) => {
    const translations: Record<string, Record<string, string>> = {
      nav: {
        dashboard: 'Dashboard',
        rateConstant: 'Rate Constant',
        fitting: 'Fitting',
        md: 'Molecular Dynamics',
        ml: 'Machine Learning',
        assistant: 'Assistant',
        serverStatus: 'Server Status',
        wiki: 'Wiki',
      },
      common: {
        credits: 'credits',
      },
    };
    return (key: string) => translations[ns]?.[key] ?? key;
  },
  useLocale: () => 'en',
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

// Mock tooltip components (radix-based, not trivial in jsdom)
vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import { Sidebar } from '@/components/layout/Sidebar';

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hides server status for non-admin users', () => {
    render(<Sidebar role="USER" />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Rate Constant')).toBeInTheDocument();
    expect(screen.getByText('Fitting')).toBeInTheDocument();
    expect(screen.getByText('Molecular Dynamics')).toBeInTheDocument();
    expect(screen.getByText('Machine Learning')).toBeInTheDocument();
    expect(screen.getByText('Assistant')).toBeInTheDocument();
    expect(screen.queryByText('Server Status')).not.toBeInTheDocument();
    expect(screen.getByText('Wiki')).toBeInTheDocument();
  });

  it('shows server status for admin users', () => {
    render(<Sidebar role="ADMIN" />);
    expect(screen.getByText('Server Status')).toBeInTheDocument();
  });

  it('displays FREE tier badge by default', () => {
    render(<Sidebar />);
    expect(screen.getByText('FREE')).toBeInTheDocument();
  });

  it('displays credits with progress bar for FREE tier', () => {
    render(<Sidebar credits={25} tier="FREE" />);
    expect(screen.getByText('25 / 50 credits')).toBeInTheDocument();
  });

  it('displays "unlimited" for PRO tier', () => {
    render(<Sidebar credits={0} tier="PRO" />);
    expect(screen.getByText('PRO')).toBeInTheDocument();
    expect(screen.getByText('credits: unlimited')).toBeInTheDocument();
  });

  it('collapses sidebar when toggle button is clicked', async () => {
    const user = userEvent.setup();
    const { container } = render(<Sidebar />);

    // Initially the text labels should be visible
    expect(screen.getByText('Dashboard')).toBeInTheDocument();

    // Click the collapse button (the button inside the header)
    const buttons = container.querySelectorAll('button');
    const collapseBtn = buttons[0]; // first button is the collapse toggle
    await user.click(collapseBtn);

    // After collapse, text labels should be hidden (the aside width changes)
    const aside = container.querySelector('aside');
    expect(aside).toHaveClass('w-16');
  });

  it('has navigation links with correct locale prefix', () => {
    render(<Sidebar />);
    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink).toHaveAttribute('href', '/en/dashboard');
  });
});
