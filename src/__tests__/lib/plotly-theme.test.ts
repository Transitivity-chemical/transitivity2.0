import { describe, it, expect } from 'vitest';
import { getPlotlyLayout, getPlotlyConfig, getSeriesColors } from '@/lib/plotly-theme';

describe('plotly-theme', () => {
  it('light layout has white paper background', () => {
    expect(getPlotlyLayout('light').paper_bgcolor).toBe('#ffffff');
  });

  it('dark layout has near-black paper background', () => {
    expect(getPlotlyLayout('dark').paper_bgcolor).toBe('#0a0a0a');
  });

  it('applies overrides on top of defaults', () => {
    const layout = getPlotlyLayout('light', { title: { text: 'Hi' } });
    expect(layout.title).toEqual({ text: 'Hi' });
    expect(layout.paper_bgcolor).toBe('#ffffff');
  });

  it('config disables logo by default', () => {
    expect(getPlotlyConfig().displaylogo).toBe(false);
  });

  it('returns at least 5 series colors', () => {
    expect(getSeriesColors('light').length).toBeGreaterThanOrEqual(5);
    expect(getSeriesColors('dark').length).toBeGreaterThanOrEqual(5);
  });
});
