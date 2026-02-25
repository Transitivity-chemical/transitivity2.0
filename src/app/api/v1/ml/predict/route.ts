import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { proxyToFastAPI } from '@/lib/fastapi-proxy';
import {
  asyncWrapper,
  ClientError,
  successResponse,
  shouldBeAuthorized,
} from '@/lib/api-utils';

interface PredictBody {
  atoms: { element: string; x: number; y: number; z: number }[];
  model: string;
  task: string;
  name?: string;
  projectId?: string;
}

function mapModelToEnum(model: string) {
  const map: Record<string, 'ANI_2X' | 'MACE' | 'AIQM1'> = {
    'ANI-2x': 'ANI_2X',
    MACE: 'MACE',
    AIQM1: 'AIQM1',
  };
  return map[model] ?? 'ANI_2X';
}

function mapTaskToEnum(task: string) {
  const map: Record<string, 'SINGLE_POINT' | 'OPTIMIZATION'> = {
    energy: 'SINGLE_POINT',
    optimize: 'OPTIMIZATION',
  };
  return map[task] ?? 'SINGLE_POINT';
}

export const POST = asyncWrapper(async (request: Request) => {
  const session = await shouldBeAuthorized();
  const userId = session.user!.id!;

  const body: PredictBody = await request.json();

  if (!body.atoms || !Array.isArray(body.atoms) || body.atoms.length === 0) {
    throw new ClientError('At least one atom is required', 422);
  }

  const allowedModels = ['ANI-2x', 'MACE', 'AIQM1'];
  if (!allowedModels.includes(body.model)) {
    throw new ClientError(`Invalid model. Allowed: ${allowedModels.join(', ')}`, 422);
  }

  const allowedTasks = ['energy', 'optimize'];
  if (!allowedTasks.includes(body.task)) {
    throw new ClientError(`Invalid task. Allowed: ${allowedTasks.join(', ')}`, 422);
  }

  // Create MLJob with RUNNING status
  const mlJob = await prisma.mLJob.create({
    data: {
      userId,
      projectId: body.projectId ?? null,
      name: body.name ?? `${body.model} ${body.task} - ${body.atoms.length} atoms`,
      mlProvider: 'MLATOM',
      mlTaskType: mapTaskToEnum(body.task),
      neuralPotential: mapModelToEnum(body.model),
      status: 'RUNNING',
      inputData: {
        atoms: body.atoms,
        model: body.model,
        task: body.task,
      },
      startedAt: new Date(),
    },
  });

  try {
    // Proxy to FastAPI
    const result = await proxyToFastAPI<Record<string, unknown>>('/api/v1/ml/predict', {
      method: 'POST',
      body: JSON.stringify({
        atoms: body.atoms,
        model: body.model,
        task: body.task,
      }),
    });

    // Update job with result
    const updatedJob = await prisma.mLJob.update({
      where: { id: mlJob.id },
      data: {
        status: 'COMPLETED',
        resultData: result as Prisma.InputJsonValue,
        completedAt: new Date(),
      },
    });

    return successResponse({
      job: updatedJob,
      result,
    }, 201);
  } catch (error) {
    // Mark job as failed
    await prisma.mLJob.update({
      where: { id: mlJob.id },
      data: {
        status: 'FAILED',
        errorMessage: error instanceof Error ? error.message : 'Prediction failed',
        completedAt: new Date(),
      },
    });
    throw error;
  }
});
