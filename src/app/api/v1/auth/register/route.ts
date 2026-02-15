import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma';
import { registerSchema } from '@/lib/validators/auth';
import { asyncWrapper, ClientError, successResponse, parseRequestJson } from '@/lib/api-utils';

export const POST = asyncWrapper(async (request: Request) => {
  const data = await parseRequestJson(request, registerSchema);

  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existing) {
    throw new ClientError('Email already registered', 409);
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      fullName: data.fullName,
      passwordHash,
      role: 'RESEARCHER',
      credits: 100,
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
    },
  });

  return successResponse({ user }, 201);
});
