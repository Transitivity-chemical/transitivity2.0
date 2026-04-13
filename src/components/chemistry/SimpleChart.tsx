'use client';

/**
 * Drop-in Plotly-backed chart preserving the legacy SimpleChart API.
 * New code should import PlotlyChart directly.
 */

import { useEffect, useState } from 'react';
import type { Data } from 'plotly.js';
import { PlotlyChart } from './PlotlyChart';
import { getSeriesColors } from '@/lib/plotly-theme';

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

export function SimpleChart({
  series,
  xLabel,
  yLabel,
  title,
  width = 600,
  height = 400,
}: SimpleChartProps) {
  const [mode, setMode] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const update = () =>
      setMode(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const palette = getSeriesColors(mode);
  const data: Data[] = series.map((s, i) => ({
    x: s.x,
    y: s.y,
    name: s.label,
    type: 'scatter',
    mode: s.type === 'line' ? 'lines' : 'markers',
    marker: { color: s.color || palette[i % palette.length], size: 6 },
    line: { color: s.color || palette[i % palette.length], width: 2 },
  }));

  return (
    <div style={{ width: '100%', maxWidth: width, height }}>
      <PlotlyChart
        data={data}
        layout={{
          title: title ? { text: title } : undefined,
          xaxis: { title: xLabel ? { text: xLabel } : undefined },
          yaxis: { title: yLabel ? { text: yLabel } : undefined },
          showlegend: series.length > 1,
        }}
        ariaLabel={title ?? 'Série química · Chemistry plot'}
      />
    </div>
  );
}
