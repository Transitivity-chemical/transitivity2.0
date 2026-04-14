'use client';

/**
 * MD preview — creative diatomic vibrational dance:
 *  • Two atoms vibrate asymmetrically with spring dynamics
 *  • Bond stretches + colour morphs with bond length
 *  • Particle trails leave a fading echo path
 *  • Periodic kinetic-energy burst pulses radiate out
 *  • Loops forever
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
    '--md-a': '#1e3a5f',
    '--md-b': 'oklch(68% 0.18 200)',
    '--md-bond': 'color-mix(in oklch, #1e3a5f 50%, white)',
    '--md-burst': 'oklch(72% 0.22 50)',
  } as CSSProperties;

  useEffect(() => {
    if (!inView || reduce) return;
    let cancelled = false;

    // Continuous anti-phase oscillation
    (async () => {
      while (!cancelled) {
        await safe(() =>
          animate(
            '[data-el="atom-a"]',
            { cx: [55, 40, 70, 55] },
            { duration: 1.8, ease: [0.45, 0, 0.55, 1] },
          ),
        );
      }
    })();
    (async () => {
      while (!cancelled) {
        await safe(() =>
          animate(
            '[data-el="atom-b"]',
            { cx: [145, 160, 130, 145] },
            { duration: 1.8, ease: [0.45, 0, 0.55, 1] },
          ),
        );
      }
    })();

    // Bond line stretch
    (async () => {
      while (!cancelled) {
        await safe(() =>
          animate(
            '[data-el="bond"]',
            { x1: [55, 40, 70, 55], x2: [145, 160, 130, 145], opacity: [0.5, 1, 0.5, 0.5] },
            { duration: 1.8 },
          ),
        );
      }
    })();

    // Kinetic bursts every 2s
    (async () => {
      while (!cancelled) {
        await safe(() =>
          animate(
            '[data-el="burst"]',
            { r: [4, 26], opacity: [0.6, 0] },
            { duration: 1.2, ease: 'easeOut' },
          ),
        );
      }
    })();

    // Trail spawn
    (async () => {
      while (!cancelled) {
        await safe(() =>
          animate(
            '[data-el="trail"]',
            { opacity: [0, 0.35, 0], scaleX: [0.8, 1.15, 0.8] },
            { duration: 1.8 },
          ),
        );
      }
    })();

    return () => { cancelled = true; };
  }, [inView, reduce, animate]);

  return (
    <div ref={ref} className={className} style={colors}>
      <svg ref={scope} viewBox="0 0 200 100" className="h-full w-full" role="presentation" aria-hidden="true">
        {/* trail behind the bond */}
        <rect
          data-el="trail"
          x="40"
          y="44"
          width="120"
          height="12"
          rx="6"
          fill="var(--md-bond)"
          opacity="0"
        />
        {/* kinetic burst */}
        <circle
          data-el="burst"
          cx="100"
          cy="50"
          r="4"
          fill="none"
          stroke="var(--md-burst)"
          strokeWidth="1.5"
          opacity="0"
        />
        {/* bond */}
        <line
          data-el="bond"
          x1="55"
          y1="50"
          x2="145"
          y2="50"
          stroke="var(--md-bond)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* atoms */}
        <circle data-el="atom-a" cx="55" cy="50" r="11" fill="var(--md-a)" stroke="white" strokeWidth="1.5" />
        <circle data-el="atom-b" cx="145" cy="50" r="9" fill="var(--md-b)" stroke="white" strokeWidth="1.5" />
        <text x="100" y="92" textAnchor="middle" fontSize="8" fill="currentColor" opacity="0.6">
          trajectory
        </text>
      </svg>
    </div>
  );
}
