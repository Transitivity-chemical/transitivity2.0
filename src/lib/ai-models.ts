export type TAIModel = {
  type: 'direct';
  model: string;
};

export const aiProviders = [
  'Anthropic',
  'OpenAI',
  'Google',
  'DeepSeek',
  'Meta',
  'Mistral',
  'Qwen',
  'Nvidia',
  'StepFun',
  'AllenAI',
  'Arcee',
  'LiquidAI',
  'TNG',
  'Upstage',
  'Venice',
  'Zhipu',
] as const;
export type TAiProvider = (typeof aiProviders)[number];

export type TAIModelConfig = {
  id: string;
  name: string;
  provider: TAiProvider;
  directModelId?: string;
  thinking?: boolean;
  inputCostPer1M?: number;
  outputCostPer1M?: number;
  isFree?: boolean;
  latencySeconds?: number;
};

export const DEFAULT_MODEL_ID = 'anthropic/claude-haiku-4.5';

export const DEFAULT_AI_MODEL: TAIModel = {
  type: 'direct',
  model: DEFAULT_MODEL_ID,
};

// // // // // // // // //
// Anthropic models
// // // // // // // // //

const ANTHROPIC_MODELS: TAIModelConfig[] = [
  {
    id: 'anthropic/claude-3-haiku',
    name: 'Claude 3 Haiku',
    provider: 'Anthropic',
    directModelId: 'claude-3-haiku-20240307',
    inputCostPer1M: 0.25,
    outputCostPer1M: 1.25,
    latencySeconds: 0.4,
  },
  {
    id: 'anthropic/claude-3.5-haiku',
    name: 'Claude 3.5 Haiku',
    provider: 'Anthropic',
    directModelId: 'claude-3-5-haiku-20241022',
    inputCostPer1M: 0.8,
    outputCostPer1M: 4,
    latencySeconds: 0.36,
  },
  {
    id: 'anthropic/claude-haiku-4.5',
    name: 'Claude Haiku 4.5',
    provider: 'Anthropic',
    directModelId: 'claude-haiku-4-5-20251001',
    inputCostPer1M: 1,
    outputCostPer1M: 5,
    latencySeconds: 0.59,
  },
  {
    id: 'anthropic/claude-sonnet-4.6',
    name: 'Claude Sonnet 4.6',
    provider: 'Anthropic',
    directModelId: 'claude-sonnet-4-6',
    inputCostPer1M: 3,
    outputCostPer1M: 15,
    latencySeconds: 2,
  },
  {
    id: 'anthropic/claude-sonnet-4.5',
    name: 'Claude Sonnet 4.5',
    provider: 'Anthropic',
    directModelId: 'claude-sonnet-4-5-20250929',
    inputCostPer1M: 3,
    outputCostPer1M: 15,
    latencySeconds: 2.68,
  },
  {
    id: 'anthropic/claude-3.7-sonnet:thinking',
    name: 'Claude 3.7 Sonnet (thinking)',
    provider: 'Anthropic',
    directModelId: 'claude-3-7-sonnet-20250219',
    thinking: true,
    inputCostPer1M: 3,
    outputCostPer1M: 15,
    latencySeconds: 2.5,
  },
  {
    id: 'anthropic/claude-3.7-sonnet',
    name: 'Claude 3.7 Sonnet',
    provider: 'Anthropic',
    directModelId: 'claude-3-7-sonnet-20250219',
    inputCostPer1M: 3,
    outputCostPer1M: 15,
    latencySeconds: 1.5,
  },
  {
    id: 'anthropic/claude-sonnet-4',
    name: 'Claude Sonnet 4',
    provider: 'Anthropic',
    directModelId: 'claude-sonnet-4-20250514',
    inputCostPer1M: 3,
    outputCostPer1M: 15,
    latencySeconds: 1.7,
  },
  {
    id: 'anthropic/claude-opus-4.5',
    name: 'Claude Opus 4.5',
    provider: 'Anthropic',
    directModelId: 'claude-opus-4-5-20250219',
    inputCostPer1M: 5,
    outputCostPer1M: 25,
    latencySeconds: 1.76,
  },
  {
    id: 'anthropic/claude-opus-4.6',
    name: 'Claude Opus 4.6',
    provider: 'Anthropic',
    directModelId: 'claude-opus-4-6-20251107',
    inputCostPer1M: 15,
    outputCostPer1M: 75,
    latencySeconds: 1.6,
  },
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    directModelId: 'claude-3-5-sonnet-20241022',
    inputCostPer1M: 6,
    outputCostPer1M: 30,
    latencySeconds: 0.64,
  },
  {
    id: 'anthropic/claude-opus-4',
    name: 'Claude Opus 4',
    provider: 'Anthropic',
    directModelId: 'claude-opus-4-20250514',
    inputCostPer1M: 15,
    outputCostPer1M: 75,
    latencySeconds: 1.6,
  },
  {
    id: 'anthropic/claude-opus-4.1',
    name: 'Claude Opus 4.1',
    provider: 'Anthropic',
    directModelId: 'claude-opus-4-1-20250904',
    inputCostPer1M: 15,
    outputCostPer1M: 75,
    latencySeconds: 1.53,
  },
];

