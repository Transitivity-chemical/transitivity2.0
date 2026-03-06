'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Send, Loader2, Bot, User, ChevronDown, Crown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ChatMarkdown } from '@/components/chat/ChatMarkdown';
import { AI_MODEL_CONFIGS, type TAiProvider } from '@/lib/ai-models';
import { PROVIDER_ICONS } from '@/components/icons/ai-providers';

interface Message {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  createdAt?: string;
}

interface ChatPanelProps {
  conversationId?: string;
  onNewConversation?: (id: string) => void;
}

const FREE_MODELS = AI_MODEL_CONFIGS.filter(m => m.isFree);
const PRO_MODELS = AI_MODEL_CONFIGS.filter(m => !m.isFree);

function ProviderIcon({ provider, className }: { provider: TAiProvider; className?: string }) {
  const Icon = PROVIDER_ICONS[provider];
  if (!Icon) return null;
  return <Icon className={className} />;
}

export default function ChatPanel({ conversationId, onNewConversation }: ChatPanelProps) {
  const t = useTranslations('assistant');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>(conversationId);
  const [modelId, setModelId] = useState(FREE_MODELS[0]?.id || AI_MODEL_CONFIGS[0].id);
  const [showModels, setShowModels] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);

  const currentModel = AI_MODEL_CONFIGS.find(m => m.id === modelId) || AI_MODEL_CONFIGS[0];

  useEffect(() => {
    setCurrentConversationId(conversationId);
    if (conversationId) {
      loadMessages(conversationId);
    } else {
      setMessages([]);
    }
  }, [conversationId]);

  // Close model dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(e.target as Node)) {
        setShowModels(false);
      }
    }
    if (showModels) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showModels]);

  const loadMessages = async (convId: string) => {
    try {
      const res = await fetch(`/api/v1/chat/${convId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages ?? []);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;

    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'USER',
      content: trimmed,
    };

    const allMessages = [...messages, userMessage];
    setMessages(allMessages);
    setInput('');
    setIsStreaming(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    const assistantId = `assistant-${Date.now()}`;
    const assistantMessage: Message = {
      id: assistantId,
      role: 'ASSISTANT',
      content: '',
    };
    setMessages((prev) => [...prev, assistantMessage]);

    try {
      const res = await fetch('/api/v1/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: allMessages.map(m => ({
            role: m.role === 'USER' ? 'user' : 'assistant',
            content: m.content,
          })),
          model: modelId,
        }),
      });

      if (!res.ok) {
        let errorMsg = 'Failed to get response';
        try {
          const err = await res.json();
          errorMsg = err.error || errorMsg;
        } catch {
          errorMsg = `HTTP ${res.status}: ${res.statusText}`;
        }
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId ? { ...msg, content: `Error: ${errorMsg}` } : msg,
          ),
        );
        setIsStreaming(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No reader');

      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') break;

          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              accumulated += parsed.content;
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantId ? { ...msg, content: accumulated } : msg,
                ),
              );
            }
            if (parsed.error) {
              accumulated += `\nError: ${parsed.error}`;
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantId ? { ...msg, content: accumulated } : msg,
                ),
              );
            }
          } catch {
            // skip parse errors
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId
            ? { ...msg, content: 'Error: Failed to get response. Please try again.' }
            : msg,
        ),
      );
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 160) + 'px';
  };

  return (
    <div className="flex h-full flex-col">
      {/* Model selector bar */}
      <div className="flex items-center gap-2 border-b px-4 py-2">
        <span className="text-xs text-muted-foreground">Model:</span>
        <div className="relative" ref={modelDropdownRef}>
          <button
            onClick={() => setShowModels(!showModels)}
            className="flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs hover:bg-muted"
          >
            <ProviderIcon provider={currentModel.provider} className="h-3.5 w-3.5" />
            {currentModel.name}
            {!currentModel.isFree && <Crown size={10} className="text-amber-500" />}
            <ChevronDown size={12} className="ml-1 text-muted-foreground" />
          </button>
          {showModels && (
            <div className="absolute left-0 top-8 z-50 max-h-96 w-64 overflow-y-auto rounded-lg border bg-popover py-1 shadow-lg">
              <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Free</div>
              {FREE_MODELS.map(m => (
                <button key={m.id} onClick={() => { setModelId(m.id); setShowModels(false); }}
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-muted',
                    modelId === m.id && 'bg-muted font-medium text-primary',
                  )}>
                  <ProviderIcon provider={m.provider} className="h-3.5 w-3.5 shrink-0" />
                  {m.name}
                </button>
              ))}
              <div className="mt-1 border-t px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Pro <Crown size={10} className="mb-0.5 inline text-amber-500" />
              </div>
              {PRO_MODELS.map(m => (
                <button key={m.id} onClick={() => { setModelId(m.id); setShowModels(false); }}
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-muted',
                    modelId === m.id && 'bg-muted font-medium text-primary',
                  )}>
                  <ProviderIcon provider={m.provider} className="h-3.5 w-3.5 shrink-0" />
                  {m.name}
                  <Crown size={10} className="ml-auto text-amber-500" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Bot className="mx-auto mb-3 size-12 opacity-40" />
              <p className="text-lg font-medium">{t('title')}</p>
              <p className="mt-1 text-sm">{t('placeholder')}</p>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'flex gap-3',
              msg.role === 'USER' ? 'justify-end' : 'justify-start',
            )}
          >
            {msg.role === 'ASSISTANT' && (
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Bot className="size-4" />
              </div>
            )}
            <div
              className={cn(
                'max-w-[80%] rounded-2xl px-4 py-2.5',
                msg.role === 'USER'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground',
              )}
            >
              {msg.role === 'ASSISTANT' ? (
                msg.content ? (
                  <ChatMarkdown content={msg.content} />
                ) : isStreaming ? (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Loader2 className="size-3 animate-spin" />
                    <span className="text-xs">{t('thinking')}</span>
                  </div>
                ) : null
              ) : (
                <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">{msg.content}</div>
              )}
            </div>
            {msg.role === 'USER' && (
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                <User className="size-4" />
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t bg-background p-4">
        <div className="mx-auto flex max-w-3xl items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleTextareaInput}
            onKeyDown={handleKeyDown}
            placeholder={t('placeholder')}
            disabled={isStreaming}
            rows={1}
            className={cn(
              'flex-1 resize-none rounded-xl border bg-muted/50 px-4 py-3 text-sm',
              'placeholder:text-muted-foreground',
              'focus:outline-none focus:ring-2 focus:ring-primary/50',
              'disabled:opacity-50',
            )}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            size="icon"
            className="shrink-0 rounded-xl"
          >
            {isStreaming ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            <span className="sr-only">{t('sendMessage')}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
