'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { X, Send, ChevronDown, Crown } from 'lucide-react';
import { GammaIcon } from '@/components/brand/TransitivityLogo';
import { useTranslations } from 'next-intl';
import { PROVIDER_ICONS } from '@/components/icons/ai-providers';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

type TAiProvider = 'DeepSeek' | 'Meta' | 'Mistral' | 'Qwen' | 'Google' | 'Nvidia' | 'OpenAI' | 'Anthropic' | 'StepFun' | 'AllenAI' | 'Arcee' | 'LiquidAI' | 'TNG' | 'Upstage' | 'Venice' | 'Zhipu';

interface ModelConfig {
  id: string;
  name: string;
  provider: TAiProvider;
  isFree: boolean;
}

// Curated subset for the floating chat (6 free + 4 pro)
const MODELS: ModelConfig[] = [
  // Free
  { id: 'deepseek/deepseek-r1-0528', name: 'DeepSeek R1', provider: 'DeepSeek', isFree: true },
  { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B', provider: 'Meta', isFree: true },
  { id: 'mistralai/mistral-small-3.1-24b-instruct', name: 'Mistral Small 3.1', provider: 'Mistral', isFree: true },
  { id: 'qwen/qwen3-4b', name: 'Qwen3 4B', provider: 'Qwen', isFree: true },
  { id: 'nvidia/nemotron-nano-9b-v2', name: 'Nemotron Nano 9B', provider: 'Nvidia', isFree: true },
  { id: 'google/gemma-3-12b-it', name: 'Gemma 3 12B', provider: 'Google', isFree: true },
  // Pro
  { id: 'anthropic/claude-sonnet-4', name: 'Claude Sonnet 4', provider: 'Anthropic', isFree: false },
  { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'OpenAI', isFree: false },
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google', isFree: false },
  { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3', provider: 'DeepSeek', isFree: false },
];

function ProviderIcon({ provider, className }: { provider: TAiProvider; className?: string }) {
  const Icon = PROVIDER_ICONS[provider];
  if (!Icon) return null;
  return <Icon className={className} />;
}

export function FloatingChat() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [modelId, setModelId] = useState(MODELS[0].id);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showModels, setShowModels] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const t = useTranslations('assistant');

  const isOnAssistantPage = pathname.includes('/assistant');

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);
  useEffect(() => { if (isOpen && inputRef.current) inputRef.current.focus(); }, [isOpen]);

  // Hide on /assistant page since that page has its own full chat UI
  if (isOnAssistantPage) return null;

  const currentModel = MODELS.find(m => m.id === modelId) || MODELS[0];
  const freeModels = MODELS.filter(m => m.isFree);
  const proModels = MODELS.filter(m => !m.isFree);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    const userMsg: Message = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsStreaming(true);
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    try {
      const res = await fetch('/api/v1/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
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
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: `Error: ${errorMsg}` };
          return updated;
        });
        setIsStreaming(false);
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) { setIsStreaming(false); return; }

      let accumulated = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value);
        const lines = text.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                accumulated += parsed.content;
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { role: 'assistant', content: accumulated };
                  return updated;
                });
              }
              if (parsed.error) {
                accumulated += `\nError: ${parsed.error}`;
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { role: 'assistant', content: accumulated };
                  return updated;
                });
              }
            } catch { /* skip parse errors in stream */ }
          }
        }
      }
    } catch (err) {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'assistant', content: `Error: ${String(err)}` };
        return updated;
      });
    }
    setIsStreaming(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <>
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900" style={{ width: 400, height: 520 }}>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 bg-[#1e3a5f] px-4 py-3 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <GammaIcon size={20} color="#fff" />
              <span className="text-sm font-semibold text-white">{t('title')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <button onClick={() => setShowModels(!showModels)} className="flex items-center gap-1.5 rounded-md bg-white/20 px-2 py-1 text-xs text-white hover:bg-white/30">
                  <ProviderIcon provider={currentModel.provider} className="h-3.5 w-3.5" />
                  {currentModel.name}
                  <ChevronDown size={12} />
                </button>
                {showModels && (
                  <div className="absolute right-0 top-8 z-50 w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                    <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Free</div>
                    {freeModels.map(m => (
                      <button key={m.id} onClick={() => { setModelId(m.id); setShowModels(false); }}
                        className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-gray-100 dark:hover:bg-gray-700 ${modelId === m.id ? 'bg-gray-50 font-medium text-[#1e3a5f] dark:bg-gray-700' : 'text-gray-700 dark:text-gray-300'}`}>
                        <ProviderIcon provider={m.provider} className="h-3.5 w-3.5 shrink-0" />
                        {m.name}
                      </button>
                    ))}
                    <div className="mt-1 border-t px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:border-gray-600">
                      Pro <Crown size={10} className="mb-0.5 inline text-amber-500" />
                    </div>
                    {proModels.map(m => (
                      <button key={m.id} onClick={() => { setModelId(m.id); setShowModels(false); }}
                        className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-gray-100 dark:hover:bg-gray-700 ${modelId === m.id ? 'bg-gray-50 font-medium text-[#1e3a5f] dark:bg-gray-700' : 'text-gray-700 dark:text-gray-300'}`}>
                        <ProviderIcon provider={m.provider} className="h-3.5 w-3.5 shrink-0" />
                        {m.name}
                        <Crown size={10} className="ml-auto text-amber-500" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={() => setIsOpen(false)} className="rounded-md p-1 text-white hover:bg-white/20">
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ scrollBehavior: 'smooth' }}>
            {messages.length === 0 && (
              <div className="flex h-full items-center justify-center text-center">
                <div>
                  <GammaIcon size={48} color="#d1d5db" className="mx-auto" />
                  <p className="mt-3 text-sm text-gray-400">{t('placeholder')}</p>
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${msg.role === 'user' ? 'bg-[#1e3a5f] text-white' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'}`}>
                  <div className="whitespace-pre-wrap">{msg.content || (isStreaming && i === messages.length - 1 ? '...' : '')}</div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 p-3 dark:border-gray-700">
            <div className="flex items-end gap-2">
              <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
                placeholder={t('placeholder')} rows={1}
                className="max-h-24 flex-1 resize-none rounded-xl border border-gray-300 bg-transparent px-3 py-2 text-sm outline-none transition-colors focus:border-[#1e3a5f] dark:border-gray-600 dark:text-white"
                style={{ minHeight: 38 }} />
              <button onClick={sendMessage} disabled={!input.trim() || isStreaming}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#1e3a5f] text-white transition-opacity hover:opacity-90 disabled:opacity-40">
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#1e3a5f] text-white shadow-lg transition-all hover:scale-110 hover:shadow-xl active:scale-95"
        style={{ animation: isOpen ? 'none' : 'pulse-soft 3s ease-in-out infinite' }}>
        {isOpen ? <X size={24} /> : <GammaIcon size={28} color="#fff" />}
      </button>

      <style>{`
        @keyframes pulse-soft {
          0%, 100% { box-shadow: 0 4px 20px rgba(30, 58, 95, 0.3); }
          50% { box-shadow: 0 4px 30px rgba(30, 58, 95, 0.6); }
        }
      `}</style>
    </>
  );
}