// // // // // // // // //
// OpenAI models
// // // // // // // // //

const OPENAI_MODELS: TAIModelConfig[] = [
  {
    id: 'openai/gpt-oss-120b',
    name: 'gpt-oss-120b',
    provider: 'OpenAI',
    inputCostPer1M: 0,
    outputCostPer1M: 0,
    isFree: true,
    latencySeconds: 0.34,
  },
  {
    id: 'openai/gpt-oss-20b',
    name: 'gpt-oss-20b',
    provider: 'OpenAI',
    inputCostPer1M: 0,
    outputCostPer1M: 0,
    isFree: true,
    latencySeconds: 0.12,
  },
  // Paid OpenAI models
  {
    id: 'openai/gpt-5-nano',
    name: 'GPT-5 Nano',
    provider: 'OpenAI',
    inputCostPer1M: 0.05,
    outputCostPer1M: 0.4,
    latencySeconds: 2.74,
  },
  {
    id: 'openai/gpt-4.1-nano',
    name: 'GPT-4.1 Nano',
    provider: 'OpenAI',
    inputCostPer1M: 0.1,
    outputCostPer1M: 0.4,
    latencySeconds: 0.42,
  },
  {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o-mini',
    provider: 'OpenAI',
    inputCostPer1M: 0.15,
    outputCostPer1M: 0.6,
    latencySeconds: 0.76,
  },
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    inputCostPer1M: 2.5,
    outputCostPer1M: 10,
    latencySeconds: 0.4,
  },
  {
    id: 'openai/gpt-5-mini',
    name: 'GPT-5 Mini',
    provider: 'OpenAI',
    inputCostPer1M: 0.25,
    outputCostPer1M: 2,
    latencySeconds: 8.72,
  },
  {
    id: 'openai/gpt-5.1-codex-mini',
    name: 'GPT-5.1-Codex-Mini',
    provider: 'OpenAI',
    inputCostPer1M: 0.25,
    outputCostPer1M: 2,
    latencySeconds: 3,
  },
  {
    id: 'openai/gpt-4.1-mini',
    name: 'GPT-4.1 Mini',
    provider: 'OpenAI',
    inputCostPer1M: 0.4,
    outputCostPer1M: 1.6,
    latencySeconds: 0.56,
  },
  {
    id: 'openai/gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'OpenAI',
    inputCostPer1M: 0.5,
    outputCostPer1M: 1.5,
    latencySeconds: 0.3,
  },
  {
    id: 'openai/gpt-3.5-turbo-0613',
    name: 'GPT-3.5 Turbo (older v0613)',
    provider: 'OpenAI',
    inputCostPer1M: 1,
    outputCostPer1M: 2,
    latencySeconds: 0.3,
  },
  {
    id: 'openai/o4-mini',
    name: 'o4 Mini',
    provider: 'OpenAI',
    inputCostPer1M: 1.1,
    outputCostPer1M: 4.4,
    latencySeconds: 1.5,
  },
  {
    id: 'openai/gpt-5-chat',
    name: 'GPT-5 Chat',
    provider: 'OpenAI',
    inputCostPer1M: 1.25,
    outputCostPer1M: 10,
    latencySeconds: 1,
  },
  {
    id: 'openai/gpt-5',
    name: 'GPT-5',
    provider: 'OpenAI',
    inputCostPer1M: 1.25,
    outputCostPer1M: 10,
    latencySeconds: 2,
  },
  {
    id: 'openai/gpt-5-codex',
    name: 'GPT-5 Codex',
    provider: 'OpenAI',
    inputCostPer1M: 1.25,
    outputCostPer1M: 10,
    latencySeconds: 2.5,
  },
  {
    id: 'openai/gpt-5.1-codex',
    name: 'GPT-5.1-Codex',
    provider: 'OpenAI',
    inputCostPer1M: 1.25,
    outputCostPer1M: 10,
    latencySeconds: 2,
  },
  {
    id: 'openai/gpt-5.1-chat',
    name: 'GPT-5.1 Chat',
    provider: 'OpenAI',
    inputCostPer1M: 1.25,
    outputCostPer1M: 10,
    latencySeconds: 0.8,
  },
  {
    id: 'openai/gpt-5.1-codex-max',
    name: 'GPT-5.1-Codex-Max',
    provider: 'OpenAI',
    inputCostPer1M: 1.25,
    outputCostPer1M: 10,
    latencySeconds: 3.5,
  },
  {
    id: 'openai/gpt-5.1',
    name: 'GPT-5.1',
    provider: 'OpenAI',
    inputCostPer1M: 1.25,
    outputCostPer1M: 10,
    latencySeconds: 1.8,
  },
  {
    id: 'openai/gpt-3.5-turbo-instruct',
    name: 'GPT-3.5 Turbo Instruct',
    provider: 'OpenAI',
    inputCostPer1M: 1.5,
    outputCostPer1M: 2,
    latencySeconds: 0.35,
  },
  {
    id: 'openai/gpt-5.2',
    name: 'GPT-5.2',
    provider: 'OpenAI',
    inputCostPer1M: 1.75,
    outputCostPer1M: 14,
    latencySeconds: 2.58,
  },
  {
    id: 'openai/gpt-5.2-chat',
    name: 'GPT-5.2 Chat',
    provider: 'OpenAI',
    inputCostPer1M: 1.75,
    outputCostPer1M: 14,
    latencySeconds: 0.9,
  },
  {
    id: 'openai/gpt-5.2-codex',
    name: 'GPT-5.2-Codex',
    provider: 'OpenAI',
    inputCostPer1M: 1.75,
    outputCostPer1M: 14,
    latencySeconds: 2.2,
  },
  {
    id: 'openai/gpt-4.1',
    name: 'GPT-4.1',
    provider: 'OpenAI',
    inputCostPer1M: 2,
    outputCostPer1M: 8,
    latencySeconds: 1.28,
  },
  {
    id: 'openai/gpt-5-pro',
    name: 'GPT-5 Pro',
    provider: 'OpenAI',
    inputCostPer1M: 15,
    outputCostPer1M: 120,
    latencySeconds: 5,
  },
  {
    id: 'openai/gpt-5.2-pro',
    name: 'GPT-5.2 Pro',
    provider: 'OpenAI',
    inputCostPer1M: 21,
    outputCostPer1M: 168,
    latencySeconds: 4.5,
  },
  {
    id: 'openai/gpt-4',
    name: 'GPT-4',
    provider: 'OpenAI',
    inputCostPer1M: 30,
    outputCostPer1M: 60,
    latencySeconds: 0.8,
  },
];

