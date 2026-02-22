import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

export default async function FittingPage() {
  const t = await getTranslations('fittingWizard');
  const tNav = await getTranslations('nav');

  const links = [
    { href: 'fitting/data', label: t('dataInput'), desc: t('dataInputDesc') },
    { href: 'fitting/configure', label: t('configureFitting'), desc: t('configureFittingDesc') },
    { href: 'fitting/results', label: t('viewResults'), desc: t('viewResultsDesc') },
  ];

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">{tNav('fitting')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('hubDesc')}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group rounded-lg border border-border p-6 transition-colors hover:border-primary/40 hover:bg-primary/5"
          >
            <h2 className="font-semibold text-foreground group-hover:text-primary">
              {link.label}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{link.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
