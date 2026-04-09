'use client';

import { ExternalLink, X } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

/**
 * Phase 12 of megaplan: in-app paper reader as right-side slide-over.
 *
 * Sidebar stays visible on the left. The sheet hosts an iframe (most papers
 * have an HTML page on the publisher; DOIs resolve to a publisher landing
 * page that is iframe-embeddable in many cases). For PDF-only links, users
 * can fall back to opening in a new tab.
 *
 * Reference: docs/research-external.md §7 (PDF + Markdown reader patterns)
 *           docs/transitivity-overhaul-plan.md Phase 12
 */

interface Props {
  open: boolean;
  onClose: () => void;
  url: string | null;
  title: string;
}

export function PaperReaderSheet({ open, onClose, url, title }: Props) {
  if (!url) return null;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:w-[60vw] sm:max-w-[60vw] p-0 flex flex-col"
      >
        <div className="border-b px-4 py-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold truncate flex-1">{title}</h2>
          <Button asChild size="sm" variant="outline">
            <a href={url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
              Abrir
            </a>
          </Button>
          <Button size="sm" variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-hidden bg-muted/20">
          <iframe
            src={url}
            title={title}
            className="w-full h-full border-0"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          />
        </div>
        <div className="border-t bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
          Alguns sites bloqueiam visualização em iframe. Use &quot;Abrir&quot; para abrir em nova aba.
        </div>
      </SheetContent>
    </Sheet>
  );
}
