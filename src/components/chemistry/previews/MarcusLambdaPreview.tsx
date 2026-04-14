'use client';

/**
 * Marcus λ reorganization preview — parabolic electron transfer dance:
 *  • Reactant parabola draws in
 *  • Product parabola draws in at offset energy
 *  • Electron ball sits at reactant minimum
 *  • Ball tunnels (vertical shift) to vertical-product position (Franck-Condon)
 *  • λ label pulses between the two minima
 *  • Ball relaxes down the product parabola
 *  • Loops forever
 */

import { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import { useAnimate, useInView, useReducedMotion } from 'framer-motion';
import { safe, sleep, type ConceptPreviewProps } from '@/components/common/HoverPreviewPopover';

export function MarcusLambdaPreview({ className }: ConceptPreviewProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [scope, animate] = useAnimate();
  const inView = useInView(ref);
  const reduce = useReducedMotion();
  const colors = {
    '--mk-reactant': '#1e3a5f',
    '--mk-product': 'color-mix(in oklch, #1e3a5f 50%, white)',
    '--mk-ball': 'oklch(68% 0.2 25)',
    '--mk-flash': 'oklch(72% 0.22 50)',
  } as CSSProperties;

  useEffect(() => {
    if (!inView || reduce) return;
    let cancelled = false;

    (async () => {
      while (!cancelled) {
        // reset
        await safe(() =>
          animate('[data-el="p1"]', { pathLength: 0, opacity: 0.3 }, { duration: 0 }),
        );
        await safe(() =>
          animate('[data-el="p2"]', { pathLength: 0, opacity: 0.3 }, { duration: 0 }),
        );
        await safe(() =>
          animate('[data-el="ball"]', { cx: 55, cy: 78, scale: 1 }, { duration: 0 }),
        );
        await safe(() =>
          animate('[data-el="flash"]', { opacity: 0, scale: 0.5 }, { duration: 0 }),
        );
        await safe(() =>
          animate('[data-el="lambda"]', { opacity: 0.2, y: 0 }, { duration: 0 }),
        );

        // parabolas draw in parallel
        await Promise.all([
          safe(() =>
            animate(
              '[data-el="p1"]',
              { pathLength: [0, 1], opacity: [0.3, 1] },
              { duration: 0.8, ease: 'easeOut' },
            ),
          ),
          safe(() =>
            animate(
              '[data-el="p2"]',
              { pathLength: [0, 1], opacity: [0.3, 1] },
              { duration: 0.8, ease: 'easeOut', delay: 0.1 },
            ),
          ),
        ]);

        // ball sits at reactant min, breathes
        await safe(() =>
          animate('[data-el="ball"]', { scale: [1, 1.15, 1] }, { duration: 0.6 }),
        );

        // Franck-Condon vertical jump (instantaneous electron transfer)
        await safe(() =>
          animate(
            '[data-el="ball"]',
            { cy: [78, 28], fill: ['var(--mk-ball)', 'var(--mk-flash)'] },
            { duration: 0.25 },
          ),
        );

        // flash at vertical product
        await safe(() =>
          animate(
            '[data-el="flash"]',
            { opacity: [0, 0.9, 0], scale: [0.5, 2.2, 0.5] },
            { duration: 0.7 },
          ),
        );

        // λ label glows
        await safe(() =>
          animate('[data-el="lambda"]', { opacity: [0.2, 1, 0.6], y: [0, -2, 0] }, { duration: 0.8 }),
        );

        // slide horizontally to product well
        await safe(() =>
          animate('[data-el="ball"]', { cx: [100, 145] }, { duration: 0.7, ease: 'easeInOut' }),
        );

        // relax down product parabola
        await safe(() =>
          animate(
            '[data-el="ball"]',
            {
              cy: [28, 78],
              fill: ['var(--mk-flash)', 'var(--mk-ball)'],
            },
            { duration: 0.9, ease: [0.4, 0, 0.2, 1] },
          ),
        );

        await sleep(400);
      }
    })();

    return () => { cancelled = true; };
  }, [inView, reduce, animate]);

  return (
    <div ref={ref} className={className} style={colors}>
      <svg ref={scope} viewBox="0 0 200 100" className="w-full h-full" role="presentation" aria-hidden="true">
        {/* reactant parabola */}
        <path
          data-el="p1"
          d="M 20 20 Q 55 95 90 20"
          fill="none"
          stroke="var(--mk-reactant)"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        {/* product parabola */}
        <path
          data-el="p2"
          d="M 110 20 Q 145 95 180 20"
          fill="none"
          stroke="var(--mk-product)"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        {/* flash at vertical product */}
        <circle
          data-el="flash"
          cx="100"
          cy="28"
          r="5"
          fill="none"
          stroke="var(--mk-flash)"
          strokeWidth="2"
          opacity="0"
        />
        {/* electron ball */}
        <circle
          data-el="ball"
          cx="55"
          cy="78"
          r="5"
          fill="var(--mk-ball)"
          stroke="white"
          strokeWidth="1.5"
        />
        {/* λ label */}
        <text
          data-el="lambda"
          x="100"
          y="55"
          textAnchor="middle"
          fontSize="14"
          fontWeight="700"
          fill="var(--mk-flash)"
          opacity="0.2"
        >
          λ
        </text>
      </svg>
    </div>
  );
}
