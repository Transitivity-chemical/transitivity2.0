'use client';

/**
 * Mini preview: Savitzky-Golay filter smoothing noisy data.
 */

import { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import { useAnimate, useInView, useReducedMotion } from 'framer-motion';
import { safe, type ConceptPreviewProps } from '@/components/common/HoverPreviewPopover';

export function SGFilterPreview({ className }: ConceptPreviewProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [scope, animate] = useAnimate();
  const inView = useInView(ref);
  const reduce = useReducedMotion();
  const previewColors = {
    '--preview-noise': 'color-mix(in oklch, #1e3a5f 20%, gray)',
    '--preview-signal': '#1e3a5f',
  } as CSSProperties;

  useEffect(() => {
    if (!inView || reduce) return;
    let cancelled = false;
    (async () => {
      while (!cancelled) {
        await safe(() => animate('[data-el="smooth"]', { pathLength: [0, 1] }, { duration: 1.5 }));
        await safe(() => animate('[data-el="smooth"]', { opacity: [1, 0.3, 1] }, { duration: 1 }));
      }
    })();
    return () => { cancelled = true; };
  }, [inView, reduce, animate]);

  return (
    <div ref={ref} className={className} style={previewColors}>
      <svg ref={scope} viewBox="0 0 200 100" className="w-full h-full" role="presentation" aria-hidden="true">
        <polyline
          points="10,70 25,40 40,65 55,30 70,55 85,25 100,50 115,20 130,45 145,15 160,40 175,10 190,35"
          fill="none"
          stroke="var(--preview-noise)"
          strokeWidth="1"
        />
        <path
          data-el="smooth"
          d="M 10 60 Q 100 -10 190 30"
          fill="none"
          stroke="var(--preview-signal)"
          strokeWidth="2.5"
        />
      </svg>
    </div>
  );
}
