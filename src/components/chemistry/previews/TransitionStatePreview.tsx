'use client';

/**
 * Mini preview: reaction coordinate with transition state saddle point.
 */

import { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import { useAnimate, useInView, useReducedMotion } from 'framer-motion';
import { safe, type ConceptPreviewProps } from '@/components/common/HoverPreviewPopover';

export function TransitionStatePreview({ className }: ConceptPreviewProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [scope, animate] = useAnimate();
  const inView = useInView(ref);
  const reduce = useReducedMotion();
  const colors = {
    '--preview-curve': '#1e3a5f',
    '--preview-ball': 'oklch(65% 0.18 30)',
    '--preview-ts': 'oklch(70% 0.15 80)',
  } as CSSProperties;

  useEffect(() => {
    if (!inView || reduce) return;
    let cancelled = false;
    (async () => {
      while (!cancelled) {
        await safe(() =>
          animate('[data-el="ball"]', { cx: [20, 100, 180], cy: [70, 18, 70] }, { duration: 2.2, ease: 'easeInOut' }),
        );
        await safe(() => animate('[data-el="ts-halo"]', { opacity: [0, 1, 0], scale: [0.8, 1.4, 0.8] }, { duration: 1 }));
      }
    })();
    return () => { cancelled = true; };
  }, [inView, reduce, animate]);

  return (
    <div ref={ref} className={className} style={colors}>
      <svg ref={scope} viewBox="0 0 200 100" className="w-full h-full" role="presentation" aria-hidden="true">
        <path d="M 10 80 Q 100 -10 190 80" fill="none" stroke="var(--preview-curve)" strokeWidth="2" />
        <circle data-el="ts-halo" cx="100" cy="18" r="8" fill="var(--preview-ts)" opacity="0" />
        <circle cx="100" cy="18" r="3" fill="var(--preview-ts)" />
        <circle data-el="ball" cx="20" cy="70" r="5" fill="var(--preview-ball)" />
        <text x="100" y="96" textAnchor="middle" fontSize="9" fill="currentColor">TS ‡</text>
      </svg>
    </div>
  );
}
