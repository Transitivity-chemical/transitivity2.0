'use client';

/**
 * Hover-preview popover for chemistry concepts (and admin onboarding tips).
 *
 * Pattern: framer-motion `useAnimate` with scoped data-* selectors,
 * React portal escape, async while-loop with `safe()` wrapper.
 *
 * Reference: User-provided QuestionPunk doc (Phase 0)
 *            docs/tabs-rebuild-impeccable-plan.md Phase 1.9 + Phase 7
 */

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type ComponentType,
  useId,
} from 'react';
import { createPortal } from 'react-dom';
import { HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ConceptPreviewProps {
  /** Optional className passed to the inner preview. */
  className?: string;
}

export interface HoverPreviewPopoverProps {
  /** Component that renders the animated mini-demo. */
  preview: ComponentType<ConceptPreviewProps>;
  /** Heading shown above the preview. */
  title: string;
  /** Body text shown below the preview. */
  description: string;
  /** Width of the popover in px. Defaults to 320. */
  width?: number;
  /** Optional aria-label for the trigger button. */
  ariaLabel?: string;
  className?: string;
}

export function HoverPreviewPopover({
  preview: Preview,
  title,
  description,
  width = 320,
  ariaLabel,
  className,
}: HoverPreviewPopoverProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [rect, setRect] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const tooltipId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleOpen = useCallback(() => {
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      setRect({ top: r.top + r.height / 2, left: r.right + 8 });
    }
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => setOpen(false), []);

  const popover =
    open && rect && mounted
      ? createPortal(
          <div
            role="tooltip"
            className="pointer-events-none fixed z-[9999] -translate-y-1/2 rounded-lg border bg-popover text-popover-foreground p-3 shadow-xl"
            id={tooltipId}
            style={{ top: rect.top, left: rect.left, width }}
          >
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">{title}</h4>
              <div className="relative h-24 overflow-hidden rounded-lg bg-muted/40">
                <Preview />
              </div>
              <p className="text-[11px] leading-relaxed text-muted-foreground">{description}</p>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        onMouseEnter={handleOpen}
        onMouseLeave={handleClose}
        onFocus={handleOpen}
        onBlur={handleClose}
        aria-label={ariaLabel ?? `Help: ${title}`}
        aria-expanded={open}
        aria-controls={open ? tooltipId : undefined}
        className={cn(
          'inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors',
          className,
        )}
      >
        <HelpCircle className="h-3.5 w-3.5" />
      </button>
      {popover}
    </>
  );
}

/* ─── helpers shared by every concept preview ──────────────────────── */

/**
 * Await a framer-motion animation call and swallow unmount rejections.
 * Preview components use this instead of re-implementing try/catch loops.
 */
export async function safe(fn: () => unknown): Promise<void> {
  try {
    await Promise.resolve(fn());
  } catch {
    /* unmounted or cancelled */
  }
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