// // // // // // // // //
// Google models
// // // // // // // // //

const GOOGLE_MODELS: TAIModelConfig[] = [
  // Free
  {
    id: 'google/gemma-3-12b-it',
    name: 'Gemma 3 12B',
    provider: 'Google',
    directModelId: 'gemma-3-12b-it',
    inputCostPer1M: 0,
    outputCostPer1M: 0,
    isFree: true,
    latencySeconds: 0.15,
  },
  {
    id: 'google/gemma-3n-e2b-it',
    name: 'Gemma 3n 2B',
    provider: 'Google',
    directModelId: 'gemma-3n-e2b-it',
    inputCostPer1M: 0,
    outputCostPer1M: 0,
    isFree: true,
    latencySeconds: 0.1,
  },
  // Paid
  {
    id: 'google/gemma-3-4b-it',
    name: 'Gemma 3 4B',
    provider: 'Google',
    directModelId: 'gemma-3-4b-it',
    inputCostPer1M: 0.02,
    outputCostPer1M: 0.07,
    latencySeconds: 0.08,
  },
  {
    id: 'google/gemma-3n-e4b-it',
    name: 'Gemma 3n 4B',
    provider: 'Google',
    directModelId: 'gemma-3n-e4b-it',
    inputCostPer1M: 0.02,
    outputCostPer1M: 0.04,
    latencySeconds: 0.1,
  },
  {
    id: 'google/gemma-2-9b-it',
    name: 'Gemma 2 9B',
    provider: 'Google',
    directModelId: 'gemma-2-9b-it',
    inputCostPer1M: 0.03,
    outputCostPer1M: 0.09,
    latencySeconds: 0.12,
  },
  {
    id: 'google/gemma-3-27b-it',
    name: 'Gemma 3 27B',
    provider: 'Google',
    directModelId: 'gemma-3-27b-it',
    inputCostPer1M: 0.04,
    outputCostPer1M: 0.15,
    latencySeconds: 0.21,
  },
  {
    id: 'google/gemini-2.0-flash-lite-001',
    name: 'Gemini 2.0 Flash Lite',
    provider: 'Google',
    directModelId: 'gemini-2.0-flash-lite',
    inputCostPer1M: 0.07,
    outputCostPer1M: 0.3,
    latencySeconds: 0.7,
  },
  {
    id: 'google/gemini-2.5-flash-lite',
    name: 'Gemini 2.5 Flash Lite',
    provider: 'Google',
    directModelId: 'gemini-2.5-flash-lite',
    inputCostPer1M: 0.1,
    outputCostPer1M: 0.4,
    latencySeconds: 0.43,
  },
  {
    id: 'google/gemini-2.5-flash-lite-preview-09-2025',
    name: 'Gemini 2.5 Flash Lite Preview 09-2025',
    provider: 'Google',
    directModelId: 'gemini-2.5-flash-lite-preview-09-25',
    inputCostPer1M: 0.1,
    outputCostPer1M: 0.4,
    latencySeconds: 0.46,
  },
  {
    id: 'google/gemini-2.0-flash-001',
    name: 'Gemini 2.0 Flash',
    provider: 'Google',
    directModelId: 'gemini-2.0-flash',
    inputCostPer1M: 0.1,
    outputCostPer1M: 0.4,
    latencySeconds: 0.39,
  },
  {
    id: 'google/gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'Google',
    directModelId: 'gemini-2.5-flash',
    inputCostPer1M: 0.3,
    outputCostPer1M: 2.5,
    latencySeconds: 2.12,
  },
  {
    id: 'google/gemini-2.5-flash-preview-09-2025',
    name: 'Gemini 2.5 Flash Preview 09-2025',
    provider: 'Google',
    directModelId: 'gemini-2.5-flash-preview-09-25',
    inputCostPer1M: 0.3,
    outputCostPer1M: 2.5,
    latencySeconds: 2.12,
  },
  {
    id: 'google/gemini-3-flash-preview',
    name: 'Gemini 3 Flash Preview',
    provider: 'Google',
    directModelId: 'gemini-3-flash-preview',
    inputCostPer1M: 0.5,
    outputCostPer1M: 3,
    latencySeconds: 0.98,
  },
  {
    id: 'google/gemma-2-27b-it',
    name: 'Gemma 2 27B',
    provider: 'Google',
    directModelId: 'gemma-2-27b-it',
    inputCostPer1M: 0.65,
    outputCostPer1M: 0.65,
    latencySeconds: 0.22,
  },
  {
    id: 'google/gemini-2.5-pro-preview',
    name: 'Gemini 2.5 Pro Preview 06-05',
    provider: 'Google',
    directModelId: 'gemini-2.5-pro-preview',
    inputCostPer1M: 1.25,
    outputCostPer1M: 10,
    latencySeconds: 4.57,
  },
  {
    id: 'google/gemini-2.5-pro-preview-05-06',
    name: 'Gemini 2.5 Pro Preview 05-06',
    provider: 'Google',
    directModelId: 'gemini-2.5-pro-preview-05-06',
    inputCostPer1M: 1.25,
    outputCostPer1M: 10,
    latencySeconds: 4.57,
  },
  {
    id: 'google/gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'Google',
    directModelId: 'gemini-2.5-pro',
    inputCostPer1M: 1.25,
    outputCostPer1M: 10,
    latencySeconds: 4.57,
  },
  {
    id: 'google/gemini-3-pro-preview',
    name: 'Gemini 3 Pro Preview',
    provider: 'Google',
    directModelId: 'gemini-3-pro-preview',
    inputCostPer1M: 2,
    outputCostPer1M: 12,
    latencySeconds: 3.16,
  },
];

