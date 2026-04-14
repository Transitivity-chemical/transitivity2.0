import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/format-date';
import type { ComponentType } from 'react';

export interface SubTabHistoryRow {
  id: string;
  label: string;
  status: string;
  createdAt: Date;
  subType: string;
  href: string;
}

interface Props {
  locale: string;
  rows: SubTabHistoryRow[];
  subTabs: { label: string; href: string; icon: ComponentType<{ className?: string }> }[];
  emptyMessage?: string;
}

export function SubTabHistoryList({ locale, rows, subTabs, emptyMessage }: Props) {
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        {subTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={`/${locale}${tab.href}`}
              className="group flex items-center gap-3 rounded-lg border bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
            >
              <div className="rounded-md bg-primary/10 p-2 text-primary">
                <Icon className="size-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">{tab.label}</p>
                <p className="text-xs text-muted-foreground">Abrir workbench →</p>
              </div>
            </Link>
          );
        })}
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">
              {emptyMessage ?? 'Nenhum cálculo ainda.'}
            </p>
          ) : (
            <ul className="divide-y">
              {rows.map((row) => (
                <li key={row.id}>
                  <Link
                    href={row.href}
                    className="flex items-center gap-3 px-5 py-3 text-sm transition hover:bg-accent/40"
                  >
                    <Badge variant="outline" className="text-[10px]">
                      {row.subType}
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{row.label}</p>
                    </div>
                    <Badge
                      variant={row.status === 'COMPLETED' ? 'secondary' : row.status === 'FAILED' ? 'destructive' : 'outline'}
                      className="text-[10px]"
                    >
                      {row.status}
                    </Badge>
                    <span className="hidden w-40 text-right text-xs tabular-nums text-muted-foreground sm:inline">
                      {formatDateTime(row.createdAt, locale)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
