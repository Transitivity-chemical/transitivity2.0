'use client';

import { useTranslations } from 'next-intl';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { MDWizard } from './new/MDWizard';
import { MDMultiClient } from './multi/MDMultiClient';

/**
 * MD sub-tab shell: Single Input + Multiple Inputs.
 *
 * Reference: docs/tabs-rebuild-impeccable-plan.md Phase 3
 */
export function MdTabsClient() {
  const t = useTranslations('mdTabs');

  return (
    <Tabs defaultValue="single" className="w-full">
      <TabsList>
        <TabsTrigger value="single">{t('singleTab')}</TabsTrigger>
        <TabsTrigger value="multi">{t('multiTab')}</TabsTrigger>
      </TabsList>
      <TabsContent value="single" className="mt-5">
        <MDWizard />
      </TabsContent>
      <TabsContent value="multi" className="mt-5">
        <MDMultiClient />
      </TabsContent>
    </Tabs>
  );
}
