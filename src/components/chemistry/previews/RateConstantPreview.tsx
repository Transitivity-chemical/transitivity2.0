'use client';

/**
 * Mini preview: rate constant — TST activation barrier with reaction
 * progress arrow.
 */

import { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import { useAnimate, useInView, useReducedMotion } from 'framer-motion';
import { safe, type ConceptPreviewProps } from '@/components/common/HoverPreviewPopover';

export function RateConstantPreview({ className }: ConceptPreviewProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [scope, animate] = useAnimate();
  const inView = useInView(ref);
  const reduce = useReducedMotion();
  const colors = {
    '--preview-curve': '#1e3a5f',
    '--preview-ball': 'oklch(65% 0.2 25)',
  } as CSSProperties;

  useEffect(() => {
    if (!inView || reduce) return;
    let cancelled = false;
    (async () => {
      while (!cancelled) {
        await safe(() =>
          animate(
            '[data-el="ball"]',
            { cx: [25, 100, 175], cy: [75, 18, 75] },
            { duration: 2.2, ease: 'easeInOut' },
          ),
        );
      }
    })();
    return () => { cancelled = true; };
  }, [inView, reduce, animate]);

  return (
    <div ref={ref} className={className} style={colors}>
      <svg ref={scope} viewBox="0 0 200 100" className="h-full w-full" role="presentation" aria-hidden="true">
        <path
          d="M 10 80 Q 100 -10 190 80"
          fill="none"
          stroke="var(--preview-curve)"
          strokeWidth="2"
        />
        <circle data-el="ball" cx="25" cy="75" r="4" fill="var(--preview-ball)" />
        <text x="100" y="97" textAnchor="middle" fontSize="9" fill="currentColor">k(T) = A·exp(-Ea/RT)</text>
      </svg>
    </div>
  );
}
