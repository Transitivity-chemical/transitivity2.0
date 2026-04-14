'use client';

import type { Data } from 'plotly.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlotlyChart } from '@/components/chemistry/PlotlyChart';

interface Props {
  days: { date: string; rc: number; md: number; fit: number }[];
  planStats: { plan: string; count: number }[];
}

export function AnalyticsCharts({ days, planStats }: Props) {
  const timeline: Data[] = [
    {
      x: days.map((d) => d.date),
      y: days.map((d) => d.rc),
      type: 'bar',
      name: 'Rate constant',
      marker: { color: '#1e3a5f' },
    },
    {
      x: days.map((d) => d.date),
      y: days.map((d) => d.md),
      type: 'bar',
      name: 'MD',
      marker: { color: '#60a5fa' },
    },
    {
      x: days.map((d) => d.date),
      y: days.map((d) => d.fit),
      type: 'bar',
      name: 'Fitting',
      marker: { color: '#34d399' },
    },
  ];

  const distribution: Data[] = [
    {
      values: planStats.map((p) => p.count),
      labels: planStats.map((p) => p.plan),
      type: 'pie',
      hole: 0.55,
      marker: { colors: ['#1e3a5f', '#60a5fa', '#f59e0b', '#34d399'] },
    },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Cálculos (últimos 14 dias)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <PlotlyChart
              data={timeline}
              layout={{
                barmode: 'stack',
                margin: { l: 40, r: 10, t: 10, b: 40 },
                showlegend: true,
                legend: { orientation: 'h', y: -0.2 },
              }}
              ariaLabel="Calculation timeline"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Distribuição de planos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <PlotlyChart
              data={distribution}
              layout={{ margin: { l: 10, r: 10, t: 10, b: 10 }, showlegend: true }}
              ariaLabel="Plan distribution"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
