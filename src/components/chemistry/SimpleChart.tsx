'use client';

import { useMemo } from 'react';

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

const COLORS = [
  '#2563eb', '#dc2626', '#16a34a', '#d97706', '#7c3aed', '#db2777',
];

const PADDING = { top: 40, right: 30, bottom: 50, left: 70 };

export function SimpleChart({
  series,
  xLabel,
  yLabel,
  title,
  width = 600,
  height = 400,
}: SimpleChartProps) {
  const plotW = width - PADDING.left - PADDING.right;
  const plotH = height - PADDING.top - PADDING.bottom;

  const { xMin, xMax, yMin, yMax } = useMemo(() => {
    let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity;
    for (const s of series) {
      for (const v of s.x) {
        if (isFinite(v)) { xMin = Math.min(xMin, v); xMax = Math.max(xMax, v); }
      }
      for (const v of s.y) {
        if (isFinite(v)) { yMin = Math.min(yMin, v); yMax = Math.max(yMax, v); }
      }
    }
    const xPad = (xMax - xMin) * 0.05 || 1;
    const yPad = (yMax - yMin) * 0.05 || 1;
    return {
      xMin: xMin - xPad,
      xMax: xMax + xPad,
      yMin: yMin - yPad,
      yMax: yMax + yPad,
    };
  }, [series]);

  const toSvgX = (v: number) => PADDING.left + ((v - xMin) / (xMax - xMin)) * plotW;
  const toSvgY = (v: number) => PADDING.top + plotH - ((v - yMin) / (yMax - yMin)) * plotH;

  const xTicks = useMemo(() => {
    const count = 5;
    const step = (xMax - xMin) / count;
    return Array.from({ length: count + 1 }, (_, i) => xMin + i * step);
  }, [xMin, xMax]);

  const yTicks = useMemo(() => {
    const count = 5;
    const step = (yMax - yMin) / count;
    return Array.from({ length: count + 1 }, (_, i) => yMin + i * step);
  }, [yMin, yMax]);

  const formatNum = (v: number) => {
    if (Math.abs(v) < 0.01 || Math.abs(v) >= 10000) return v.toExponential(2);
    return v.toPrecision(4);
  };

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full max-w-[600px] h-auto"
      role="img"
      aria-label={title}
    >
      {/* Background */}
      <rect
        x={PADDING.left}
        y={PADDING.top}
        width={plotW}
        height={plotH}
        fill="var(--color-card, #fff)"
        stroke="var(--color-border, #e5e7eb)"
      />

      {/* Title */}
      {title && (
        <text
          x={width / 2}
          y={20}
          textAnchor="middle"
          className="fill-foreground text-sm font-medium"
          fontSize={14}
        >
          {title}
        </text>
      )}

      {/* Grid + X ticks */}
      {xTicks.map((v, i) => (
        <g key={`x-${i}`}>
          <line
            x1={toSvgX(v)} y1={PADDING.top}
            x2={toSvgX(v)} y2={PADDING.top + plotH}
            stroke="var(--color-border, #e5e7eb)" strokeDasharray="2,3"
          />
          <text
            x={toSvgX(v)} y={PADDING.top + plotH + 16}
            textAnchor="middle" fontSize={10}
            className="fill-muted-foreground"
          >
            {formatNum(v)}
          </text>
        </g>
      ))}

      {/* Grid + Y ticks */}
      {yTicks.map((v, i) => (
        <g key={`y-${i}`}>
          <line
            x1={PADDING.left} y1={toSvgY(v)}
            x2={PADDING.left + plotW} y2={toSvgY(v)}
            stroke="var(--color-border, #e5e7eb)" strokeDasharray="2,3"
          />
          <text
            x={PADDING.left - 6} y={toSvgY(v) + 3}
            textAnchor="end" fontSize={10}
            className="fill-muted-foreground"
          >
            {formatNum(v)}
          </text>
        </g>
      ))}

      {/* Axis labels */}
      {xLabel && (
        <text
          x={PADDING.left + plotW / 2}
          y={height - 6}
          textAnchor="middle" fontSize={12}
          className="fill-foreground"
        >
          {xLabel}
        </text>
      )}
      {yLabel && (
        <text
          x={14}
          y={PADDING.top + plotH / 2}
          textAnchor="middle" fontSize={12}
          className="fill-foreground"
          transform={`rotate(-90, 14, ${PADDING.top + plotH / 2})`}
        >
          {yLabel}
        </text>
      )}

      {/* Data series */}
      {series.map((s, si) => {
        const color = s.color || COLORS[si % COLORS.length];
        const isLine = s.type === 'line';

        if (isLine) {
          const pathData = s.x
            .map((xv, i) => {
              const sx = toSvgX(xv);
              const sy = toSvgY(s.y[i]);
              return `${i === 0 ? 'M' : 'L'} ${sx} ${sy}`;
            })
            .join(' ');

          return (
            <path
              key={si}
              d={pathData}
              fill="none"
              stroke={color}
              strokeWidth={2}
            />
          );
        }

        return (
          <g key={si}>
            {s.x.map((xv, i) => (
              <circle
                key={i}
                cx={toSvgX(xv)}
                cy={toSvgY(s.y[i])}
                r={3}
                fill={color}
              />
            ))}
          </g>
        );
      })}

      {/* Legend */}
      {series.length > 1 && (
        <g>
          {series.map((s, si) => {
            const color = s.color || COLORS[si % COLORS.length];
            const lx = PADDING.left + 10;
            const ly = PADDING.top + 14 + si * 18;
            return (
              <g key={si}>
                <rect x={lx} y={ly - 6} width={12} height={12} rx={2} fill={color} />
                <text
                  x={lx + 16} y={ly + 4}
                  fontSize={10}
                  className="fill-foreground"
                >
                  {s.label}
                </text>
              </g>
            );
          })}
        </g>
      )}
    </svg>
  );
}
