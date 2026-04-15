'use client';

/**
 * SimpleChart — Plotly-backed (plotly.js 2.35 + react-plotly.js 2.6, compatible
 * pair). Plotly is self-hosted via npm bundle so no third-party CDN.
 *
 * Keeps the original series-based API so every existing caller
 * (FittingWorkbench, RateConstantWorkbench, FittingResults) works unchanged.
 *
 * Falls back to a tiny Recharts LineChart if the Plotly dynamic import fails
 * to resolve within 4 s — keeps charts working even if plotly.js ever breaks
 * again after an upgrade.
 */

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import type { Data, Layout } from 'plotly.js';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  Legend as RLegend,
  ResponsiveContainer,
} from 'recharts';

const Plot = dynamic(() => import('react-plotly.js'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center rounded-md border bg-muted/20 text-sm text-muted-foreground">
      Loading chart…
    </div>
  ),
});

interface DataSeries {
  label: string;
  x: number[];
  y: number[];
  color?: string;
  type?: 'scatter' | 'line';
}

interface SimpleChartProps {
  series: DataSeries[];
  xLabel?: string;
  yLabel?: string;
  title?: string;
  width?: number;
  height?: number;
}

const DEFAULT_COLORS = ['#1e3a5f', '#d97706', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'];

function useDarkMode(): boolean {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const check = () => setDark(document.documentElement.classList.contains('dark'));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);
  return dark;
}

// Tracks whether Plotly ever failed to load. Fallback to Recharts if so.
let plotlyFailed = false;

export function SimpleChart({
  series,
  xLabel,
  yLabel,
  title,
  height = 400,
}: SimpleChartProps) {
  const isDark = useDarkMode();
  const [useFallback, setUseFallback] = useState(plotlyFailed);

  useEffect(() => {
    // If Plotly hasn't mounted in 4 s, flip to Recharts fallback.
    if (useFallback) return;
    const timer = setTimeout(() => {
      const plotlyLoaded =
        typeof window !== 'undefined' &&
        (window as unknown as { Plotly?: unknown }).Plotly;
      if (!plotlyLoaded) {
        plotlyFailed = true;
        setUseFallback(true);
      }
    }, 4000);
    return () => clearTimeout(timer);
  }, [useFallback]);

  const data: Data[] = useMemo(
    () =>
      series.map((s, i) => {
        const color = s.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length];
        return {
          x: s.x,
          y: s.y,
          name: s.label,
          type: 'scatter',
          mode: s.type === 'line' ? 'lines' : 'markers',
          marker: { color, size: 6 },
          line: { color, width: 2 },
        } as Data;
      }),
    [series],
  );

  const layout: Partial<Layout> = useMemo(() => {
    const ink = isDark ? '#e5e5e5' : '#1f2937';
    const muted = isDark ? '#a3a3a3' : '#6b7280';
    const grid = isDark ? '#262626' : '#e5e7eb';
    return {
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent',
      font: {
        family: '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
        size: 12,
        color: ink,
      },
      margin: { l: 60, r: 20, t: title ? 40 : 16, b: 50 },
      title: title ? { text: title, font: { size: 14, color: ink } } : undefined,
      xaxis: {
        title: xLabel ? { text: xLabel, font: { color: ink, size: 12 } } : undefined,
        gridcolor: grid,
        linecolor: grid,
        zerolinecolor: grid,
        tickfont: { color: muted, size: 11 },
      },
      yaxis: {
        title: yLabel ? { text: yLabel, font: { color: ink, size: 12 } } : undefined,
        gridcolor: grid,
        linecolor: grid,
        zerolinecolor: grid,
        tickfont: { color: muted, size: 11 },
      },
      hovermode: 'closest',
      showlegend: series.length > 1,
      legend: {
        bgcolor: 'rgba(0,0,0,0)',
        bordercolor: grid,
        borderwidth: 0,
        font: { color: ink, size: 11 },
      },
    };
  }, [isDark, series.length, title, xLabel, yLabel]);

  if (useFallback) {
    // ─── Recharts fallback path ────────────────────────────────────────
    const merged = (() => {
      const map = new Map<number, Record<string, number>>();
      for (let i = 0; i < series.length; i++) {
        const s = series[i];
        for (let j = 0; j < s.x.length; j++) {
          const row = map.get(s.x[j]) ?? { x: s.x[j] };
          row[`s${i}`] = s.y[j];
          map.set(s.x[j], row);
        }
      }
      return [...map.values()].sort((a, b) => a.x - b.x);
    })();
    return (
      <div style={{ width: '100%', height }}>
        {title && <p className="mb-2 text-center text-sm font-semibold">{title}</p>}
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={merged} margin={{ top: 8, right: 16, bottom: 28, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
            <XAxis dataKey="x" type="number" domain={['auto', 'auto']} tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <RTooltip />
            {series.length > 1 && <RLegend wrapperStyle={{ fontSize: 11 }} />}
            {series.map((s, i) => (
              <Line
                key={i}
                type="monotone"
                dataKey={`s${i}`}
                name={s.label}
                stroke={s.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
                strokeWidth={2}
                dot={s.type === 'line' ? false : { r: 3 }}
                isAnimationActive
                animationDuration={600}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height }}>
      <Plot
        data={data}
        layout={layout}
        config={{
          responsive: true,
          displaylogo: false,
          modeBarButtonsToRemove: ['lasso2d', 'select2d', 'autoScale2d'],
        }}
        useResizeHandler
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
