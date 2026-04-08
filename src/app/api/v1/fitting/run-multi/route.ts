import { Prisma, type FittingJob, type FittingModelType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { runRemoteFit, type FittingMultiRequest } from '@/lib/fitting-api';
import {
  buildFittingResultFromFitResult,
  buildGsaFields,
  defaultPlotTypeForModel,
} from '@/lib/fitting-persistence';
import {
  asyncWrapper,
  ClientError,
  shouldBeAuthorized,
  successResponse,
} from '@/lib/api-utils';

type MultiRunSuccess = {
  job: FittingJob;
  result: Awaited<ReturnType<typeof runRemoteFit>>;
};

export const POST = asyncWrapper(async (request: Request) => {
  const session = await shouldBeAuthorized();
  const userId = session.user!.id!;
  const body = (await request.json()) as FittingMultiRequest;

  if (!Array.isArray(body?.temperatures) || !Array.isArray(body?.rateConstants)) {
    throw new ClientError('temperatures and rateConstants are required', 400);
  }

  if (!Array.isArray(body?.modelTypes) || body.modelTypes.length === 0) {
    throw new ClientError('modelTypes is required', 400);
  }

  const jobs = await Promise.all(
    body.modelTypes.map((rawModelType) => {
      const modelType = rawModelType as FittingModelType;

      return (
      prisma.fittingJob.create({
        data: {
          userId,
          name: body.datasetName
            ? `${body.datasetName} - ${modelType}`
            : `${modelType} fit`,
          plotType: defaultPlotTypeForModel(),
          modelType,
          status: 'RUNNING',
          inputData: {
            temperatures: body.temperatures,
            rateConstants: body.rateConstants,
            modelType,
            datasetName: body.datasetName ?? null,
            gsaParams: body.gsaParams ?? null,
          } as Prisma.InputJsonValue,
          startedAt: new Date(),
          ...buildGsaFields(body.gsaParams),
        },
      })
    );
    }),
  );

  const settled = await Promise.allSettled(
    jobs.map((job, index) =>
      runRemoteFit(
        body.modelTypes[index],
        body.temperatures,
        body.rateConstants,
        body.gsaParams,
      ).then((result) => ({ job, result })),
    ),
  );

  const results = settled
    .filter((item): item is PromiseFulfilledResult<MultiRunSuccess> => item.status === 'fulfilled')
    .map((item) => item.value.result);

  const errors = settled
    .map((item, index) => ({ item, modelType: body.modelTypes[index], job: jobs[index] }))
    .filter((entry) => entry.item.status === 'rejected')
    .map((entry) => {
      const rejected = entry.item as PromiseRejectedResult;
      return {
        modelType: entry.modelType,
        error: rejected.reason instanceof Error ? rejected.reason.message : 'Unknown fitting error',
      };
    });

  await Promise.all(
    settled.map(async (item, index) => {
      const job = jobs[index];
      const completedAt = new Date();

      if (item.status === 'fulfilled') {
        await prisma.fittingJob.update({
          where: { id: job.id },
          data: {
            status: 'COMPLETED',
            completedAt,
            computeTimeMs: completedAt.getTime() - (job.startedAt?.getTime() ?? completedAt.getTime()),
            result: {
              create: buildFittingResultFromFitResult(item.value.result),
            },
          },
        });
        return;
      }

      await prisma.fittingJob.update({
        where: { id: job.id },
        data: {
          status: 'FAILED',
          errorMessage: item.reason instanceof Error ? item.reason.message : 'Unknown fitting error',
          completedAt,
          computeTimeMs: completedAt.getTime() - (job.startedAt?.getTime() ?? completedAt.getTime()),
        },
      });
    }),
  );

  return successResponse({
    results,
    errors,
    jobIds: jobs.map((job) => job.id),
  });
});
