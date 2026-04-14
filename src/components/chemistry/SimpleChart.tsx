'use client';

/**
 * SimpleChart — Recharts-backed chart, fully self-hosted.
 *
 * Replaces the Plotly shim. Keeps the original series-based API so every
 * existing caller (FittingWorkbench, RateConstantWorkbench, FittingResults)
 * works without changes.
 *
 * Plotly.js 3.x is incompatible with react-plotly.js 2.x (the wrapper still
 * assumes 1.x module shape), so we drop the dynamic-import path entirely and
 * render with Recharts which is ~100KB, pure React, MIT-licensed, and has no
 * SSR issues.
 */

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
} from 'recharts';

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

export function SimpleChart({
  series,
  xLabel,
  yLabel,
  title,
  height = 360,
}: SimpleChartProps) {
  // Merge all series into rows keyed by x value so Recharts can draw
  // multiple Lines on a shared axis. Each row looks like { x: 2.5, sA: -10, sB: -9.8 }.
  const merged = useMemo(() => {
    const map = new Map<number, Record<string, number>>();
    for (let i = 0; i < series.length; i++) {
      const s = series[i];
      for (let j = 0; j < s.x.length; j++) {
        const key = s.x[j];
        const row = map.get(key) ?? { x: key };
        row[`s${i}`] = s.y[j];
        map.set(key, row);
      }
    }
    return [...map.values()].sort((a, b) => a.x - b.x);
  }, [series]);

  const hasScatter = series.some((s) => s.type === 'scatter' || !s.type);
  const hasLine = series.some((s) => s.type === 'line');

  return (
    <div style={{ width: '100%', height }}>
      {title && (
        <p className="mb-2 text-center text-sm font-semibold tracking-tight">{title}</p>
      )}
      <ResponsiveContainer width="100%" height="100%">
        {hasLine && !hasScatter ? (
          <LineChart data={merged} margin={{ top: 12, right: 16, bottom: 28, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
            <XAxis
              dataKey="x"
              type="number"
              domain={['auto', 'auto']}
              tick={{ fontSize: 11 }}
              label={xLabel ? { value: xLabel, position: 'insideBottom', offset: -10, fontSize: 11 } : undefined}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              label={yLabel ? { value: yLabel, angle: -90, position: 'insideLeft', fontSize: 11 } : undefined}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--popover)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                fontSize: 12,
              }}
            />
            {series.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
            {series.map((s, i) => (
              <Line
                key={i}
                type="monotone"
                dataKey={`s${i}`}
                name={s.label}
                stroke={s.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
                strokeWidth={2}
                dot={false}
                isAnimationActive={true}
                animationDuration={800}
              />
            ))}
          </LineChart>
        ) : (
          <ScatterChart margin={{ top: 12, right: 16, bottom: 28, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
            <XAxis
              dataKey="x"
              type="number"
              domain={['auto', 'auto']}
              tick={{ fontSize: 11 }}
              label={xLabel ? { value: xLabel, position: 'insideBottom', offset: -10, fontSize: 11 } : undefined}
            />
            <YAxis
              dataKey="y"
              type="number"
              tick={{ fontSize: 11 }}
              label={yLabel ? { value: yLabel, angle: -90, position: 'insideLeft', fontSize: 11 } : undefined}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--popover)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                fontSize: 12,
              }}
            />
            {series.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
            {series.map((s, i) => {
              const color = s.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length];
              const data = s.x.map((xv, idx) => ({ x: xv, y: s.y[idx] }));
              if (s.type === 'line') {
                return (
                  <Scatter
                    key={i}
                    name={s.label}
                    data={data}
                    line={{ stroke: color, strokeWidth: 2 }}
                    lineType="joint"
                    fill={color}
                    shape={() => <></>}
                    isAnimationActive={true}
                    animationDuration={800}
                  />
                );
              }
              return (
                <Scatter
                  key={i}
                  name={s.label}
                  data={data}
                  fill={color}
                  isAnimationActive={true}
                  animationDuration={800}
                />
              );
            })}
          </ScatterChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
