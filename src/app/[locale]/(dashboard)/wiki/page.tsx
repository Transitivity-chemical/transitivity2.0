'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Search, FileText } from 'lucide-react';
import { PaperReaderSheet } from '@/components/wiki/PaperReaderSheet';

interface WikiSection {
  key: string;
  titleKey: string;
  descKey: string;
  links: { label: string; url: string }[];
}

const sections: WikiSection[] = [
  {
    key: 'tst',
    titleKey: 'tst',
    descKey: 'tstDesc',
    links: [
      { label: 'TST Review (Truhlar et al.)', url: '/papers/tst_review.pdf' },
    ],
  },
  {
    key: 'tunneling',
    titleKey: 'tunneling',
    descKey: 'tunnelingDesc',
    links: [
      { label: 'Tunneling Corrections Review', url: '/papers/tunneling_review.pdf' },
    ],
  },
  {
    key: 'fitting',
    titleKey: 'fitting',
    descKey: 'fittingDesc',
    links: [
      { label: 'Generalized Simulated Annealing (Tsallis & Stariolo)', url: '/papers/gsa_simulated_annealing.pdf' },
    ],
  },
  {
    key: 'md',
    titleKey: 'md',
    descKey: 'mdDesc',
    links: [
      { label: 'CPMD / Ab initio MD intro', url: '/papers/cpmd_intro.pdf' },
    ],
  },
  {
    key: 'ml',
    titleKey: 'ml',
    descKey: 'mlDesc',
    links: [
      { label: 'ANI-2x: Extending ANI to halogens & sulfur', url: '/papers/ani2x_2020.pdf' },
      { label: 'MACE: Equivariant Message Passing', url: '/papers/mace_2022.pdf' },
      { label: 'AIQM1: General-purpose quantum chemistry', url: '/papers/aiqm1_2021.pdf' },
    ],
  },
];

export default function WikiPage() {
  const t = useTranslations('wiki');
  const [search, setSearch] = useState('');
  const [reader, setReader] = useState<{ url: string; title: string } | null>(null);
  const searchId = 'wiki-search';
  const totalSections = sections.length;
  const totalPapers = sections.reduce((sum, section) => sum + section.links.length, 0);

  const filtered = sections.filter((section) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      t(section.titleKey).toLowerCase().includes(q) ||
      t(section.descKey).toLowerCase().includes(q) ||
      section.links.some((l) => l.label.toLowerCase().includes(q))
    );
  });

  const filteredPaperCount = filtered.reduce(
    (sum, section) => sum + section.links.length,
    0,
  );

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-6 py-8 lg:py-12">
      <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-3 text-primary">
            <BookOpen className="size-6" aria-hidden />
          </div>
          <div>
            <h1 className="text-[28px] font-semibold tracking-tight md:text-[32px]">{t('title')}</h1>
            <p className="text-[13px] leading-relaxed text-muted-foreground">
              Documentação, teoria e referências dos métodos disponíveis no Transitivity 2.0
            </p>
          </div>
        </div>
        <dl className="grid min-w-[240px] grid-cols-2 gap-4 text-xs text-muted-foreground">
          <div className="rounded-lg border border-border/70 bg-card/80 px-4 py-3 shadow-sm">
            <dt className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground/80">
              Coleções
            </dt>
            <dd className="font-mono text-xl font-semibold tabular-nums text-foreground">{totalSections}</dd>
          </div>
          <div className="rounded-lg border border-border/70 bg-card/80 px-4 py-3 shadow-sm">
            <dt className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground/80">
              Artigos indexados
            </dt>
            <dd className="font-mono text-xl font-semibold tabular-nums text-foreground">{totalPapers}</dd>
          </div>
        </dl>
      </header>

      <section aria-labelledby="wiki-search" className="space-y-3">
        <label htmlFor={searchId} className="sr-only">
          {t('search')}
        </label>
        <div className="relative max-w-xl">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            id={searchId}
            aria-describedby="wiki-results"
            aria-label={t('search')}
            placeholder={t('search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-[13px] tracking-tight transition focus-visible:ring-primary/50 motion-reduce:transition-none"
          />
        </div>
        <p
          id="wiki-results"
          className="text-xs text-muted-foreground"
          aria-live="polite"
        >
          {filtered.length ? (
            <>
              Mostrando <strong className="font-mono tabular-nums">{filtered.length}</strong> seções{' '}
              <span className="font-mono tabular-nums">({filteredPaperCount} artigos)</span>
            </>
          ) : (
            'Nenhuma seção corresponde ao filtro atual.'
          )}
        </p>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        {filtered.map((section) => (
          <Card
            key={section.key}
            className="group border-border/70 transition hover:border-primary/50 focus-within:border-primary/60 motion-reduce:transition-none"
          >
            <article aria-labelledby={`${section.key}-title`} className="h-full space-y-0">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle id={`${section.key}-title`} className="text-base">
                    {t(section.titleKey)}
                  </CardTitle>
                  <Badge variant="outline" className="text-[10px] font-semibold uppercase tracking-wide">
                    {section.links.length} artigo{section.links.length > 1 ? 's' : ''}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-[13px] leading-relaxed">
                <p className="text-muted-foreground">{t(section.descKey)}</p>
                <ul className="space-y-1.5 pt-1">
                  {section.links.map((link) => (
                    <li key={link.url}>
                      <button
                        type="button"
                        onClick={() => setReader({ url: link.url, title: link.label })}
                        className="flex w-full min-w-0 items-center gap-2 rounded-md border border-border/70 bg-background px-3 py-2 text-left text-[12px] font-medium transition hover:border-primary/50 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 motion-reduce:transition-none"
                        aria-label={`Abrir ${link.label}`}
                      >
                        <FileText className="size-3.5 text-muted-foreground" aria-hidden />
                        <span className="truncate">{link.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </article>
          </Card>
        ))}

        {filtered.length === 0 && (
          <p className="col-span-full text-[13px] text-muted-foreground">
            Refine o termo de busca ou ajuste os filtros.
          </p>
        )}
      </div>

      <PaperReaderSheet
        open={reader !== null}
        onClose={() => setReader(null)}
        url={reader?.url ?? null}
        title={reader?.title ?? ''}
      />
    </div>
  );
}
