import { getTranslations } from 'next-intl/server';
import AssistantClient from './AssistantClient';

export default async function AssistantPage() {
  const t = await getTranslations('assistant');

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <AssistantClient
        translations={{
          title: t('title'),
          newChat: t('newChat'),
          conversations: t('conversations'),
          noConversations: t('noConversations'),
        }}
      />
    </div>
  );
}
