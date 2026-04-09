'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Eye } from 'lucide-react';

type FittingJob = {
  id: string;
  name: string | null;
  modelType: string;
  plotType: string;
  status: string;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
  computeTimeMs: number | null;
  result: { chiSquare: number | null; paramA: number | null } | null;
};

export function FittingHistoryClient({ locale, jobs: initialJobs }: { locale: string; jobs: FittingJob[] }) {
  const t = useTranslations('fittingHistory');
  const [jobs, setJobs] = useState(initialJobs);

  const handleDelete = async (id: string) => {
    if (!confirm(t('confirmDelete'))) return;
    const res = await fetch(`/api/v1/fitting/${id}`, { method: 'DELETE' });
    if (res.ok) setJobs((prev) => prev.filter((j) => j.id !== id));
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{t('description')}</p>
        </div>
        <Button asChild>
          <Link href={`/${locale}/fitting`}>{t('newFit')}</Link>
        </Button>
      </div>

      {jobs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {t('empty')}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{t('savedFits')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between border-b last:border-b-0 py-3 text-sm"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{job.name || 'Untitled fit'}</span>
                      <Badge variant="outline">{job.modelType}</Badge>
                      <Badge variant={job.status === 'COMPLETED' ? 'secondary' : 'destructive'}>
                        {job.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {new Date(job.createdAt).toLocaleString(locale)}
                      {job.result?.chiSquare !== null && job.result?.chiSquare !== undefined && (
                        <span className="ml-2">χ² = {job.result.chiSquare.toFixed(4)}</span>
                      )}
                      {job.errorMessage && <span className="ml-2 text-red-500">{job.errorMessage}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1 ml-4">
                    <Button asChild size="sm" variant="ghost">
                      <Link href={`/${locale}/fitting?jobId=${job.id}`}>
                        <Eye className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(job.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
