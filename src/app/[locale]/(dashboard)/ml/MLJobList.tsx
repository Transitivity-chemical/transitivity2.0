'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Zap, FlaskConical, Eye } from 'lucide-react';

interface MLJobSummary {
  id: string;
  name: string | null;
  mlProvider: string;
  mlTaskType: string;
  neuralPotential: string | null;
  status: string;
  errorMessage: string | null;
  createdAt: Date;
  completedAt: Date | null;
}

function statusVariant(status: string) {
  switch (status) {
    case 'COMPLETED':
      return 'default' as const;
    case 'RUNNING':
    case 'PENDING':
      return 'secondary' as const;
    case 'FAILED':
      return 'destructive' as const;
    default:
      return 'outline' as const;
  }
}

function potentialLabel(potential: string | null) {
  const map: Record<string, string> = {
    ANI_2X: 'ANI-2x',
    MACE: 'MACE',
    AIQM1: 'AIQM1',
  };
  return potential ? map[potential] ?? potential : '-';
}

function taskLabel(task: string) {
  const map: Record<string, string> = {
    SINGLE_POINT: 'Single Point',
    OPTIMIZATION: 'Optimization',
    FREQUENCY: 'Frequency',
    MD: 'MD',
    TRAINING: 'Training',
  };
  return map[task] ?? task;
}

export function MLJobList({ jobs }: { jobs: MLJobSummary[] }) {
  const t = useTranslations('ml');
  const router = useRouter();

  return (
    <div className="space-y-4">
      {jobs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FlaskConical className="size-12 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">{t('noJobs')}</p>
            <p className="text-sm text-muted-foreground mt-1">{t('noJobsHint')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {jobs.map((job) => (
            <Card
              key={job.id}
              className="cursor-pointer hover:border-primary/40 transition-colors"
              onClick={() => router.push(`ml/${job.id}`)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    {job.name || t('untitled')}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusVariant(job.status)}>
                      {t(`status.${job.status}`)}
                    </Badge>
                    <Button variant="ghost" size="sm" className="size-8 p-0">
                      <Eye className="size-4" />
                    </Button>
                  </div>
                </div>
                <CardDescription className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1">
                    <Zap className="size-3" />
                    {potentialLabel(job.neuralPotential)}
                  </span>
                  <span>{taskLabel(job.mlTaskType)}</span>
                  <span>
                    {new Date(job.createdAt).toLocaleDateString()}
                  </span>
                </CardDescription>
              </CardHeader>
              {job.errorMessage && (
                <CardContent className="pt-0">
                  <p className="text-xs text-destructive truncate">
                    {job.errorMessage}
                  </p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
