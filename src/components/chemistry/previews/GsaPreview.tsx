'use client';

/**
 * Mini preview: Generalized Simulated Annealing search — particles cooling
 * toward the global minimum of a rugged landscape.
 */

import { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import { useAnimate, useInView, useReducedMotion } from 'framer-motion';
import { safe, type ConceptPreviewProps } from '@/components/common/HoverPreviewPopover';

export function GsaPreview({ className }: ConceptPreviewProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [scope, animate] = useAnimate();
  const inView = useInView(ref);
  const reduce = useReducedMotion();
  const colors = {
    '--preview-curve': '#1e3a5f',
    '--preview-particle': 'oklch(68% 0.18 200)',
  } as CSSProperties;

  useEffect(() => {
    if (!inView || reduce) return;
    let cancelled = false;
    (async () => {
      while (!cancelled) {
        await safe(() => animate('[data-el="p1"]', { cx: [30, 80, 120, 100], cy: [60, 20, 55, 75] }, { duration: 2.4 }));
      }
    })();
    return () => { cancelled = true; };
  }, [inView, reduce, animate]);

  return (
    <div ref={ref} className={className} style={colors}>
      <svg ref={scope} viewBox="0 0 200 100" className="w-full h-full" role="presentation" aria-hidden="true">
        <path d="M 10 70 Q 40 20 60 60 T 110 50 Q 140 90 160 40 T 190 70" fill="none" stroke="var(--preview-curve)" strokeWidth="2" />
        <circle data-el="p1" cx="30" cy="60" r="4" fill="var(--preview-particle)" />
        <text x="100" y="96" textAnchor="middle" fontSize="9" fill="currentColor">GSA search</text>
      </svg>
    </div>
  );
}
