'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MessageSquarePlus, MessageSquare } from 'lucide-react';
import ChatPanel from '@/components/chemistry/ChatPanel';

interface Conversation {
  id: string;
  title: string | null;
  updatedAt: string;
}

interface AssistantClientProps {
  translations: {
    title: string;
    newChat: string;
    conversations: string;
    noConversations: string;
  };
}

export default function AssistantClient({ translations }: AssistantClientProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/chat/history');
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations ?? []);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const handleNewChat = () => {
    setActiveConversationId(undefined);
  };

  const handleNewConversation = (id: string) => {
    setActiveConversationId(id);
    loadConversations();
  };

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div
        className={cn(
          'flex flex-col border-r bg-muted/30 transition-all duration-200',
          sidebarOpen ? 'w-72' : 'w-0 overflow-hidden',
        )}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between border-b p-3">
          <h2 className="text-sm font-semibold">{translations.conversations}</h2>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleNewChat}
            title={translations.newChat}
          >
            <MessageSquarePlus className="size-4" />
          </Button>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <p className="p-4 text-center text-xs text-muted-foreground">
              {translations.noConversations}
            </p>
          ) : (
            <div className="space-y-0.5 p-2">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv.id)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                    'hover:bg-muted',
                    activeConversationId === conv.id && 'bg-muted font-medium',
                  )}
                >
                  <MessageSquare className="size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate">{conv.title || 'Untitled'}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(conv.updatedAt)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Toggle sidebar button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="flex items-center border-r bg-muted/20 px-1 hover:bg-muted/50 transition-colors"
        aria-label="Toggle sidebar"
      >
        <div className="h-8 w-1 rounded-full bg-muted-foreground/30" />
      </button>

      {/* Chat panel */}
      <div className="flex-1">
        <ChatPanel
          key={activeConversationId ?? 'new'}
          conversationId={activeConversationId}
          onNewConversation={handleNewConversation}
        />
      </div>
    </div>
  );
}
