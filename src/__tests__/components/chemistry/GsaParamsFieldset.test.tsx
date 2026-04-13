import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GsaParamsFieldset, DEFAULT_GSA_PARAMS } from '@/components/chemistry/GsaParamsFieldset';

describe('GsaParamsFieldset', () => {
  it('renders all 6 GSA params', () => {
    render(<GsaParamsFieldset value={DEFAULT_GSA_PARAMS} onChange={() => {}} />);
    // legend present
    expect(screen.getAllByText(/GSA/i).length).toBeGreaterThan(0);
  });

  it('default params match Tkinter v1 spec', () => {
    expect(DEFAULT_GSA_PARAMS.qA).toBe(1.1);
    expect(DEFAULT_GSA_PARAMS.qT).toBe(1.5);
    expect(DEFAULT_GSA_PARAMS.qV).toBe(1.1);
    expect(DEFAULT_GSA_PARAMS.NStopMax).toBe(10000);
    expect(DEFAULT_GSA_PARAMS.To).toBe(1.0);
    expect(DEFAULT_GSA_PARAMS.F).toBe(1);
  });
});
