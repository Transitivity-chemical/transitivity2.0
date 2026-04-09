'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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

  const filtered = sections.filter((section) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      t(section.titleKey).toLowerCase().includes(q) ||
      t(section.descKey).toLowerCase().includes(q) ||
      section.links.some((l) => l.label.toLowerCase().includes(q))
    );
  });

  return (
    <div className="p-8 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
          <BookOpen className="size-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">
            Documentação, teoria e referências dos métodos disponíveis no Transitivity 2.0
          </p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
        {filtered.map((section) => (
          <Card key={section.key} className="hover:border-primary/50 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base">{t(section.titleKey)}</CardTitle>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {section.links.length} artigo{section.links.length > 1 ? 's' : ''}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{t(section.descKey)}</p>
              <div className="space-y-1.5 pt-1">
                {section.links.map((link) => (
                  <button
                    key={link.url}
                    type="button"
                    onClick={() => setReader({ url: link.url, title: link.label })}
                    className="flex items-center gap-2 w-full text-left rounded-md border bg-background px-3 py-2 text-xs hover:bg-accent hover:border-primary/40 transition-colors"
                  >
                    <FileText className="size-3 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{link.label}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground col-span-full">
            No matching sections found.
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
