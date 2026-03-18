import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { AI_MODEL_CONFIGS, getModelById } from '@/lib/ai-models';

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

  const modelConfig = getModelById(modelId);
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
            if (content !== undefined && content !== null && content !== '') {
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
    models: AI_MODEL_CONFIGS.map(m => ({
      id: m.id,
      name: m.name,
      provider: m.provider,
      isFree: m.isFree ?? false,
    })),
  });
}