// // // // // // // // //
// DeepSeek models
// // // // // // // // //

const DEEPSEEK_MODELS: TAIModelConfig[] = [
  // Free
  {
    id: 'deepseek/deepseek-r1-0528',
    name: 'R1 0528',
    provider: 'DeepSeek',
    inputCostPer1M: 0,
    outputCostPer1M: 0,
    isFree: true,
    latencySeconds: 3.5,
  },
  // Paid
  {
    id: 'deepseek/deepseek-v3.1-terminus',
    name: 'DeepSeek V3.1 Terminus',
    provider: 'DeepSeek',
    inputCostPer1M: 0.21,
    outputCostPer1M: 0.79,
    latencySeconds: 0.55,
  },
  {
    id: 'deepseek/deepseek-v3.2',
    name: 'DeepSeek V3.2',
    provider: 'DeepSeek',
    inputCostPer1M: 0.25,
    outputCostPer1M: 0.38,
    latencySeconds: 3.18,
  },
  {
    id: 'deepseek/deepseek-chat',
    name: 'DeepSeek V3',
    provider: 'DeepSeek',
    inputCostPer1M: 0.3,
    outputCostPer1M: 1.2,
    latencySeconds: 1.13,
  },
  {
    id: 'deepseek/deepseek-r1',
    name: 'R1',
    provider: 'DeepSeek',
    inputCostPer1M: 0.7,
    outputCostPer1M: 2.5,
    latencySeconds: 3,
  },
];

