'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
      { label: 'Eyring (1935)', url: 'https://doi.org/10.1063/1.1749604' },
      { label: 'Truhlar et al. (1996)', url: 'https://doi.org/10.1021/jp953748q' },
    ],
  },
  {
    key: 'tunneling',
    titleKey: 'tunneling',
    descKey: 'tunnelingDesc',
    links: [
      { label: 'Bell (1980)', url: 'https://doi.org/10.1007/978-1-4899-2891-7' },
      { label: 'Skodje & Truhlar (1981)', url: 'https://doi.org/10.1021/j100267a002' },
      { label: 'Eckart (1930)', url: 'https://doi.org/10.1103/PhysRev.35.1303' },
    ],
  },
  {
    key: 'fitting',
    titleKey: 'fitting',
    descKey: 'fittingDesc',
    links: [
      { label: 'Aquilanti et al. (2010)', url: 'https://doi.org/10.1016/j.cplett.2010.03.006' },
      { label: 'Tsallis & Stariolo (1996)', url: 'https://doi.org/10.1016/0378-4371(95)00426-2' },
    ],
  },
  {
    key: 'md',
    titleKey: 'md',
    descKey: 'mdDesc',
    links: [
      { label: 'CPMD Manual', url: 'https://www.cpmd.org/wordpress/index.php/documentation/' },
      { label: 'Marx & Hutter (2009)', url: 'https://doi.org/10.1017/CBO9780511609633' },
    ],
  },
  {
    key: 'ml',
    titleKey: 'ml',
    descKey: 'mlDesc',
    links: [
      { label: 'ANI-2x', url: 'https://doi.org/10.1021/acs.jctc.0c00121' },
      { label: 'MACE', url: 'https://doi.org/10.48550/arXiv.2206.07697' },
      { label: 'AIQM1', url: 'https://doi.org/10.1038/s41467-021-27340-2' },
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
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">{t('title')}</h1>

      <Input
        placeholder={t('search')}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />

      <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
        {filtered.map((section) => (
          <Card key={section.key}>
            <CardHeader>
              <CardTitle>{t(section.titleKey)}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{t(section.descKey)}</p>
              <div className="flex flex-wrap gap-2">
                {section.links.map((link) => (
                  <button
                    key={link.url}
                    type="button"
                    onClick={() => setReader({ url: link.url, title: link.label })}
                    className="text-xs text-primary underline underline-offset-2 hover:text-primary/80"
                  >
                    {link.label}
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
