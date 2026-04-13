import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TemperatureConfig, DEFAULT_TEMPERATURES } from '@/components/chemistry/TemperatureConfig';

describe('TemperatureConfig', () => {
  it('renders with default temperature count', () => {
    render(<TemperatureConfig value={[...DEFAULT_TEMPERATURES]} onChange={() => {}} />);
    expect(screen.getAllByText(new RegExp(`${DEFAULT_TEMPERATURES.length}`)).length).toBeGreaterThan(0);
  });

  it('toggles between default and custom mode', () => {
    const onChange = vi.fn();
    render(<TemperatureConfig value={[...DEFAULT_TEMPERATURES]} onChange={onChange} />);
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });
});