// // // // // // // // //
// Meta models
// // // // // // // // //

const META_MODELS: TAIModelConfig[] = [
  {
    id: 'meta-llama/llama-3.1-405b-instruct',
    name: 'Llama 3.1 405B Instruct',
    provider: 'Meta',
    inputCostPer1M: 0,
    outputCostPer1M: 0,
    isFree: true,
    latencySeconds: 0.5,
  },
  {
    id: 'meta-llama/llama-3.2-3b-instruct',
    name: 'Llama 3.2 3B Instruct',
    provider: 'Meta',
    inputCostPer1M: 0,
    outputCostPer1M: 0,
    isFree: true,
    latencySeconds: 0.15,
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct',
    name: 'Llama 3.3 70B Instruct',
    provider: 'Meta',
    inputCostPer1M: 0,
    outputCostPer1M: 0,
    isFree: true,
    latencySeconds: 0.48,
  },
  {
    id: 'nousresearch/hermes-3-llama-3.1-405b',
    name: 'Hermes 3 405B Instruct',
    provider: 'Meta',
    inputCostPer1M: 0,
    outputCostPer1M: 0,
    isFree: true,
    latencySeconds: 0.5,
  },
];

// // // // // // // // //
// Mistral models
// // // // // // // // //

const MISTRAL_MODELS: TAIModelConfig[] = [
  // Free
  {
    id: 'mistralai/mistral-small-3.1-24b-instruct',
    name: 'Mistral Small 3.1 24B',
    provider: 'Mistral',
    inputCostPer1M: 0,
    outputCostPer1M: 0,
    isFree: true,
    latencySeconds: 0.28,
  },
  // Paid
  {
    id: 'mistralai/mistral-nemo',
    name: 'Mistral Nemo',
    provider: 'Mistral',
    inputCostPer1M: 0.02,
    outputCostPer1M: 0.04,
    latencySeconds: 0.25,
  },
  {
    id: 'mistralai/ministral-3b',
    name: 'Ministral 3B',
    provider: 'Mistral',
    inputCostPer1M: 0.04,
    outputCostPer1M: 0.04,
    latencySeconds: 0.1,
  },
  {
    id: 'mistralai/pixtral-12b',
    name: 'Pixtral 12B',
    provider: 'Mistral',
    inputCostPer1M: 0.1,
    outputCostPer1M: 0.1,
    latencySeconds: 0.2,
  },
  {
    id: 'mistralai/ministral-8b',
    name: 'Ministral 8B',
    provider: 'Mistral',
    inputCostPer1M: 0.1,
    outputCostPer1M: 0.1,
    latencySeconds: 0.15,
  },
  {
    id: 'mistralai/devstral-small',
    name: 'Devstral Small 1.1',
    provider: 'Mistral',
    inputCostPer1M: 0.1,
    outputCostPer1M: 0.3,
    latencySeconds: 0.3,
  },
  {
    id: 'mistralai/mistral-small-creative',
    name: 'Mistral Small Creative',
    provider: 'Mistral',
    inputCostPer1M: 0.1,
    outputCostPer1M: 0.3,
    latencySeconds: 0.28,
  },
  {
    id: 'mistralai/mistral-saba',
    name: 'Saba',
    provider: 'Mistral',
    inputCostPer1M: 0.2,
    outputCostPer1M: 0.6,
    latencySeconds: 0.3,
  },
  {
    id: 'mistralai/mistral-tiny',
    name: 'Mistral Tiny',
    provider: 'Mistral',
    inputCostPer1M: 0.25,
    outputCostPer1M: 0.25,
    latencySeconds: 0.25,
  },
  {
    id: 'mistralai/devstral-medium',
    name: 'Devstral Medium',
    provider: 'Mistral',
    inputCostPer1M: 0.4,
    outputCostPer1M: 2,
    latencySeconds: 0.5,
  },
  {
    id: 'mistralai/mistral-medium-3',
    name: 'Mistral Medium 3',
    provider: 'Mistral',
    inputCostPer1M: 0.4,
    outputCostPer1M: 2,
    latencySeconds: 0.45,
  },
  {
    id: 'mistralai/mistral-medium-3.1',
    name: 'Mistral Medium 3.1',
    provider: 'Mistral',
    inputCostPer1M: 0.4,
    outputCostPer1M: 2,
    latencySeconds: 0.45,
  },
  {
    id: 'mistralai/mistral-large',
    name: 'Mistral Large',
    provider: 'Mistral',
    inputCostPer1M: 2,
    outputCostPer1M: 6,
    latencySeconds: 0.4,
  },
];

