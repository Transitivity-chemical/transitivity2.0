'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useConfirm } from '@/components/providers/ConfirmDialogProvider';
import { Plus, Trash2, Eye, FlaskConical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

interface GeneratedFileSummary {
  id: string;
  fileType: string;
  filename: string;
}

interface SimulationSummary {
  id: string;
  name: string | null;
  mdMethod: string;
  status: string;
  dftFunctional: string | null;
  temperature: number | null;
  createdAt: string;
  generatedFiles: GeneratedFileSummary[];
}

interface Props {
  simulations: SimulationSummary[];
  locale: string;
}

export function MDSimulationList({ simulations, locale }: Props) {
  const t = useTranslations('md');
  const router = useRouter();
  const confirmDialog = useConfirm();
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    const ok = await confirmDialog({
      title: 'Excluir simulação?',
      description: t('deleteConfirm'),
      confirmLabel: 'Excluir',
      variant: 'destructive',
    });
    if (!ok) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/v1/md/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Simulação excluída');
        router.refresh();
      } else {
        toast.error('Erro ao excluir');
      }
    } finally {
      setDeleting(null);
    }
  };

  const statusColor: Record<string, string> = {
    COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    FAILED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    DRAFT: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    RUNNING: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  };

  function formatSimulationDate(value: string) {
      return new Date(value).toLocaleDateString(locale, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button className="w-full sm:w-auto" onClick={() => router.push(`/${locale}/md/new`)}>
          <Plus className="mr-2 size-4" />
          {t('newSimulation')}
        </Button>
      </div>

      {simulations.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FlaskConical className="size-12 text-muted-foreground/50" />
            <p className="mt-4 text-sm text-muted-foreground">
              {t('noSimulations')}
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push(`/${locale}/md/new`)}
            >
              <Plus className="mr-2 size-4" />
              {t('newSimulation')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {simulations.map((sim) => (
            <Card key={sim.id} className="group relative overflow-hidden border-border/80 transition-shadow hover:shadow-lg">
              <CardHeader className="space-y-4 pb-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-2">
                    <Badge variant="outline" className="w-fit text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                      {sim.mdMethod}
                    </Badge>
                    <CardTitle className="line-clamp-2 text-base leading-tight sm:text-lg">
                      {sim.name || `${sim.mdMethod} Simulation`}
                    </CardTitle>
                  </div>
                  <Badge
                    variant="secondary"
                    className={`shrink-0 ${statusColor[sim.status] || ''}`}
                  >
                    {sim.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex h-full flex-col gap-4 text-sm text-muted-foreground">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{t('method')}</p>
                    <p className="mt-1 font-medium text-foreground">{sim.mdMethod}</p>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{t('files')}</p>
                    <p className="mt-1 font-medium text-foreground">{sim.generatedFiles.length}</p>
                  </div>
                  {sim.temperature != null && (
                    <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{t('temperature')}</p>
                      <p className="mt-1 font-medium text-foreground">{sim.temperature} K</p>
                    </div>
                  )}
                  {sim.dftFunctional && (
                    <div className="rounded-xl border border-border/70 bg-muted/20 p-3 sm:col-span-2">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{t('functional')}</p>
                      <p className="mt-1 break-words font-medium text-foreground">{sim.dftFunctional}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-border/80 px-3 py-2 text-xs">
                  <span className="uppercase tracking-[0.14em] text-muted-foreground">Created</span>
                  <span className="font-medium text-foreground">{formatSimulationDate(sim.createdAt)}</span>
                </div>

                <div className="mt-auto flex flex-col gap-2 pt-1 sm:flex-row">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full sm:flex-1"
                    onClick={() => router.push(`/${locale}/md/${sim.id}`)}
                  >
                    <Eye className="mr-1 size-3" />
                    {t('viewResults')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full sm:w-auto"
                    disabled={deleting === sim.id}
                    onClick={() => handleDelete(sim.id)}
                  >
                    <Trash2 className="size-3 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
