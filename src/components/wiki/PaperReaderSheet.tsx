'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { ExternalLink, Download, Loader2, AlertTriangle } from 'lucide-react';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

/**
 * FIX-1 of post-megaplan audit:
 *
 * - Adds SheetTitle (radix a11y requirement; was crashing the page)
 * - Proxies the URL through /api/v1/papers/proxy server-side to bypass
 *   X-Frame-Options / CORS that publishers put on PDF/HTML pages
 * - Detects content-type: PDF → react-pdf, HTML → iframe of the proxied URL
 * - Always shows 'Abrir em nova aba' fallback button
 */

// react-pdf has to be SSR-disabled because pdfjs-dist uses worker globals
const PdfDocument = dynamic(() => import('./PdfDocument').then((m) => m.PdfDocument), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" />
    </div>
  ),
});

interface Props {
  open: boolean;
  onClose: () => void;
  url: string | null;
  title: string;
}

type LoadState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'pdf'; blobUrl: string }
  | { kind: 'html'; proxyUrl: string }
  | { kind: 'error'; message: string };

export function PaperReaderSheet({ open, onClose, url, title }: Props) {
  const [state, setState] = useState<LoadState>({ kind: 'idle' });

  useEffect(() => {
    if (!open || !url) {
      setState({ kind: 'idle' });
      return;
    }

    let cancelled = false;
    let blobUrlToRevoke: string | null = null;

    setState({ kind: 'loading' });

    const proxyUrl = `/api/v1/papers/proxy?url=${encodeURIComponent(url)}`;

    fetch(proxyUrl)
      .then(async (res) => {
        if (cancelled) return;
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error || `HTTP ${res.status}`);
        }
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/pdf')) {
          const blob = await res.blob();
          const blobUrl = URL.createObjectURL(blob);
          blobUrlToRevoke = blobUrl;
          if (!cancelled) setState({ kind: 'pdf', blobUrl });
        } else {
          // HTML / other → embed via iframe pointing at the proxy
          if (!cancelled) setState({ kind: 'html', proxyUrl });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setState({ kind: 'error', message: err instanceof Error ? err.message : String(err) });
        }
      });

    return () => {
      cancelled = true;
      if (blobUrlToRevoke) URL.revokeObjectURL(blobUrlToRevoke);
    };
  }, [open, url]);

  if (!url) return null;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:w-[70vw] sm:max-w-[70vw] p-0 flex flex-col"
      >
        <SheetTitle className="sr-only">{title}</SheetTitle>
        <SheetDescription className="sr-only">Leitor de artigo: {title}</SheetDescription>

        <div className="border-b px-4 py-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold truncate flex-1" title={title}>
            {title}
          </h2>
          {state.kind === 'pdf' && (
            <Button asChild size="sm" variant="outline">
              <a href={state.blobUrl} download={`${title.replace(/\s+/g, '_')}.pdf`}>
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Baixar PDF
              </a>
            </Button>
          )}
          <Button asChild size="sm" variant="outline">
            <a href={url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
              Abrir em nova aba
            </a>
          </Button>
        </div>

        <div className="flex-1 overflow-hidden bg-muted/20">
          {state.kind === 'idle' && null}
          {state.kind === 'loading' && (
            <div className="flex items-center justify-center h-full text-muted-foreground gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Carregando artigo...</span>
            </div>
          )}
          {state.kind === 'error' && (
            <div className="flex flex-col items-center justify-center h-full text-center px-6 gap-3">
              <AlertTriangle className="h-10 w-10 text-amber-500" />
              <p className="text-sm font-medium">Não foi possível carregar este artigo</p>
              <p className="text-xs text-muted-foreground max-w-md">{state.message}</p>
              <p className="text-xs text-muted-foreground">
                Use &quot;Abrir em nova aba&quot; para visualizar no site original.
              </p>
            </div>
          )}
          {state.kind === 'pdf' && <PdfDocument fileUrl={state.blobUrl} />}
          {state.kind === 'html' && (
            <iframe
              src={state.proxyUrl}
              title={title}
              className="w-full h-full border-0"
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