// // // // // // // // //
// Qwen models
// // // // // // // // //

const QWEN_MODELS: TAIModelConfig[] = [
  {
    id: 'qwen/qwen-2.5-vl-7b-instruct',
    name: 'Qwen2.5-VL 7B Instruct',
    provider: 'Qwen',
    inputCostPer1M: 0,
    outputCostPer1M: 0,
    isFree: true,
    latencySeconds: 0.18,
  },
  {
    id: 'qwen/qwen3-4b',
    name: 'Qwen3 4B',
    provider: 'Qwen',
    inputCostPer1M: 0,
    outputCostPer1M: 0,
    isFree: true,
    latencySeconds: 0.1,
  },
  {
    id: 'qwen/qwen3-coder',
    name: 'Qwen3 Coder 480B A35B',
    provider: 'Qwen',
    inputCostPer1M: 0,
    outputCostPer1M: 0,
    isFree: true,
    latencySeconds: 0.3,
  },
  {
    id: 'qwen/qwen3-next-80b-a3b-instruct',
    name: 'Qwen3 Next 80B A3B Instruct',
    provider: 'Qwen',
    inputCostPer1M: 0,
    outputCostPer1M: 0,
    isFree: true,
    latencySeconds: 0.25,
  },
];

// // // // // // // // //
// Nvidia models
// // // // // // // // //

