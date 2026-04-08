import { Prisma, type FittingModelType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { fetchRemoteTheoryFit, runRemoteFit, type FittingRunRequest } from '@/lib/fitting-api';
import {
  buildFittingResultFromFitResult,
  buildFittingResultFromRemote,
  buildGsaFields,
  defaultPlotTypeForModel,
  theoryToModelType,
} from '@/lib/fitting-persistence';
import {
  asyncWrapper,
  ClientError,
  shouldBeAuthorized,
  successResponse,
} from '@/lib/api-utils';

export const POST = asyncWrapper(async (request: Request) => {
  const session = await shouldBeAuthorized();
  const userId = session.user!.id!;
  const body = await request.json();

  if (body?.theory) {
    const payload = body as FittingRunRequest;
    const modelType = theoryToModelType(payload.theory);
    const startedAt = new Date();

    const fittingJob = await prisma.fittingJob.create({
      data: {
        userId,
        name: `${payload.theory} fit`,
        plotType: defaultPlotTypeForModel(),
        modelType,
        status: 'RUNNING',
        inputData: payload as Prisma.InputJsonValue,
        startedAt,
        ...buildGsaFields(payload.gsa),
      },
    });

    try {
      const result = await fetchRemoteTheoryFit(payload);
      const completedAt = new Date();

      await prisma.fittingJob.update({
        where: { id: fittingJob.id },
        data: {
          status: 'COMPLETED',
          completedAt,
          computeTimeMs: completedAt.getTime() - startedAt.getTime(),
          result: {
            create: buildFittingResultFromRemote(result),
          },
        },
      });

      return successResponse({ result, jobId: fittingJob.id });
    } catch (error) {
      const completedAt = new Date();

      await prisma.fittingJob.update({
        where: { id: fittingJob.id },
        data: {
          status: 'FAILED',
          errorMessage: error instanceof Error ? error.message : 'Fitting failed',
          completedAt,
          computeTimeMs: completedAt.getTime() - startedAt.getTime(),
        },
      });

      throw new ClientError(
        error instanceof Error ? error.message : 'Fitting failed',
        502,
      );
    }
  }

  if (!body?.modelType) {
    throw new ClientError('theory or modelType is required', 400);
  }

  const modelType = body.modelType as FittingModelType;
  const startedAt = new Date();

  const fittingJob = await prisma.fittingJob.create({
    data: {
      userId,
      name: `${modelType} fit`,
      plotType: defaultPlotTypeForModel(),
      modelType,
      status: 'RUNNING',
      inputData: body as Prisma.InputJsonValue,
      startedAt,
      ...buildGsaFields(body.gsaParams),
    },
  });

  try {
    const result = await runRemoteFit(
      modelType,
      body.temperatures ?? [],
      body.rateConstants ?? [],
      body.gsaParams,
    );
    const completedAt = new Date();

    await prisma.fittingJob.update({
      where: { id: fittingJob.id },
      data: {
        status: 'COMPLETED',
        completedAt,
        computeTimeMs: completedAt.getTime() - startedAt.getTime(),
        result: {
          create: buildFittingResultFromFitResult(result),
        },
      },
    });

    return successResponse({ result, jobId: fittingJob.id });
  } catch (error) {
    const completedAt = new Date();

    await prisma.fittingJob.update({
      where: { id: fittingJob.id },
      data: {
        status: 'FAILED',
        errorMessage: error instanceof Error ? error.message : 'Fitting failed',
        completedAt,
        computeTimeMs: completedAt.getTime() - startedAt.getTime(),
      },
    });

    throw new ClientError(
      error instanceof Error ? error.message : 'Fitting failed',
      502,
    );
  }
});
