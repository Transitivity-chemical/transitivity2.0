'use client';

/**
 * Rate constant preview — TST activation barrier with creative motion:
 *  • Curve stroke draws in with easeOut
 *  • Reactant ball rolls up to the TS saddle with spring
 *  • At the saddle a shimmer pulse fires
 *  • Ball rolls down to products
 *  • Ghost trail traces the reaction coordinate
 *  • Loops forever
 */

import { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import { useAnimate, useInView, useReducedMotion } from 'framer-motion';
import { safe, sleep, type ConceptPreviewProps } from '@/components/common/HoverPreviewPopover';

export function RateConstantPreview({ className }: ConceptPreviewProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [scope, animate] = useAnimate();
  const inView = useInView(ref);
  const reduce = useReducedMotion();
  const colors = {
    '--rc-curve': '#1e3a5f',
    '--rc-ball': 'oklch(68% 0.2 25)',
    '--rc-saddle': 'oklch(72% 0.22 50)',
    '--rc-trail': 'color-mix(in oklch, #1e3a5f 30%, transparent)',
  } as CSSProperties;

  useEffect(() => {
    if (!inView || reduce) return;
    let cancelled = false;

    (async () => {
      while (!cancelled) {
        // reset
        await safe(() =>
          animate('[data-el="curve"]', { pathLength: 0, opacity: 0.3 }, { duration: 0 }),
        );
        await safe(() =>
          animate('[data-el="ball"]', { cx: 20, cy: 78, scale: 1 }, { duration: 0 }),
        );
        await safe(() =>
          animate('[data-el="trail"]', { pathLength: 0, opacity: 0 }, { duration: 0 }),
        );
        await safe(() =>
          animate('[data-el="saddle"]', { opacity: 0, scale: 0.6 }, { duration: 0 }),
        );

        // curve draws in
        await safe(() =>
          animate(
            '[data-el="curve"]',
            { pathLength: [0, 1], opacity: [0.3, 1] },
            { duration: 0.9, ease: 'easeOut' },
          ),
        );
        await sleep(150);

        // ball climbs to TS
        await safe(() =>
          animate(
            '[data-el="ball"]',
            { cx: [20, 60, 100], cy: [78, 36, 18], scale: [1, 1.05, 1.1] },
            { duration: 1.2, ease: [0.4, 0, 0.2, 1] },
          ),
        );
        // trail draws to saddle
        await safe(() =>
          animate(
            '[data-el="trail"]',
            { pathLength: [0, 0.5], opacity: [0, 0.6] },
            { duration: 0 },
          ),
        );

        // saddle shimmer pulse
        await safe(() =>
          animate(
            '[data-el="saddle"]',
            { opacity: [0, 0.9, 0], scale: [0.6, 1.8, 0.6] },
            { duration: 0.6 },
          ),
        );

        // ball descends
        await safe(() =>
          animate(
            '[data-el="ball"]',
            { cx: [100, 140, 180], cy: [18, 36, 78], scale: [1.1, 1.05, 1] },
            { duration: 1.2, ease: [0.8, 0, 0.6, 1] },
          ),
        );
        // extend trail to products
        await safe(() =>
          animate('[data-el="trail"]', { pathLength: [0.5, 1] }, { duration: 0 }),
        );

        // fade trail out
        await safe(() =>
          animate('[data-el="trail"]', { opacity: [0.6, 0] }, { duration: 0.6 }),
        );

        await sleep(300);
      }
    })();

    return () => { cancelled = true; };
  }, [inView, reduce, animate]);

  return (
    <div ref={ref} className={className} style={colors}>
      <svg ref={scope} viewBox="0 0 200 100" className="h-full w-full" role="presentation" aria-hidden="true">
        {/* trail behind the curve */}
        <path
          data-el="trail"
          d="M 20 78 Q 100 -10 180 78"
          fill="none"
          stroke="var(--rc-trail)"
          strokeWidth="6"
          strokeLinecap="round"
          opacity="0"
        />
        {/* reaction coordinate curve */}
        <path
          data-el="curve"
          d="M 20 78 Q 100 -10 180 78"
          fill="none"
          stroke="var(--rc-curve)"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        {/* saddle-point shimmer */}
        <circle
          data-el="saddle"
          cx="100"
          cy="18"
          r="6"
          fill="var(--rc-saddle)"
          opacity="0"
        />
        {/* rolling ball */}
        <circle
          data-el="ball"
          cx="20"
          cy="78"
          r="5"
          fill="var(--rc-ball)"
          stroke="white"
          strokeWidth="1.5"
        />
        <text x="100" y="97" textAnchor="middle" fontSize="8" fill="currentColor" opacity="0.6">
          k(T) = A·exp(−Ea/RT)
        </text>
      </svg>
    </div>
  );
}
