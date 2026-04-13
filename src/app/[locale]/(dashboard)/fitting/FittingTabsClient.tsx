'use client';

import { useTranslations } from 'next-intl';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { FittingWorkbench } from './FittingWorkbench';
import { TransitivityPlotTab } from './TransitivityPlotTab';

/**
 * GSA Fitting sub-tab shell: Arrhenius Plot (5 theories) + Transitivity Plot (3 theories).
 *
 * Reference: docs/tabs-rebuild-impeccable-plan.md Phase 4
 */
export function FittingTabsClient() {
  const t = useTranslations('fittingTabs');

  return (
    <Tabs defaultValue="arrhenius" className="w-full">
      <TabsList>
        <TabsTrigger value="arrhenius">{t('arrheniusTab')}</TabsTrigger>
        <TabsTrigger value="transitivity">{t('transitivityTab')}</TabsTrigger>
      </TabsList>
      <TabsContent value="arrhenius" className="mt-4">
        <FittingWorkbench />
      </TabsContent>
      <TabsContent value="transitivity" className="mt-4">
        <TransitivityPlotTab />
      </TabsContent>
    </Tabs>
  );
}
