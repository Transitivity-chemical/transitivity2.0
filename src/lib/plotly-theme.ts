/**
 * Centralized Plotly theme. Linear + OpenRouter + Mac-first muted aesthetic.
 *
 * Usage:
 *   import { getPlotlyLayout } from '@/lib/plotly-theme';
 *   <PlotlyChart data={...} layout={getPlotlyLayout('dark')} />
 *
 * Reference: docs/tabs-rebuild-impeccable-plan.md §8.2
 */

import type { Layout, Config } from 'plotly.js';

type ThemeMode = 'light' | 'dark';

const PALETTE = {
  light: {
    paper: '#ffffff',
    plot: '#f8f9fa',
    grid: '#e5e7eb',
    text: '#1f2937',
    mutedText: '#6b7280',
    series: ['#1e3a5f', '#60a5fa', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'],
  },
  dark: {
    paper: '#0a0a0a',
    plot: '#111111',
    grid: '#262626',
    text: '#e5e5e5',
    mutedText: '#a3a3a3',
    series: ['#60a5fa', '#1e3a5f', '#fbbf24', '#34d399', '#f87171', '#a78bfa', '#f472b6'],
  },
} as const;

export function getPlotlyLayout(mode: ThemeMode = 'light', overrides: Partial<Layout> = {}): Partial<Layout> {
  const c = PALETTE[mode];
  return {
    paper_bgcolor: c.paper,
    plot_bgcolor: c.plot,
    font: {
      family: '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
      size: 13,
      color: c.text,
    },
    xaxis: {
      gridcolor: c.grid,
      linecolor: c.grid,
      zerolinecolor: c.grid,
      tickfont: { color: c.mutedText, size: 11 },
      title: { font: { color: c.text, size: 12 } },
    },
    yaxis: {
      gridcolor: c.grid,
      linecolor: c.grid,
      zerolinecolor: c.grid,
      tickfont: { color: c.mutedText, size: 11 },
      title: { font: { color: c.text, size: 12 } },
    },
    margin: { l: 60, r: 20, t: 40, b: 50 },
    hovermode: 'closest',
    showlegend: true,
    legend: {
      bgcolor: 'rgba(0,0,0,0)',
      bordercolor: c.grid,
      borderwidth: 0,
      font: { color: c.text, size: 11 },
    },
    ...overrides,
  };
}

export function getPlotlyConfig(overrides: Partial<Config> = {}): Partial<Config> {
  return {
    responsive: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['lasso2d', 'select2d', 'autoScale2d'],
    ...overrides,
  };
}

export function getSeriesColors(mode: ThemeMode = 'light'): readonly string[] {
  return PALETTE[mode].series;
}
