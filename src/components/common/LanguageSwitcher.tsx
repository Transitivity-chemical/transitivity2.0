'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';

const localeLabels: Record<string, string> = {
  en: 'EN',
  'pt-BR': 'PT',
};

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  function switchLocale() {
    const nextLocale = locale === 'en' ? 'pt-BR' : 'en';
    const newPath = pathname.replace(`/${locale}`, `/${nextLocale}`);
    router.push(newPath);
  }

  return (
    <button
      onClick={switchLocale}
      className="rounded border px-2 py-1 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800"
    >
      {localeLabels[locale]}
    </button>
  );
}
