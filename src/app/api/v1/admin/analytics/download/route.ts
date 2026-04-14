import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isAdminRole } from '@/lib/access';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/v1/admin/analytics/download?format=csv|json
 * Admin-only. Dumps per-user usage + counts + storage for offline analysis.
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (!me || !isAdminRole(me.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') || 'csv';

  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      plan: true,
      credits: true,
      isActive: true,
      pendingApproval: true,
      lastLoginAt: true,
      createdAt: true,
      _count: {
        select: {
          uploads: true,
        },
      },
    },
  });

  const userIds = users.map((u) => u.id);
  const [reactionCounts, mdCounts, fitCounts, bytesByUser, usageSumByUser] = await Promise.all([
    prisma.reaction.groupBy({
      by: ['userId'],
      where: { userId: { in: userIds } },
      _count: { userId: true },
    }),
    prisma.mDSimulation.groupBy({
      by: ['userId'],
      where: { userId: { in: userIds } },
      _count: { userId: true },
    }),
    prisma.fittingJob.groupBy({
      by: ['userId'],
      where: { userId: { in: userIds } },
      _count: { userId: true },
    }),
    prisma.fileUpload.groupBy({
      by: ['userId'],
      where: { userId: { in: userIds } },
      _sum: { sizeBytes: true },
    }),
    prisma.usageRecord.groupBy({
      by: ['userId'],
      where: { userId: { in: userIds } },
      _sum: { tokensUsed: true },
    }),
  ]);

  const rcMap = Object.fromEntries(reactionCounts.map((r) => [r.userId, r._count.userId]));
  const mdMap = Object.fromEntries(mdCounts.map((r) => [r.userId, r._count.userId]));
  const fitMap = Object.fromEntries(fitCounts.map((r) => [r.userId, r._count.userId]));
  const bytesMap = Object.fromEntries(bytesByUser.map((r) => [r.userId, r._sum.sizeBytes ?? 0]));
  const usageMap = Object.fromEntries(usageSumByUser.map((r) => [r.userId, Number(r._sum.tokensUsed ?? 0)]));

  const rows = users.map((u) => ({
    id: u.id,
    email: u.email,
    fullName: u.fullName,
    role: u.role,
    plan: u.plan ?? '',
    isActive: u.isActive,
    pendingApproval: u.pendingApproval,
    creditsRemaining: Number(u.credits),
    creditsUsed: usageMap[u.id] ?? 0,
    reactions: rcMap[u.id] ?? 0,
    mdSimulations: mdMap[u.id] ?? 0,
    fittingJobs: fitMap[u.id] ?? 0,
    totalCalculations: (rcMap[u.id] ?? 0) + (mdMap[u.id] ?? 0) + (fitMap[u.id] ?? 0),
    fileCount: u._count.uploads,
    storageBytes: bytesMap[u.id] ?? 0,
    lastLoginAt: u.lastLoginAt?.toISOString() ?? '',
    createdAt: u.createdAt.toISOString(),
  }));

  if (format === 'json') {
    return NextResponse.json(rows);
  }

  const headers = Object.keys(rows[0] ?? { id: '' });
  const csv = [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => JSON.stringify((r as Record<string, unknown>)[h] ?? '')).join(',')),
  ].join('\n');

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="transitivity-analytics-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
