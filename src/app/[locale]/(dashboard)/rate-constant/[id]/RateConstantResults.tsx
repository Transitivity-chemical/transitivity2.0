'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface Reaction {
  id: string;
  name: string;
  reactionType: string;
  energyType: string;
  status: string;
  forwardBarrier?: number;
  reverseBarrier?: number;
  crossoverTemp?: number;
  imaginaryFreq?: number;
  rateConstants?: Record<string, number[]>;
  tunnelingCoeffs?: Record<string, number[]>;
  species: Array<{
    id: string;
    role: string;
    label?: string;
    scfEnergy?: number;
    molecularMass?: number;
  }>;
  temperatureGrid?: { values: number[] };
}

export function RateConstantResults({ reaction }: { reaction: Reaction }) {
  const t = useTranslations('rateConstant');
  const pathname = usePathname();
  const locale = pathname.split('/')[1];

  const temperatures = reaction.temperatureGrid?.values || [];
  const rateConstants = reaction.rateConstants || {};
  const methods = Object.keys(rateConstants);

  const downloadCSV = () => {
    const headers = ['T (K)', ...methods.map((m) => `k_${m}`)];
    const rows = temperatures.map((temp, i) => [
      temp,
      ...methods.map((m) => rateConstants[m]?.[i]?.toExponential(6) || ''),
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reaction.name.replace(/\s+/g, '_')}_rate_constants.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Arrhenius plot data: 1000/T vs ln(k)
  const arrheniusData = useMemo(() => {
    return methods.map((method) => ({
      method,
      points: temperatures.map((temp, i) => ({
        x: 1000 / temp,
        y: Math.log(Math.abs(rateConstants[method]?.[i] || 1e-300)),
      })),
    }));
  }, [temperatures, rateConstants, methods]);

  const COLORS = ['#2563eb', '#dc2626', '#16a34a', '#d97706', '#7c3aed', '#ec4899'];

  if (reaction.status !== 'COMPLETED') {
    return (
      <div className="space-y-4">
        <Link href={`/${locale}/rate-constant`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 size-4" /> {t('title')}
          </Button>
        </Link>
        <Card>
          <CardContent className="py-12 text-center">
            <Badge variant="secondary">{reaction.status}</Badge>
            <p className="mt-4 text-muted-foreground">{t('notComputed')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/${locale}/rate-constant`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-1 size-4" /> {t('title')}
            </Button>
          </Link>
          <h1 className="text-xl font-bold">{reaction.name}</h1>
          <Badge>{reaction.reactionType}</Badge>
        </div>
        <Button onClick={downloadCSV} variant="outline" size="sm">
          <Download className="mr-1 size-4" /> CSV
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {reaction.forwardBarrier != null && (
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">{t('forwardBarrier')}</p>
              <p className="text-lg font-semibold">{reaction.forwardBarrier.toFixed(2)} kJ/mol</p>
            </CardContent>
          </Card>
        )}
        {reaction.reverseBarrier != null && (
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">{t('reverseBarrier')}</p>
              <p className="text-lg font-semibold">{reaction.reverseBarrier.toFixed(2)} kJ/mol</p>
            </CardContent>
          </Card>
        )}
        {reaction.crossoverTemp != null && (
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">{t('crossoverTemp')}</p>
              <p className="text-lg font-semibold">{reaction.crossoverTemp.toFixed(1)} K</p>
            </CardContent>
          </Card>
        )}
        {reaction.imaginaryFreq != null && (
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">{t('imagFreq')}</p>
              <p className="text-lg font-semibold">{reaction.imaginaryFreq.toFixed(1)} cm⁻¹</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Tabs defaultValue="table">
        <TabsList>
          <TabsTrigger value="table">{t('table')}</TabsTrigger>
          <TabsTrigger value="arrhenius">{t('arrheniusPlot')}</TabsTrigger>
          <TabsTrigger value="species">{t('step_species')}</TabsTrigger>
        </TabsList>

        {/* Table */}
        <TabsContent value="table">
          <Card>
            <CardContent className="overflow-x-auto pt-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-3 py-2 text-left font-medium">T (K)</th>
                    {methods.map((m) => (
                      <th key={m} className="px-3 py-2 text-right font-medium">
                        k<sub>{m}</sub>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {temperatures.map((temp, i) => (
                    <tr key={temp} className="border-b border-muted/50">
                      <td className="px-3 py-1.5 font-mono">{temp}</td>
                      {methods.map((m) => (
                        <td key={m} className="px-3 py-1.5 text-right font-mono text-xs">
                          {rateConstants[m]?.[i]?.toExponential(4) || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Arrhenius Plot */}
        <TabsContent value="arrhenius">
          <Card>
            <CardHeader>
              <CardTitle>{t('arrheniusPlot')}</CardTitle>
            </CardHeader>
            <CardContent>
              {arrheniusData.length > 0 && (
                <div className="relative">
                  <svg viewBox="0 0 600 400" className="w-full" style={{ maxHeight: '500px' }}>
                    {/* Axes */}
                    <line x1="60" y1="360" x2="580" y2="360" stroke="currentColor" strokeWidth="1" opacity="0.3" />
                    <line x1="60" y1="20" x2="60" y2="360" stroke="currentColor" strokeWidth="1" opacity="0.3" />
                    <text x="320" y="395" textAnchor="middle" className="fill-current text-xs">
                      1000/T (K⁻¹)
                    </text>
                    <text x="15" y="190" textAnchor="middle" className="fill-current text-xs" transform="rotate(-90, 15, 190)">
                      ln(k)
                    </text>

                    {/* Data */}
                    {arrheniusData.map((series, si) => {
                      if (series.points.length === 0) return null;
                      const xMin = Math.min(...series.points.map((p) => p.x));
                      const xMax = Math.max(...series.points.map((p) => p.x));
                      const allY = arrheniusData.flatMap((s) => s.points.map((p) => p.y));
                      const yMin = Math.min(...allY);
                      const yMax = Math.max(...allY);
                      const xRange = xMax - xMin || 1;
                      const yRange = yMax - yMin || 1;

                      const toSvg = (p: { x: number; y: number }) => ({
                        sx: 60 + ((p.x - xMin) / xRange) * 520,
                        sy: 360 - ((p.y - yMin) / yRange) * 340,
                      });

                      const path = series.points
                        .map((p, i) => {
                          const { sx, sy } = toSvg(p);
                          return `${i === 0 ? 'M' : 'L'} ${sx} ${sy}`;
                        })
                        .join(' ');

                      return (
                        <g key={series.method}>
                          <path d={path} fill="none" stroke={COLORS[si % COLORS.length]} strokeWidth="2" />
                          {series.points.map((p, pi) => {
                            const { sx, sy } = toSvg(p);
                            return (
                              <circle
                                key={pi}
                                cx={sx}
                                cy={sy}
                                r="2.5"
                                fill={COLORS[si % COLORS.length]}
                              />
                            );
                          })}
                        </g>
                      );
                    })}
                  </svg>

                  {/* Legend */}
                  <div className="mt-2 flex flex-wrap gap-4 px-4">
                    {arrheniusData.map((series, si) => (
                      <div key={series.method} className="flex items-center gap-1.5 text-xs">
                        <div
                          className="size-3 rounded-full"
                          style={{ backgroundColor: COLORS[si % COLORS.length] }}
                        />
                        {series.method}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Species details */}
        <TabsContent value="species">
          <div className="grid gap-3 md:grid-cols-2">
            {reaction.species.map((sp) => (
              <Card key={sp.id}>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{sp.role.replace('_', ' ')}</Badge>
                    <span className="font-medium">{sp.label}</span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                    {sp.scfEnergy != null && (
                      <p>E = {sp.scfEnergy.toFixed(6)} Hartree</p>
                    )}
                    {sp.molecularMass != null && (
                      <p>M = {sp.molecularMass.toFixed(4)} g/mol</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
