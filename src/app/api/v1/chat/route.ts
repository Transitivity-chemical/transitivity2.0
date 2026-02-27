import { NextRequest } from 'next/server';
import OpenAI from 'openai';

export type TAiProvider = 'DeepSeek' | 'Meta' | 'Mistral' | 'Qwen' | 'Google' | 'Nvidia' | 'OpenAI' | 'Anthropic' | 'StepFun' | 'AllenAI' | 'Arcee' | 'LiquidAI' | 'TNG' | 'Upstage' | 'Venice' | 'Zhipu';

export interface ModelConfig {
  id: string;
  name: string;
  provider: TAiProvider;
  isFree: boolean;
  inputCostPer1M: number;
  outputCostPer1M: number;
}

// Full model list synced from QuestionPunk — all OpenRouter models
export const MODELS: ModelConfig[] = [
  // ── Anthropic ──
  { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku', provider: 'Anthropic', isFree: false, inputCostPer1M: 0.25, outputCostPer1M: 1.25 },
  { id: 'anthropic/claude-3.5-haiku', name: 'Claude 3.5 Haiku', provider: 'Anthropic', isFree: false, inputCostPer1M: 0.8, outputCostPer1M: 4 },
  { id: 'anthropic/claude-haiku-4.5', name: 'Claude Haiku 4.5', provider: 'Anthropic', isFree: false, inputCostPer1M: 1, outputCostPer1M: 5 },
  { id: 'anthropic/claude-sonnet-4.6', name: 'Claude Sonnet 4.6', provider: 'Anthropic', isFree: false, inputCostPer1M: 3, outputCostPer1M: 15 },
  { id: 'anthropic/claude-sonnet-4.5', name: 'Claude Sonnet 4.5', provider: 'Anthropic', isFree: false, inputCostPer1M: 3, outputCostPer1M: 15 },
  { id: 'anthropic/claude-3.7-sonnet:thinking', name: 'Claude 3.7 Sonnet (thinking)', provider: 'Anthropic', isFree: false, inputCostPer1M: 3, outputCostPer1M: 15 },
  { id: 'anthropic/claude-3.7-sonnet', name: 'Claude 3.7 Sonnet', provider: 'Anthropic', isFree: false, inputCostPer1M: 3, outputCostPer1M: 15 },
  { id: 'anthropic/claude-sonnet-4', name: 'Claude Sonnet 4', provider: 'Anthropic', isFree: false, inputCostPer1M: 3, outputCostPer1M: 15 },
  { id: 'anthropic/claude-opus-4.5', name: 'Claude Opus 4.5', provider: 'Anthropic', isFree: false, inputCostPer1M: 5, outputCostPer1M: 25 },
  { id: 'anthropic/claude-opus-4.6', name: 'Claude Opus 4.6', provider: 'Anthropic', isFree: false, inputCostPer1M: 15, outputCostPer1M: 75 },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', isFree: false, inputCostPer1M: 6, outputCostPer1M: 30 },
  { id: 'anthropic/claude-opus-4', name: 'Claude Opus 4', provider: 'Anthropic', isFree: false, inputCostPer1M: 15, outputCostPer1M: 75 },
  { id: 'anthropic/claude-opus-4.1', name: 'Claude Opus 4.1', provider: 'Anthropic', isFree: false, inputCostPer1M: 15, outputCostPer1M: 75 },
  // ── OpenAI ──
  { id: 'openai/gpt-oss-120b', name: 'gpt-oss-120b', provider: 'OpenAI', isFree: true, inputCostPer1M: 0, outputCostPer1M: 0 },
  { id: 'openai/gpt-oss-20b', name: 'gpt-oss-20b', provider: 'OpenAI', isFree: true, inputCostPer1M: 0, outputCostPer1M: 0 },
  { id: 'openai/gpt-5-nano', name: 'GPT-5 Nano', provider: 'OpenAI', isFree: false, inputCostPer1M: 0.05, outputCostPer1M: 0.4 },
  { id: 'openai/gpt-4.1-nano', name: 'GPT-4.1 Nano', provider: 'OpenAI', isFree: false, inputCostPer1M: 0.1, outputCostPer1M: 0.4 },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o-mini', provider: 'OpenAI', isFree: false, inputCostPer1M: 0.15, outputCostPer1M: 0.6 },
  { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'OpenAI', isFree: false, inputCostPer1M: 2.5, outputCostPer1M: 10 },
  { id: 'openai/gpt-5-mini', name: 'GPT-5 Mini', provider: 'OpenAI', isFree: false, inputCostPer1M: 0.25, outputCostPer1M: 2 },
  { id: 'openai/gpt-5.1-codex-mini', name: 'GPT-5.1-Codex-Mini', provider: 'OpenAI', isFree: false, inputCostPer1M: 0.25, outputCostPer1M: 2 },
  { id: 'openai/gpt-4.1-mini', name: 'GPT-4.1 Mini', provider: 'OpenAI', isFree: false, inputCostPer1M: 0.4, outputCostPer1M: 1.6 },
  { id: 'openai/gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI', isFree: false, inputCostPer1M: 0.5, outputCostPer1M: 1.5 },
  { id: 'openai/gpt-3.5-turbo-0613', name: 'GPT-3.5 Turbo (older v0613)', provider: 'OpenAI', isFree: false, inputCostPer1M: 1, outputCostPer1M: 2 },
  { id: 'openai/o4-mini', name: 'o4 Mini', provider: 'OpenAI', isFree: false, inputCostPer1M: 1.1, outputCostPer1M: 4.4 },
  { id: 'openai/gpt-5-chat', name: 'GPT-5 Chat', provider: 'OpenAI', isFree: false, inputCostPer1M: 1.25, outputCostPer1M: 10 },
  { id: 'openai/gpt-5', name: 'GPT-5', provider: 'OpenAI', isFree: false, inputCostPer1M: 1.25, outputCostPer1M: 10 },
  { id: 'openai/gpt-5-codex', name: 'GPT-5 Codex', provider: 'OpenAI', isFree: false, inputCostPer1M: 1.25, outputCostPer1M: 10 },
  { id: 'openai/gpt-5.1-codex', name: 'GPT-5.1-Codex', provider: 'OpenAI', isFree: false, inputCostPer1M: 1.25, outputCostPer1M: 10 },
  { id: 'openai/gpt-5.1-chat', name: 'GPT-5.1 Chat', provider: 'OpenAI', isFree: false, inputCostPer1M: 1.25, outputCostPer1M: 10 },
  { id: 'openai/gpt-5.1-codex-max', name: 'GPT-5.1-Codex-Max', provider: 'OpenAI', isFree: false, inputCostPer1M: 1.25, outputCostPer1M: 10 },
  { id: 'openai/gpt-5.1', name: 'GPT-5.1', provider: 'OpenAI', isFree: false, inputCostPer1M: 1.25, outputCostPer1M: 10 },
  { id: 'openai/gpt-3.5-turbo-instruct', name: 'GPT-3.5 Turbo Instruct', provider: 'OpenAI', isFree: false, inputCostPer1M: 1.5, outputCostPer1M: 2 },
  { id: 'openai/gpt-5.2', name: 'GPT-5.2', provider: 'OpenAI', isFree: false, inputCostPer1M: 1.75, outputCostPer1M: 14 },
  { id: 'openai/gpt-5.2-chat', name: 'GPT-5.2 Chat', provider: 'OpenAI', isFree: false, inputCostPer1M: 1.75, outputCostPer1M: 14 },
  { id: 'openai/gpt-5.2-codex', name: 'GPT-5.2-Codex', provider: 'OpenAI', isFree: false, inputCostPer1M: 1.75, outputCostPer1M: 14 },
  { id: 'openai/gpt-4.1', name: 'GPT-4.1', provider: 'OpenAI', isFree: false, inputCostPer1M: 2, outputCostPer1M: 8 },
  { id: 'openai/gpt-5-pro', name: 'GPT-5 Pro', provider: 'OpenAI', isFree: false, inputCostPer1M: 15, outputCostPer1M: 120 },
  { id: 'openai/gpt-5.2-pro', name: 'GPT-5.2 Pro', provider: 'OpenAI', isFree: false, inputCostPer1M: 21, outputCostPer1M: 168 },
  { id: 'openai/gpt-4', name: 'GPT-4', provider: 'OpenAI', isFree: false, inputCostPer1M: 30, outputCostPer1M: 60 },
  // ── Google ──
  { id: 'google/gemma-3-12b-it', name: 'Gemma 3 12B', provider: 'Google', isFree: true, inputCostPer1M: 0, outputCostPer1M: 0 },
  { id: 'google/gemma-3n-e2b-it', name: 'Gemma 3n 2B', provider: 'Google', isFree: true, inputCostPer1M: 0, outputCostPer1M: 0 },
  { id: 'google/gemma-3-4b-it', name: 'Gemma 3 4B', provider: 'Google', isFree: false, inputCostPer1M: 0.02, outputCostPer1M: 0.07 },
  { id: 'google/gemma-3n-e4b-it', name: 'Gemma 3n 4B', provider: 'Google', isFree: false, inputCostPer1M: 0.02, outputCostPer1M: 0.04 },
  { id: 'google/gemma-2-9b-it', name: 'Gemma 2 9B', provider: 'Google', isFree: false, inputCostPer1M: 0.03, outputCostPer1M: 0.09 },
  { id: 'google/gemma-3-27b-it', name: 'Gemma 3 27B', provider: 'Google', isFree: false, inputCostPer1M: 0.04, outputCostPer1M: 0.15 },
  { id: 'google/gemini-2.0-flash-lite-001', name: 'Gemini 2.0 Flash Lite', provider: 'Google', isFree: false, inputCostPer1M: 0.07, outputCostPer1M: 0.3 },
  { id: 'google/gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', provider: 'Google', isFree: false, inputCostPer1M: 0.1, outputCostPer1M: 0.4 },
  { id: 'google/gemini-2.5-flash-lite-preview-09-2025', name: 'Gemini 2.5 Flash Lite Preview 09-2025', provider: 'Google', isFree: false, inputCostPer1M: 0.1, outputCostPer1M: 0.4 },
  { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash', provider: 'Google', isFree: false, inputCostPer1M: 0.1, outputCostPer1M: 0.4 },
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google', isFree: false, inputCostPer1M: 0.3, outputCostPer1M: 2.5 },
  { id: 'google/gemini-2.5-flash-preview-09-2025', name: 'Gemini 2.5 Flash Preview 09-2025', provider: 'Google', isFree: false, inputCostPer1M: 0.3, outputCostPer1M: 2.5 },
  { id: 'google/gemini-3-flash-preview', name: 'Gemini 3 Flash Preview', provider: 'Google', isFree: false, inputCostPer1M: 0.5, outputCostPer1M: 3 },
  { id: 'google/gemma-2-27b-it', name: 'Gemma 2 27B', provider: 'Google', isFree: false, inputCostPer1M: 0.65, outputCostPer1M: 0.65 },
  { id: 'google/gemini-2.5-pro-preview', name: 'Gemini 2.5 Pro Preview 06-05', provider: 'Google', isFree: false, inputCostPer1M: 1.25, outputCostPer1M: 10 },
  { id: 'google/gemini-2.5-pro-preview-05-06', name: 'Gemini 2.5 Pro Preview 05-06', provider: 'Google', isFree: false, inputCostPer1M: 1.25, outputCostPer1M: 10 },
  { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'Google', isFree: false, inputCostPer1M: 1.25, outputCostPer1M: 10 },
  { id: 'google/gemini-3-pro-preview', name: 'Gemini 3 Pro Preview', provider: 'Google', isFree: false, inputCostPer1M: 2, outputCostPer1M: 12 },
  // ── DeepSeek ──
  { id: 'deepseek/deepseek-r1-0528', name: 'R1 0528', provider: 'DeepSeek', isFree: true, inputCostPer1M: 0, outputCostPer1M: 0 },
  { id: 'deepseek/deepseek-v3.1-terminus', name: 'DeepSeek V3.1 Terminus', provider: 'DeepSeek', isFree: false, inputCostPer1M: 0.21, outputCostPer1M: 0.79 },
  { id: 'deepseek/deepseek-v3.2', name: 'DeepSeek V3.2', provider: 'DeepSeek', isFree: false, inputCostPer1M: 0.25, outputCostPer1M: 0.38 },
  { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3', provider: 'DeepSeek', isFree: false, inputCostPer1M: 0.3, outputCostPer1M: 1.2 },
  { id: 'deepseek/deepseek-r1', name: 'R1', provider: 'DeepSeek', isFree: false, inputCostPer1M: 0.7, outputCostPer1M: 2.5 },
  // ── Meta ──
  { id: 'meta-llama/llama-3.1-405b-instruct', name: 'Llama 3.1 405B Instruct', provider: 'Meta', isFree: true, inputCostPer1M: 0, outputCostPer1M: 0 },
  { id: 'meta-llama/llama-3.2-3b-instruct', name: 'Llama 3.2 3B Instruct', provider: 'Meta', isFree: true, inputCostPer1M: 0, outputCostPer1M: 0 },
  { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B Instruct', provider: 'Meta', isFree: true, inputCostPer1M: 0, outputCostPer1M: 0 },
  { id: 'nousresearch/hermes-3-llama-3.1-405b', name: 'Hermes 3 405B Instruct', provider: 'Meta', isFree: true, inputCostPer1M: 0, outputCostPer1M: 0 },
  // ── Mistral ──
  { id: 'mistralai/mistral-small-3.1-24b-instruct', name: 'Mistral Small 3.1 24B', provider: 'Mistral', isFree: true, inputCostPer1M: 0, outputCostPer1M: 0 },
  { id: 'mistralai/mistral-nemo', name: 'Mistral Nemo', provider: 'Mistral', isFree: false, inputCostPer1M: 0.02, outputCostPer1M: 0.04 },
  { id: 'mistralai/ministral-3b', name: 'Ministral 3B', provider: 'Mistral', isFree: false, inputCostPer1M: 0.04, outputCostPer1M: 0.04 },
  { id: 'mistralai/pixtral-12b', name: 'Pixtral 12B', provider: 'Mistral', isFree: false, inputCostPer1M: 0.1, outputCostPer1M: 0.1 },
  { id: 'mistralai/ministral-8b', name: 'Ministral 8B', provider: 'Mistral', isFree: false, inputCostPer1M: 0.1, outputCostPer1M: 0.1 },
  { id: 'mistralai/devstral-small', name: 'Devstral Small 1.1', provider: 'Mistral', isFree: false, inputCostPer1M: 0.1, outputCostPer1M: 0.3 },
  { id: 'mistralai/mistral-small-creative', name: 'Mistral Small Creative', provider: 'Mistral', isFree: false, inputCostPer1M: 0.1, outputCostPer1M: 0.3 },
  { id: 'mistralai/mistral-saba', name: 'Saba', provider: 'Mistral', isFree: false, inputCostPer1M: 0.2, outputCostPer1M: 0.6 },
  { id: 'mistralai/mistral-tiny', name: 'Mistral Tiny', provider: 'Mistral', isFree: false, inputCostPer1M: 0.25, outputCostPer1M: 0.25 },
  { id: 'mistralai/devstral-medium', name: 'Devstral Medium', provider: 'Mistral', isFree: false, inputCostPer1M: 0.4, outputCostPer1M: 2 },
  { id: 'mistralai/mistral-medium-3', name: 'Mistral Medium 3', provider: 'Mistral', isFree: false, inputCostPer1M: 0.4, outputCostPer1M: 2 },
  { id: 'mistralai/mistral-medium-3.1', name: 'Mistral Medium 3.1', provider: 'Mistral', isFree: false, inputCostPer1M: 0.4, outputCostPer1M: 2 },
  { id: 'mistralai/mistral-large', name: 'Mistral Large', provider: 'Mistral', isFree: false, inputCostPer1M: 2, outputCostPer1M: 6 },
  // ── Qwen ──
  { id: 'qwen/qwen-2.5-vl-7b-instruct', name: 'Qwen2.5-VL 7B Instruct', provider: 'Qwen', isFree: true, inputCostPer1M: 0, outputCostPer1M: 0 },
  { id: 'qwen/qwen3-4b', name: 'Qwen3 4B', provider: 'Qwen', isFree: true, inputCostPer1M: 0, outputCostPer1M: 0 },
  { id: 'qwen/qwen3-coder', name: 'Qwen3 Coder 480B A35B', provider: 'Qwen', isFree: true, inputCostPer1M: 0, outputCostPer1M: 0 },
  { id: 'qwen/qwen3-next-80b-a3b-instruct', name: 'Qwen3 Next 80B A3B Instruct', provider: 'Qwen', isFree: true, inputCostPer1M: 0, outputCostPer1M: 0 },
  // ── Nvidia ──
  { id: 'nvidia/nemotron-3-nano-30b-a3b', name: 'NVIDIA: Nemotron 3 Nano 30B A3B', provider: 'Nvidia', isFree: true, inputCostPer1M: 0, outputCostPer1M: 0 },
  { id: 'nvidia/nemotron-nano-12b-v2-vl', name: 'NVIDIA: Nemotron Nano 12B 2 VL', provider: 'Nvidia', isFree: true, inputCostPer1M: 0, outputCostPer1M: 0 },
  { id: 'nvidia/nemotron-nano-9b-v2', name: 'NVIDIA: Nemotron Nano 9B V2', provider: 'Nvidia', isFree: true, inputCostPer1M: 0, outputCostPer1M: 0 },
  // ── StepFun ──
  { id: 'stepfun/step-3.5-flash', name: 'StepFun 3.5 Flash', provider: 'StepFun', isFree: true, inputCostPer1M: 0, outputCostPer1M: 0 },
  // ── AllenAI ──
  { id: 'allenai/molmo-2-8b', name: 'Molmo2 8B', provider: 'AllenAI', isFree: true, inputCostPer1M: 0, outputCostPer1M: 0 },
  // ── Arcee ──
  { id: 'arcee-ai/trinity-large-preview', name: 'Trinity Large Preview', provider: 'Arcee', isFree: true, inputCostPer1M: 0, outputCostPer1M: 0 },
  { id: 'arcee-ai/trinity-mini', name: 'Trinity Mini', provider: 'Arcee', isFree: true, inputCostPer1M: 0, outputCostPer1M: 0 },
  // ── LiquidAI ──
  { id: 'liquid/lfm-2.5-1.2b-instruct', name: 'LiquidAI LFM2.5-1.2B-Instruct', provider: 'LiquidAI', isFree: true, inputCostPer1M: 0, outputCostPer1M: 0 },
  { id: 'liquid/lfm-2.5-1.2b-thinking', name: 'LiquidAI LFM2.5-1.2B-Thinking', provider: 'LiquidAI', isFree: true, inputCostPer1M: 0, outputCostPer1M: 0 },
  // ── TNG ──
  { id: 'tngtech/deepseek-r1t-chimera', name: 'TNG DeepSeek R1T Chimera', provider: 'TNG', isFree: true, inputCostPer1M: 0, outputCostPer1M: 0 },
  { id: 'tngtech/deepseek-r1t2-chimera', name: 'TNG DeepSeek R1T2 Chimera', provider: 'TNG', isFree: true, inputCostPer1M: 0, outputCostPer1M: 0 },
  { id: 'tngtech/tng-r1t-chimera', name: 'TNG R1T Chimera', provider: 'TNG', isFree: true, inputCostPer1M: 0, outputCostPer1M: 0 },
  // ── Upstage ──
  { id: 'upstage/solar-pro-3', name: 'Upstage: Solar Pro 3', provider: 'Upstage', isFree: true, inputCostPer1M: 0, outputCostPer1M: 0 },
  // ── Venice ──
  { id: 'cognitivecomputations/dolphin-mistral-24b-venice-edition', name: 'Venice Uncensored', provider: 'Venice', isFree: true, inputCostPer1M: 0, outputCostPer1M: 0 },
  // ── Zhipu ──
  { id: 'z-ai/glm-4.5-air', name: 'Z.AI GLM 4.5 Air', provider: 'Zhipu', isFree: true, inputCostPer1M: 0, outputCostPer1M: 0 },
];

export const dynamic = 'force-dynamic';

function getClient() {
  return new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
  });
}

const SYSTEM_PROMPT = `You are a computational chemistry assistant for Transitivity 2.0. You help researchers with:
- Transition State Theory (TST) and rate constant calculations
- Tunneling corrections (Bell, Skodje-Truhlar, Eckart)
- Kinetic model fitting (Arrhenius, Aquilanti-Mundim, NTS, VFT, ASCC, SATO)
- Molecular dynamics (CPMD, BOMD, PIMD)
- Machine learning potentials (ANI-2x, MACE, AIQM1)
- General computational chemistry questions
Be concise but accurate. Use LaTeX notation for equations when needed.`;

export async function POST(request: NextRequest) {
  if (!process.env.OPENROUTER_API_KEY) {
    return Response.json({ error: 'Chat not configured. Set OPENROUTER_API_KEY.' }, { status: 503 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { messages, model: modelId } = body;

  if (!modelId || !messages) {
    return Response.json({ error: 'Missing model or messages' }, { status: 400 });
  }

  const modelConfig = MODELS.find(m => m.id === modelId);
  if (!modelConfig) {
    return Response.json({ error: `Invalid model: ${modelId}` }, { status: 400 });
  }

  const client = getClient();

  try {
    const stream = await client.chat.completions.create({
      model: modelConfig.id,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages,
      ],
      stream: true,
      max_tokens: 2048,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: errMsg })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return Response.json({ error: errMsg }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({
    models: MODELS.map(m => ({
      id: m.id,
      name: m.name,
      provider: m.provider,
      isFree: m.isFree,
    })),
  });
}
