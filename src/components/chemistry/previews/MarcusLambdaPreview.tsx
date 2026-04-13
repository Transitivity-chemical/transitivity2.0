'use client';

/**
 * Mini preview: Marcus λ reorganization energy — two parabolas offset
 * horizontally, label pointing at the vertical gap.
 */

import { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import { useAnimate, useInView, useReducedMotion } from 'framer-motion';
import { safe, type ConceptPreviewProps } from '@/components/common/HoverPreviewPopover';

export function MarcusLambdaPreview({ className }: ConceptPreviewProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [scope, animate] = useAnimate();
  const inView = useInView(ref);
  const reduce = useReducedMotion();
  const previewColors = {
    '--preview-accent': '#1e3a5f',
    '--preview-secondary': 'color-mix(in oklch, #1e3a5f 40%, white)',
    '--preview-danger': 'oklch(65% 0.2 25)',
  } as CSSProperties;

  useEffect(() => {
    if (!inView || reduce) return;
    let cancelled = false;
    (async () => {
      while (!cancelled) {
        await safe(() => animate('[data-el="vert"]', { y: [0, -24, 0] }, { duration: 2 }));
      }
    })();
    return () => { cancelled = true; };
  }, [inView, reduce, animate]);

  return (
    <div ref={ref} className={className} style={previewColors}>
      <svg ref={scope} viewBox="0 0 200 100" className="w-full h-full" role="presentation" aria-hidden="true">
        <path d="M 20 80 Q 60 10 100 80" fill="none" stroke="var(--preview-accent)" strokeWidth="2" />
        <path d="M 100 80 Q 140 10 180 80" fill="none" stroke="var(--preview-secondary)" strokeWidth="2" />
        <circle data-el="vert" cx="100" cy="80" r="4" fill="var(--preview-danger)" />
        <text x="100" y="95" textAnchor="middle" fontSize="9" fill="currentColor">λ</text>
      </svg>
    </div>
  );
}
