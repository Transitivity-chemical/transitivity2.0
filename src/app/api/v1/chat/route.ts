export const maxDuration = 60;
export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { AI_MODEL_CONFIGS, getModelById } from '@/lib/ai-models';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Phase 11 of megaplan: chat with conversation persistence.
 *
 * Persists user + assistant messages to LLMConversation/LLMMessage so the
 * big-page assistant can resume conversations across sessions.
 *
 * Reference: docs/transitivity-overhaul-plan.md Phase 11
 *           docs/audit-frontend-current.md §9 (chat bug analysis)
 */

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

  const session = await auth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = (session?.user as any)?.id as string | undefined;

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { messages, model: modelId, conversationId: clientConvId, persist } = body as {
    messages?: { role: 'user' | 'assistant' | 'system'; content: string }[];
    model?: string;
    conversationId?: string | null;
    persist?: boolean;
  };

  if (!modelId || !messages || !Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: 'Missing model or messages' }, { status: 400 });
  }

  const modelConfig = getModelById(modelId);
  if (!modelConfig) {
    return Response.json({ error: `Invalid model: ${modelId}` }, { status: 400 });
  }

  // Conversation persistence (only when authenticated AND persist is requested)
  let conversationId: string | null = clientConvId ?? null;
  const shouldPersist = Boolean(userId && persist);

  if (shouldPersist && userId) {
    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
    if (!conversationId) {
      const conv = await prisma.lLMConversation.create({
        data: {
          userId,
          title: (lastUserMessage?.content || 'New chat').slice(0, 60),
          model: modelId,
        },
        select: { id: true },
      });
      conversationId = conv.id;
    }
    if (lastUserMessage) {
      await prisma.lLMMessage.create({
        data: {
          conversationId,
          role: 'USER',
          content: lastUserMessage.content,
          model: modelId,
        },
      });
    }
  }

  const client = getClient();

  try {
    const stream = await client.chat.completions.create({
      model: modelConfig.id,
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
      stream: true,
      max_tokens: 2048,
    });

    const encoder = new TextEncoder();
    let fullAssistant = '';
    const readable = new ReadableStream({
      async start(controller) {
        try {
          // Emit conversation_id event first if persisting
          if (conversationId && shouldPersist) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'conversation_id', id: conversationId })}\n\n`),
            );
          }
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content !== undefined && content !== null && content !== '') {
              fullAssistant += content;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));

          // Persist final assistant message
          if (conversationId && shouldPersist && fullAssistant) {
            try {
              await prisma.lLMMessage.create({
                data: {
                  conversationId,
                  role: 'ASSISTANT',
                  content: fullAssistant,
                  model: modelId,
                },
              });
            } catch (e) {
              console.error('[chat] persist assistant failed:', e);
            }
          }

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
    models: AI_MODEL_CONFIGS.map((m) => ({
      id: m.id,
      name: m.name,
      provider: m.provider,
      isFree: m.isFree ?? false,
    })),
  });
}
