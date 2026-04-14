'use client';

/**
 * Page title wrapper. On hover of the title, a "?" button fades in. Hover
 * the "?" to open the HoverPreviewPopover with an animated concept preview.
 *
 * Usage:
 *   <TitleWithHint
 *     title="Arrhenius Plot"
 *     preview={ArrheniusPreview}
 *     hint="k(T) = A·exp(-Ea/RT). Linear in ln k vs 1/T."
 *   />
 */

import { useState, type ComponentType } from 'react';
import { HelpCircle } from 'lucide-react';
import { HoverPreviewPopover, type ConceptPreviewProps } from '@/components/common/HoverPreviewPopover';
import { cn } from '@/lib/utils';

interface Props {
  title: string;
  preview: ComponentType<ConceptPreviewProps>;
  hint: string;
  className?: string;
}

export function TitleWithHint({ title, preview, hint, className }: Props) {
  const [hover, setHover] = useState(false);

  return (
    <h1
      className={cn(
        'group inline-flex items-center gap-2 text-3xl font-bold tracking-tight',
        className,
      )}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      tabIndex={0}
    >
      <span>{title}</span>
      <span
        className={cn(
          'inline-flex size-5 items-center justify-center transition-all duration-200 motion-reduce:transition-none',
          hover ? 'translate-x-0 opacity-100' : '-translate-x-1 opacity-0',
        )}
        aria-hidden={!hover}
      >
        <HoverPreviewPopover preview={preview} title={title} description={hint} ariaLabel={`Help: ${title}`} />
      </span>
    </h1>
  );
}
