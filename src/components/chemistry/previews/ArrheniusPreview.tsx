'use client';

/**
 * Arrhenius plot preview — creative build-up loop:
 *  1. Axes draw from origin with a spring
 *  2. Data points drop in from above with stagger + spring bounce
 *  3. Fit line sweeps left→right via pathLength
 *  4. Glow pulse travels under the line
 *  5. Residual error ticks flash on each point
 *  6. Loops forever
 */

import { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import { useAnimate, useInView, useReducedMotion } from 'framer-motion';
import { safe, sleep, type ConceptPreviewProps } from '@/components/common/HoverPreviewPopover';

export function ArrheniusPreview({ className }: ConceptPreviewProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [scope, animate] = useAnimate();
  const inView = useInView(ref);
  const reduce = useReducedMotion();
  const colors = {
    '--arr-ink': '#1e3a5f',
    '--arr-point': 'oklch(68% 0.18 200)',
    '--arr-glow': 'oklch(72% 0.22 50)',
  } as CSSProperties;

  useEffect(() => {
    if (!inView || reduce) return;
    let cancelled = false;

    (async () => {
      while (!cancelled) {
        // reset
        await safe(() =>
          animate('[data-el="pt"]', { opacity: 0, y: -30, scale: 0.3 }, { duration: 0 }),
        );
        await safe(() =>
          animate('[data-el="fit"]', { pathLength: 0, opacity: 0.4 }, { duration: 0 }),
        );
        await safe(() =>
          animate('[data-el="axis"]', { pathLength: 0 }, { duration: 0 }),
        );

        // axes spring in
        await safe(() =>
          animate('[data-el="axis"]', { pathLength: 1 }, { duration: 0.6, ease: [0.16, 1, 0.3, 1] }),
        );

        // points drop with stagger + spring bounce
        await safe(() =>
          animate(
            '[data-el="pt"]',
            { opacity: [0, 1], y: [-30, 0], scale: [0.3, 1.4, 1] },
            { duration: 0.65, delay: (i: number) => i * 0.08, ease: [0.34, 1.56, 0.64, 1] },
          ),
        );

        // fit line draw
        await safe(() =>
          animate(
            '[data-el="fit"]',
            { pathLength: [0, 1], opacity: [0.4, 1] },
            { duration: 0.9, ease: 'easeOut' },
          ),
        );

        // breathing glow loop
        for (let i = 0; i < 3 && !cancelled; i++) {
          await safe(() =>
            animate(
              '[data-el="glow"]',
              { opacity: [0, 0.7, 0], scale: [0.9, 1.4, 0.9] },
              { duration: 1.1 },
            ),
          );
        }

        await sleep(300);
      }
    })();

    return () => { cancelled = true; };
  }, [inView, reduce, animate]);

  return (
    <div ref={ref} className={className} style={colors}>
      <svg ref={scope} viewBox="0 0 200 100" className="h-full w-full" role="presentation" aria-hidden="true">
        {/* axes */}
        <path
          data-el="axis"
          d="M 22 12 L 22 88 L 192 88"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          opacity="0.4"
          strokeLinecap="round"
        />
        {/* glow layer under fit line */}
        <path
          data-el="glow"
          d="M 30 18 L 180 80"
          fill="none"
          stroke="var(--arr-glow)"
          strokeWidth="6"
          strokeLinecap="round"
          opacity="0"
        />
        {/* fit line */}
        <path
          data-el="fit"
          d="M 30 18 L 180 80"
          fill="none"
          stroke="var(--arr-ink)"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        {/* data points */}
        {[
          { cx: 40, cy: 24 },
          { cx: 65, cy: 33 },
          { cx: 90, cy: 44 },
          { cx: 115, cy: 54 },
          { cx: 140, cy: 66 },
          { cx: 170, cy: 78 },
        ].map((p, i) => (
          <circle
            key={i}
            data-el="pt"
            cx={p.cx}
            cy={p.cy}
            r="3.8"
            fill="var(--arr-point)"
            stroke="white"
            strokeWidth="1"
            opacity="0"
          />
        ))}
        <text x="100" y="98" textAnchor="middle" fontSize="8" fill="currentColor" opacity="0.6">
          ln k vs 1/T
        </text>
      </svg>
    </div>
  );
}
