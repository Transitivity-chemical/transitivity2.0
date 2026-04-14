'use client';

/**
 * Mini preview: quantum tunneling through the activation barrier (Bell/Eckart/Wigner).
 */

import { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import { useAnimate, useInView, useReducedMotion } from 'framer-motion';
import { safe, type ConceptPreviewProps } from '@/components/common/HoverPreviewPopover';

export function TunnelingPreview({ className }: ConceptPreviewProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [scope, animate] = useAnimate();
  const inView = useInView(ref);
  const reduce = useReducedMotion();
  const colors = {
    '--preview-barrier': '#1e3a5f',
    '--preview-particle': 'oklch(65% 0.2 25)',
  } as CSSProperties;

  useEffect(() => {
    if (!inView || reduce) return;
    let cancelled = false;
    (async () => {
      while (!cancelled) {
        await safe(() => animate('[data-el="pt"]', { cx: [20, 100, 180] }, { duration: 2, ease: 'easeInOut' }));
        await safe(() => animate('[data-el="through"]', { opacity: [0, 1, 0] }, { duration: 0.6 }));
      }
    })();
    return () => { cancelled = true; };
  }, [inView, reduce, animate]);

  return (
    <div ref={ref} className={className} style={colors}>
      <svg ref={scope} viewBox="0 0 200 100" className="w-full h-full" role="presentation" aria-hidden="true">
        <rect x="85" y="20" width="30" height="60" fill="var(--preview-barrier)" opacity="0.35" />
        <path data-el="through" d="M 85 50 L 115 50" stroke="var(--preview-particle)" strokeWidth="2" strokeDasharray="3 2" opacity="0" />
        <circle data-el="pt" cx="20" cy="50" r="5" fill="var(--preview-particle)" />
        <text x="100" y="96" textAnchor="middle" fontSize="9" fill="currentColor">quantum tunneling</text>
      </svg>
    </div>
  );
}