const NVIDIA_MODELS: TAIModelConfig[] = [
  {
    id: 'nvidia/nemotron-3-nano-30b-a3b',
    name: 'NVIDIA: Nemotron 3 Nano 30B A3B',
    provider: 'Nvidia',
    inputCostPer1M: 0,
    outputCostPer1M: 0,
    isFree: true,
    latencySeconds: 0.15,
  },
  {
    id: 'nvidia/nemotron-nano-12b-v2-vl',
    name: 'NVIDIA: Nemotron Nano 12B 2 VL',
    provider: 'Nvidia',
    inputCostPer1M: 0,
    outputCostPer1M: 0,
    isFree: true,
    latencySeconds: 0.18,
  },
  {
    id: 'nvidia/nemotron-nano-9b-v2',
    name: 'NVIDIA: Nemotron Nano 9B V2',
    provider: 'Nvidia',
    inputCostPer1M: 0,
    outputCostPer1M: 0,
    isFree: true,
    latencySeconds: 0.15,
  },
];

// // // // // // // // //
// StepFun models
// // // // // // // // //

const STEPFUN_MODELS: TAIModelConfig[] = [
  {
    id: 'stepfun/step-3.5-flash',
    name: 'StepFun 3.5 Flash',
    provider: 'StepFun',
    inputCostPer1M: 0,
    outputCostPer1M: 0,
    isFree: true,
    latencySeconds: 0.25,
  },
];

// // // // // // // // //
// AllenAI models
// // // // // // // // //

const ALLENAI_MODELS: TAIModelConfig[] = [
  {
    id: 'allenai/molmo-2-8b',
    name: 'Molmo2 8B',
    provider: 'AllenAI',
    inputCostPer1M: 0,
    outputCostPer1M: 0,
    isFree: true,
    latencySeconds: 0.2,
  },
];

// // // // // // // // //
// Arcee models
// // // // // // // // //

const ARCEE_MODELS: TAIModelConfig[] = [
  {
    id: 'arcee-ai/trinity-large-preview',
    name: 'Trinity Large Preview',
    provider: 'Arcee',
    inputCostPer1M: 0,
    outputCostPer1M: 0,
    isFree: true,
    latencySeconds: 0.3,
  },
  {
    id: 'arcee-ai/trinity-mini',
    name: 'Trinity Mini',
    provider: 'Arcee',
    inputCostPer1M: 0,
    outputCostPer1M: 0,
    isFree: true,
    latencySeconds: 0.15,
  },
];

// // // // // // // // //
// LiquidAI models
// // // // // // // // //

