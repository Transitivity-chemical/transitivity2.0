'use client';

/**
 * Plotly.js chart wrapper. Lazy-loaded (SSR disabled) so plotly's 3 MB
 * bundle only lands on pages that actually need charts.
 *
 * Pattern: dynamic import with ssr:false → React.Suspense fallback →
 * theme-aware layout merge.
 *
 * Reference: docs/tabs-rebuild-impeccable-plan.md Phase 2
 */

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import type { Data, Layout, Config } from 'plotly.js';
import { getPlotlyLayout, getPlotlyConfig } from '@/lib/plotly-theme';

const Plot = dynamic(() => import('react-plotly.js'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center rounded-md border bg-muted/20 text-sm text-muted-foreground">
      Loading chart…
    </div>
  ),
});

export interface PlotlyChartProps {
  data: Data[];
  layout?: Partial<Layout>;
  config?: Partial<Config>;
  className?: string;
  style?: React.CSSProperties;
  ariaLabel?: string;
}

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

export function PlotlyChart({ data, layout, config, className, style, ariaLabel }: PlotlyChartProps) {
  const isDark = useDarkMode();
  const mode = isDark ? 'dark' : 'light';
  const mergedLayout = getPlotlyLayout(mode, layout);
  const mergedConfig = getPlotlyConfig(config);
  const computedLabel = ariaLabel ?? (layout?.title as Layout['title'])?.text ?? 'Painel químico · Chemistry chart';

  return (
    <div
      className={className}
      style={{ width: '100%', height: '100%', ...style }}
      role="img"
      aria-label={computedLabel}
    >
      <Plot
        data={data}
        layout={mergedLayout}
        config={mergedConfig}
        useResizeHandler
        style={{ width: '100%', height: '100%' }}
        aria-label={computedLabel}
      />
    </div>
  );
}
