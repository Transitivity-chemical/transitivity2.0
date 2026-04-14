'use client';

/**
 * Mini preview: Arrhenius plot — straight line of ln k vs 1/T, animated
 * data points appearing and fitting line drawing.
 */

import { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import { useAnimate, useInView, useReducedMotion } from 'framer-motion';
import { safe, type ConceptPreviewProps } from '@/components/common/HoverPreviewPopover';

export function ArrheniusPreview({ className }: ConceptPreviewProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [scope, animate] = useAnimate();
  const inView = useInView(ref);
  const reduce = useReducedMotion();
  const colors = {
    '--preview-line': '#1e3a5f',
    '--preview-point': 'oklch(65% 0.18 200)',
  } as CSSProperties;

  useEffect(() => {
    if (!inView || reduce) return;
    let cancelled = false;
    (async () => {
      while (!cancelled) {
        await safe(() =>
          animate('[data-el="pt"]', { opacity: [0, 1], scale: [0.5, 1] }, { duration: 0.6, delay: (i: number) => i * 0.12 }),
        );
        await safe(() =>
          animate('[data-el="fit"]', { pathLength: [0, 1] }, { duration: 1.1, ease: 'easeOut' }),
        );
        await safe(() => animate('[data-el="fit"]', { opacity: [1, 0.5, 1] }, { duration: 1 }));
      }
    })();
    return () => { cancelled = true; };
  }, [inView, reduce, animate]);

  return (
    <div ref={ref} className={className} style={colors}>
      <svg ref={scope} viewBox="0 0 200 100" className="h-full w-full" role="presentation" aria-hidden="true">
        {/* axes */}
        <line x1="20" y1="10" x2="20" y2="88" stroke="currentColor" strokeWidth="1" opacity="0.3" />
        <line x1="20" y1="88" x2="190" y2="88" stroke="currentColor" strokeWidth="1" opacity="0.3" />
        {/* fit line */}
        <path
          data-el="fit"
          d="M 30 15 L 180 80"
          fill="none"
          stroke="var(--preview-line)"
          strokeWidth="2"
        />
        {/* data points */}
        {[
          { cx: 40, cy: 22 },
          { cx: 65, cy: 33 },
          { cx: 90, cy: 44 },
          { cx: 115, cy: 55 },
          { cx: 140, cy: 66 },
          { cx: 170, cy: 78 },
        ].map((p, i) => (
          <circle
            key={i}
            data-el="pt"
            cx={p.cx}
            cy={p.cy}
            r="3.5"
            fill="var(--preview-point)"
            opacity="0"
          />
        ))}
        <text x="100" y="98" textAnchor="middle" fontSize="9" fill="currentColor">ln k  vs  1/T</text>
      </svg>
    </div>
  );
}
