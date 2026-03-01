import { prisma } from './prisma';

const OPERATION_COSTS: Record<string, number> = {
  RATE_CONSTANT_BASIC: 1.0,
  RATE_CONSTANT_FULL: 2.0,
  RATE_CONSTANT_SOLVENT: 3.0,
  GSA_FITTING: 2.0,
  MD_SINGLE: 1.0,
  MD_MULTIPLE: 5.0,
  ML_SINGLE_POINT: 3.0,
  ML_OPTIMIZATION: 5.0,
  ML_MD: 10.0,
  ML_TRAINING: 20.0,
  LLM_DEEPSEEK: 0.5,
  LLM_CLAUDE: 1.0,
  QC_EXTRACT: 0.5,
};

export async function trackUsage(
  userId: string,
  operation: string,
  metadata?: Record<string, unknown>,
) {
  const cost = OPERATION_COSTS[operation] || 1.0;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { credits: true },
  });

  if (!user) throw new Error('User not found');

  const credits = Number(user.credits);
  if (credits < cost) {
    throw new Error('Insufficient credits');
  }

  await prisma.$transaction([
    prisma.usageRecord.create({
      data: {
        userId,
        operation: operation as never,
        tokensUsed: cost,
        resourceType: 'CPU',
        metadata: metadata as never,
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { credits: { decrement: cost } },
    }),
  ]);

  return { cost, remaining: credits - cost };
}

export function getOperationCost(operation: string): number {
  return OPERATION_COSTS[operation] || 1.0;
}
