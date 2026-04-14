'use client';

/**
 * Mini preview: molecular dynamics — atoms bouncing along a trajectory.
 */

import { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import { useAnimate, useInView, useReducedMotion } from 'framer-motion';
import { safe, type ConceptPreviewProps } from '@/components/common/HoverPreviewPopover';

export function MolecularDynamicsPreview({ className }: ConceptPreviewProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [scope, animate] = useAnimate();
  const inView = useInView(ref);
  const reduce = useReducedMotion();
  const colors = {
    '--preview-atom-a': '#1e3a5f',
    '--preview-atom-b': 'oklch(65% 0.18 200)',
    '--preview-bond': 'color-mix(in oklch, #1e3a5f 60%, white)',
  } as CSSProperties;

  useEffect(() => {
    if (!inView || reduce) return;
    let cancelled = false;
    (async () => {
      while (!cancelled) {
        await safe(() =>
          animate('[data-el="atom-a"]', { cx: [60, 66, 54, 60] }, { duration: 1.5, ease: 'easeInOut' }),
        );
      }
    })();
    (async () => {
      while (!cancelled) {
        await safe(() =>
          animate('[data-el="atom-b"]', { cx: [140, 132, 148, 140] }, { duration: 1.5, ease: 'easeInOut' }),
        );
      }
    })();
    return () => { cancelled = true; };
  }, [inView, reduce, animate]);

  return (
    <div ref={ref} className={className} style={colors}>
      <svg ref={scope} viewBox="0 0 200 100" className="h-full w-full" role="presentation" aria-hidden="true">
        <line x1="60" y1="50" x2="140" y2="50" stroke="var(--preview-bond)" strokeWidth="2" />
        <circle data-el="atom-a" cx="60" cy="50" r="10" fill="var(--preview-atom-a)" />
        <circle data-el="atom-b" cx="140" cy="50" r="10" fill="var(--preview-atom-b)" />
        <text x="100" y="92" textAnchor="middle" fontSize="9" fill="currentColor">trajectory</text>
      </svg>
    </div>
  );
}
