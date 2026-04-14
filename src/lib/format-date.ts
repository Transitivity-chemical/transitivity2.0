/**
 * Date formatting with an explicit timezone.
 *
 * Vercel serverless functions run in UTC. Without an explicit `timeZone`,
 * `toLocaleString(locale)` on the server renders UTC dates, so users see
 * calculation history timestamps 3 hours ahead of their wall clock.
 *
 * Default: America/Sao_Paulo (UTC-03, UnB local time).
 */

export const DEFAULT_TIMEZONE = 'America/Sao_Paulo';

export function formatDateTime(
  date: Date | string | null | undefined,
  locale: string = 'pt-BR',
  options?: Intl.DateTimeFormatOptions,
): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(locale, {
    timeZone: DEFAULT_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  });
}

export function formatDate(
  date: Date | string | null | undefined,
  locale: string = 'pt-BR',
): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(locale, {
    timeZone: DEFAULT_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}
