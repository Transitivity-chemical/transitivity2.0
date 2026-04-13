import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InitialParamsFieldset } from '@/components/chemistry/InitialParamsFieldset';

describe('InitialParamsFieldset', () => {
  const params = [
    { key: 'A', label: 'A', default: 0.1 },
    { key: 'Eo', label: 'Eo', default: 0.1 },
  ];

  it('renders one row per param with Lock checkbox', () => {
    render(
      <InitialParamsFieldset
        params={params}
        values={{ A: { value: 0.1, locked: false }, Eo: { value: 0.1, locked: false } }}
        onChange={() => {}}
      />,
    );
    const locks = screen.getAllByRole('checkbox');
    expect(locks).toHaveLength(2);
    expect(screen.getByText('A')).toBeTruthy();
    expect(screen.getByText('Eo')).toBeTruthy();
  });

  it('fires onChange when Lock toggled', () => {
    const onChange = vi.fn();
    render(
      <InitialParamsFieldset
        params={params}
        values={{ A: { value: 0.1, locked: false }, Eo: { value: 0.1, locked: false } }}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getAllByRole('checkbox')[0]);
    expect(onChange).toHaveBeenCalledWith('A', { value: 0.1, locked: true });
  });
});
