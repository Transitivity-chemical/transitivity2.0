'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { ArrowLeft, Zap, Clock, AlertTriangle } from 'lucide-react';

interface MLJobData {
  id: string;
  name: string | null;
  mlProvider: string;
  mlTaskType: string;
  neuralPotential: string | null;
  status: string;
  errorMessage: string | null;
  inputData: unknown;
  resultData: unknown;
  tokensConsumed: number;
  gpuTimeSeconds: number | null;
  gpuType: string | null;
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  completedAt: string | null;
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

export function MLResult({ job }: { job: MLJobData }) {
  const t = useTranslations('ml');
  const locale = useLocale();
  const router = useRouter();

  const result = job.resultData as {
    energy_hartree?: number;
    energy_kjmol?: number;
    forces?: number[][];
    optimized_atoms?: { element: string; x: number; y: number; z: number }[];
  } | null;

  const input = job.inputData as {
    atoms?: { element: string; x: number; y: number; z: number }[];
    model?: string;
    task?: string;
  } | null;

  return (
    <div className="max-w-3xl space-y-4">
      <Button variant="outline" size="sm" onClick={() => router.push('/${locale}/ml')}>
        <ArrowLeft className="mr-1 size-4" />
        {t('backToList')}
      </Button>

      {/* Job metadata */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('jobDetails')}</CardTitle>
            <Badge variant={statusVariant(job.status)}>
              {t(`status.${job.status}`)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded border p-3">
              <p className="text-xs text-muted-foreground">{t('stepModel')}</p>
              <p className="flex items-center gap-1 font-medium text-sm mt-1">
                <Zap className="size-3.5 text-primary" />
                {potentialLabel(job.neuralPotential)}
              </p>
            </div>
            <div className="rounded border p-3">
              <p className="text-xs text-muted-foreground">{t('stepTask')}</p>
              <p className="font-medium text-sm mt-1">{taskLabel(job.mlTaskType)}</p>
            </div>
            <div className="rounded border p-3">
              <p className="text-xs text-muted-foreground">{t('created')}</p>
              <p className="flex items-center gap-1 font-medium text-sm mt-1">
                <Clock className="size-3.5" />
                {new Date(job.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {job.errorMessage && (
        <Card className="border-destructive/50">
          <CardContent className="flex items-start gap-3 pt-6">
            <AlertTriangle className="size-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm text-destructive">{t('errorOccurred')}</p>
              <p className="text-sm text-muted-foreground mt-1">{job.errorMessage}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Input atoms */}
      {input?.atoms && input.atoms.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('inputGeometry')}</CardTitle>
            <CardDescription>
              {input.atoms.length} {t('atoms')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded border">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-2 py-1 text-left">#</th>
                    <th className="px-2 py-1 text-left">{t('element')}</th>
                    <th className="px-2 py-1 text-right">X</th>
                    <th className="px-2 py-1 text-right">Y</th>
                    <th className="px-2 py-1 text-right">Z</th>
                  </tr>
                </thead>
                <tbody>
                  {input.atoms.map((a, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="px-2 py-1">{i + 1}</td>
                      <td className="px-2 py-1">{a.element}</td>
                      <td className="px-2 py-1 text-right">{a.x.toFixed(6)}</td>
                      <td className="px-2 py-1 text-right">{a.y.toFixed(6)}</td>
                      <td className="px-2 py-1 text-right">{a.z.toFixed(6)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && job.status === 'COMPLETED' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('results')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Energy */}
            {result.energy_hartree != null && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded border p-3">
                  <p className="text-xs text-muted-foreground">{t('energyHartree')}</p>
                  <p className="font-mono text-lg font-semibold">
                    {result.energy_hartree.toFixed(8)}
                  </p>
                </div>
                {result.energy_kjmol != null && (
                  <div className="rounded border p-3">
                    <p className="text-xs text-muted-foreground">{t('energyKjmol')}</p>
                    <p className="font-mono text-lg font-semibold">
                      {result.energy_kjmol.toFixed(4)}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Forces */}
            {result.forces && result.forces.length > 0 && (
              <details className="text-sm">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                  {t('forces')} ({result.forces.length} {t('atoms')})
                </summary>
                <div className="mt-2 overflow-x-auto rounded border">
                  <table className="w-full text-xs font-mono">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-2 py-1 text-left">#</th>
                        <th className="px-2 py-1 text-right">Fx</th>
                        <th className="px-2 py-1 text-right">Fy</th>
                        <th className="px-2 py-1 text-right">Fz</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.forces.map((f, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="px-2 py-1">{i + 1}</td>
                          <td className="px-2 py-1 text-right">{f[0]?.toFixed(6)}</td>
                          <td className="px-2 py-1 text-right">{f[1]?.toFixed(6)}</td>
                          <td className="px-2 py-1 text-right">{f[2]?.toFixed(6)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            )}

            {/* Optimized geometry */}
            {result.optimized_atoms && result.optimized_atoms.length > 0 && (
              <details className="text-sm">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                  {t('optimizedGeometry')} ({result.optimized_atoms.length} {t('atoms')})
                </summary>
                <div className="mt-2 overflow-x-auto rounded border">
                  <table className="w-full text-xs font-mono">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-2 py-1 text-left">{t('element')}</th>
                        <th className="px-2 py-1 text-right">X</th>
                        <th className="px-2 py-1 text-right">Y</th>
                        <th className="px-2 py-1 text-right">Z</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.optimized_atoms.map((a, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="px-2 py-1">{a.element}</td>
                          <td className="px-2 py-1 text-right">{a.x.toFixed(6)}</td>
                          <td className="px-2 py-1 text-right">{a.y.toFixed(6)}</td>
                          <td className="px-2 py-1 text-right">{a.z.toFixed(6)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
