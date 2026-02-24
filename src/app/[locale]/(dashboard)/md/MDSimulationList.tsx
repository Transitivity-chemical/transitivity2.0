'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
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
  const tCommon = useTranslations('common');
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm(t('deleteConfirm'))) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/v1/md/${id}`, { method: 'DELETE' });
      if (res.ok) {
        router.refresh();
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

  return (
    <div className="space-y-4">
      <Button onClick={() => router.push(`/${locale}/md/new`)}>
        <Plus className="mr-2 size-4" />
        {t('newSimulation')}
      </Button>

      {simulations.length === 0 ? (
        <Card>
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {simulations.map((sim) => (
            <Card key={sim.id} className="group relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base leading-tight">
                    {sim.name || `${sim.mdMethod} Simulation`}
                  </CardTitle>
                  <Badge
                    variant="secondary"
                    className={statusColor[sim.status] || ''}
                  >
                    {sim.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>{t('method')}</span>
                  <span className="font-medium text-foreground">
                    {sim.mdMethod}
                  </span>
                </div>
                {sim.dftFunctional && (
                  <div className="flex justify-between">
                    <span>{t('functional')}</span>
                    <span className="font-medium text-foreground">
                      {sim.dftFunctional}
                    </span>
                  </div>
                )}
                {sim.temperature != null && (
                  <div className="flex justify-between">
                    <span>{t('temperature')}</span>
                    <span className="font-medium text-foreground">
                      {sim.temperature} K
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>{t('files')}</span>
                  <span className="font-medium text-foreground">
                    {sim.generatedFiles.length}
                  </span>
                </div>
                <div className="text-xs">
                  {new Date(sim.createdAt).toLocaleDateString()}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => router.push(`/${locale}/md/${sim.id}`)}
                  >
                    <Eye className="mr-1 size-3" />
                    {t('viewResults')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
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
