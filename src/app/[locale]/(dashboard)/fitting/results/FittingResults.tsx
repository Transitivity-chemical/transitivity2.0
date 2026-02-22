'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { SimpleChart } from '@/components/chemistry/SimpleChart';

interface FittedCurve {
  temperatures: number[];
  rateConstants: number[];
}

interface FitResult {
  modelType: string;
  parameters: Record<string, number>;
  chiSquare: number;
  rSquared: number;
  rmsd: number;
  fittedCurve: FittedCurve;
  residuals: number[];
  success: boolean;
  message: string;
}

interface StoredResults {
  results: FitResult[];
  errors: { modelType: string; error: string }[];
  datasetName: string;
  temperatures: number[];
  rateConstants: number[];
}

const COLORS = [
  '#2563eb', '#dc2626', '#16a34a', '#d97706', '#7c3aed', '#db2777',
];

export function FittingResults() {
  const t = useTranslations('fittingWizard');
  const tCommon = useTranslations('common');

  const [data, setData] = useState<StoredResults | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem('fittingResults');
    if (raw) {
      try {
        setData(JSON.parse(raw));
      } catch {
        setData(null);
      }
    }
  }, []);

  const arrheniusPlotSeries = useMemo(() => {
    if (!data) return [];

    const invT = data.temperatures.map((t) => 1000 / t);
    const lnK = data.rateConstants.map((k) => Math.log(k));

    const series: {
      label: string;
      x: number[];
      y: number[];
      type: 'scatter' | 'line';
      color: string;
    }[] = [
      {
        label: t('experimental'),
        x: invT,
        y: lnK,
        type: 'scatter',
        color: '#000',
      },
    ];

    data.results.forEach((r, i) => {
      const curveInvT = r.fittedCurve.temperatures.map((t) => 1000 / t);
      const curveLnK = r.fittedCurve.rateConstants.map((k) => Math.log(k));
      series.push({
        label: r.modelType,
        x: curveInvT,
        y: curveLnK,
        type: 'line',
        color: COLORS[i % COLORS.length],
      });
    });

    return series;
  }, [data, t]);

  const transitivityPlotSeries = useMemo(() => {
    if (!data) return [];

    const series: {
      label: string;
      x: number[];
      y: number[];
      type: 'scatter' | 'line';
      color: string;
    }[] = [];

    data.results.forEach((r, i) => {
      const temps = r.fittedCurve.temperatures;
      const rates = r.fittedCurve.rateConstants;

      // Compute d = -d(ln k)/d(1/T) / (1/T) numerically
      const invT = temps.map((t) => 1 / t);
      const lnK = rates.map((k) => Math.log(k));
      const dValues: number[] = [];
      const dInvT: number[] = [];

      for (let j = 1; j < invT.length - 1; j++) {
        const dLnK = lnK[j + 1] - lnK[j - 1];
        const dInvTj = invT[j + 1] - invT[j - 1];
        if (Math.abs(dInvTj) > 1e-30) {
          dValues.push(-dLnK / dInvTj);
          dInvT.push(invT[j]);
        }
      }

      if (dValues.length > 0) {
        series.push({
          label: r.modelType,
          x: dInvT.map((v) => v * 1000),
          y: dValues,
          type: 'line',
          color: COLORS[i % COLORS.length],
        });
      }
    });

    return series;
  }, [data]);

  const downloadCsv = () => {
    if (!data) return;

    const lines: string[] = [];
    lines.push('Model,Parameter,Value,Chi-Square,R-Squared,RMSD');

    for (const r of data.results) {
      const paramEntries = Object.entries(r.parameters);
      for (const [pName, pVal] of paramEntries) {
        lines.push(
          `${r.modelType},${pName},${pVal.toExponential(6)},${r.chiSquare.toExponential(6)},${r.rSquared.toFixed(8)},${r.rmsd.toExponential(6)}`,
        );
      }
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fitting_results_${data.datasetName || 'data'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!data) {
    return (
      <p className="text-sm text-muted-foreground">{t('noResults')}</p>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {t('comparisonTable')} - {data.datasetName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 pr-4 font-medium">{t('model')}</th>
                  <th className="pb-2 pr-4 font-medium text-right">Chi-Square</th>
                  <th className="pb-2 pr-4 font-medium text-right">R²</th>
                  <th className="pb-2 pr-4 font-medium text-right">RMSD</th>
                  <th className="pb-2 font-medium">{t('parameters')}</th>
                </tr>
              </thead>
              <tbody>
                {data.results.map((r, i) => (
                  <tr
                    key={r.modelType}
                    className="border-b last:border-0"
                  >
                    <td className="py-2 pr-4">
                      <span
                        className="mr-2 inline-block h-3 w-3 rounded-sm"
                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                      />
                      {r.modelType}
                    </td>
                    <td className="py-2 pr-4 text-right font-mono text-xs">
                      {r.chiSquare.toExponential(4)}
                    </td>
                    <td className="py-2 pr-4 text-right font-mono text-xs">
                      {r.rSquared.toFixed(6)}
                    </td>
                    <td className="py-2 pr-4 text-right font-mono text-xs">
                      {r.rmsd.toExponential(4)}
                    </td>
                    <td className="py-2 font-mono text-xs">
                      {Object.entries(r.parameters)
                        .map(([k, v]) => `${k}=${v.toExponential(4)}`)
                        .join(', ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.errors.length > 0 && (
            <div className="mt-4 space-y-1">
              {data.errors.map((e) => (
                <p key={e.modelType} className="text-xs text-destructive">
                  {e.modelType}: {e.error}
                </p>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plots */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('arrheniusPlot')}</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleChart
              series={arrheniusPlotSeries}
              xLabel="1000/T (K⁻¹)"
              yLabel="ln(k)"
              title={t('arrheniusPlot')}
            />
          </CardContent>
        </Card>

        {transitivityPlotSeries.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t('transitivityPlot')}</CardTitle>
            </CardHeader>
            <CardContent>
              <SimpleChart
                series={transitivityPlotSeries}
                xLabel="1000/T (K⁻¹)"
                yLabel="d (deformation parameter)"
                title={t('transitivityPlot')}
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Download */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={downloadCsv}>
          {tCommon('download')} CSV
        </Button>
      </div>
    </div>
  );
}
