'use client';

import { useTranslations } from 'next-intl';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { RateConstantWorkbench } from './RateConstantWorkbench';
import { MarcusTheoryTab } from './MarcusTheoryTab';

/**
 * Rate Constant sub-tab shell: Conventional TST + Marcus Theory.
 *
 * Reference: docs/tabs-rebuild-impeccable-plan.md Phases 5, 6
 */
export function RateConstantTabsClient() {
  const t = useTranslations('rateConstantTabs');

  return (
    <Tabs defaultValue="ctst" className="w-full">
      <TabsList>
        <TabsTrigger value="ctst">{t('ctstTab')}</TabsTrigger>
        <TabsTrigger value="marcus">{t('marcusTab')}</TabsTrigger>
      </TabsList>
      <TabsContent value="ctst" className="mt-4">
        <RateConstantWorkbench />
      </TabsContent>
      <TabsContent value="marcus" className="mt-4">
        <MarcusTheoryTab />
      </TabsContent>
    </Tabs>
  );
}