const LIQUIDAI_MODELS: TAIModelConfig[] = [
  {
    id: 'liquid/lfm-2.5-1.2b-instruct',
    name: 'LiquidAI LFM2.5-1.2B-Instruct',
    provider: 'LiquidAI',
    inputCostPer1M: 0,
    outputCostPer1M: 0,
    isFree: true,
    latencySeconds: 0.1,
  },
  {
    id: 'liquid/lfm-2.5-1.2b-thinking',
    name: 'LiquidAI LFM2.5-1.2B-Thinking',
    provider: 'LiquidAI',
    inputCostPer1M: 0,
    outputCostPer1M: 0,
    isFree: true,
    latencySeconds: 0.15,
  },
];

// // // // // // // // //
// TNG models
// // // // // // // // //

const TNG_MODELS: TAIModelConfig[] = [
  {
    id: 'tngtech/deepseek-r1t-chimera',
    name: 'TNG DeepSeek R1T Chimera',
    provider: 'TNG',
    inputCostPer1M: 0,
    outputCostPer1M: 0,
    isFree: true,
    latencySeconds: 1.5,
  },
  {
    id: 'tngtech/deepseek-r1t2-chimera',
    name: 'TNG DeepSeek R1T2 Chimera',
    provider: 'TNG',
    inputCostPer1M: 0,
    outputCostPer1M: 0,
    isFree: true,
    latencySeconds: 1.5,
  },
  {
    id: 'tngtech/tng-r1t-chimera',
    name: 'TNG R1T Chimera',
    provider: 'TNG',
    inputCostPer1M: 0,
    outputCostPer1M: 0,
    isFree: true,
    latencySeconds: 1.5,
  },
];

// // // // // // // // //
// Upstage models
// // // // // // // // //

const UPSTAGE_MODELS: TAIModelConfig[] = [
  {
    id: 'upstage/solar-pro-3',
    name: 'Upstage: Solar Pro 3',
    provider: 'Upstage',
    inputCostPer1M: 0,
    outputCostPer1M: 0,
    isFree: true,
    latencySeconds: 0.25,
  },
];

// // // // // // // // //
// Venice models
// // // // // // // // //

const VENICE_MODELS: TAIModelConfig[] = [
  {
    id: 'cognitivecomputations/dolphin-mistral-24b-venice-edition',
    name: 'Venice Uncensored',
    provider: 'Venice',
    inputCostPer1M: 0,
    outputCostPer1M: 0,
    isFree: true,
    latencySeconds: 0.3,
  },
];

// // // // // // // // //
// Zhipu models
// // // // // // // // //

const ZHIPU_MODELS: TAIModelConfig[] = [
  {
    id: 'z-ai/glm-4.5-air',
    name: 'Z.AI GLM 4.5 Air',
    provider: 'Zhipu',
    inputCostPer1M: 0,
    outputCostPer1M: 0,
    isFree: true,
    latencySeconds: 0.25,
  },
];

export const AI_MODEL_CONFIGS: TAIModelConfig[] = [
  ...ANTHROPIC_MODELS,
  ...OPENAI_MODELS,
  ...GOOGLE_MODELS,
  ...DEEPSEEK_MODELS,
  ...META_MODELS,
  ...MISTRAL_MODELS,
  ...QWEN_MODELS,
  ...NVIDIA_MODELS,
  ...STEPFUN_MODELS,
  ...ALLENAI_MODELS,
  ...ARCEE_MODELS,
  ...LIQUIDAI_MODELS,
  ...TNG_MODELS,
  ...UPSTAGE_MODELS,
  ...VENICE_MODELS,
  ...ZHIPU_MODELS,
];

// Alias for compatibility
export const AI_MODELS = AI_MODEL_CONFIGS;

export const getModelById = (modelId: string): TAIModelConfig | undefined =>
  AI_MODEL_CONFIGS.find((m) => m.id === modelId);

export const getModelConfig = getModelById;
