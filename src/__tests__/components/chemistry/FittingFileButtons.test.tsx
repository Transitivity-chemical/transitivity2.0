import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FittingFileButtons } from '@/components/chemistry/FittingFileButtons';

describe('FittingFileButtons', () => {
  const noop = () => {};

  it('renders three buttons', () => {
    render(<FittingFileButtons onOpenFile={noop} onSave={noop} onFit={noop} />);
    expect(screen.getAllByRole('button').length).toBeGreaterThanOrEqual(3);
  });

  it('disables Save when canSave=false', () => {
    render(<FittingFileButtons onOpenFile={noop} onSave={noop} onFit={noop} canSave={false} />);
    const saveBtn = screen.getByRole('button', { name: /Save/i });
    expect((saveBtn as HTMLButtonElement).disabled).toBe(true);
  });

  it('disables Fit while fitting=true', () => {
    render(<FittingFileButtons onOpenFile={noop} onSave={noop} onFit={noop} fitting />);
    const fitBtn = screen.getByRole('button', { name: /Fitting/i });
    expect((fitBtn as HTMLButtonElement).disabled).toBe(true);
  });

  it('calls onFit when Fit button clicked', () => {
    const onFit = vi.fn();
    render(<FittingFileButtons onOpenFile={noop} onSave={noop} onFit={onFit} />);
    fireEvent.click(screen.getByRole('button', { name: /Fitting/i }));
    expect(onFit).toHaveBeenCalledOnce();
  });
});
